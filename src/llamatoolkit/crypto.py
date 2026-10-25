"""Asset decryption.

Encrypted assets are laid out as:

    b"TCOAAL" | length: u8 | body

The first ``length`` bytes of the body (all of it when ``length`` is 0) are
XORed with a rolling one-byte mask seeded from the uppercased file name.
"""

from __future__ import annotations

import json
import shutil
import time
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

SIGNATURE = b"TCOAAL"
PNG_HEADER = b"\x89PNG\r\n\x1a\n"
OGG_HEADER = b"OggS"

_TEXT = frozenset(b"\t\n\r" + bytes(range(0x20, 0x7F)))
# Bytes checked for printable text when picking a JSON seed. Bytes 8 and on
# are the same for every seed, so they rule out JSON for binary files.
_TEXT_PROBE = 64

# Where decrypt found the seed: the file name, the file header (the name did not
# match), or the name with a header of no known format.
SeedSource = Literal["name", "header", "unverified"]
SOURCE_NOTES: dict[SeedSource, str] = {
    "name": "",
    "header": " (name did not match; seed recovered from the file header)",
    "unverified": " (unknown format; first 8 bytes unverified)",
}


def mask(name: str) -> int:
    value = 0
    for ch in name.upper():
        value = (value << 1) ^ ord(ch)
    return value


def is_encrypted(data: bytes) -> bool:
    return data.startswith(SIGNATURE) and len(data) > len(SIGNATURE)


# _SHL[k] maps each byte b to (b << k) & 0xFF, for use with bytes.translate.
_SHL = [bytes((b << k) & 0xFF for b in range(256)) for k in range(8)]


def _xor_stream(cipher: bytes, seed: int) -> bytes:
    """Decrypt ``cipher`` with the rolling mask, without a per-byte Python loop.

    The mask evolves as ``m[i+1] = (m[i] << 1 ^ c[i]) & 0xFF``. Bits shifted
    past bit 7 are lost, so each mask byte depends only on the seed and the
    previous 8 cipher bytes:

        m[i] = (seed << i) ^ XOR_{k=1..8} (c[i-k] << (k-1))      (mod 256)

    Each term is a shifted and translated copy of ``cipher``. XORing them as
    big integers keeps the work in C.
    """
    n = len(cipher)
    if n == 0:
        return b""
    acc = int.from_bytes(cipher, "big")
    for k in range(1, min(n, 8) + 1):
        lagged = bytes(k) + cipher[: n - k].translate(_SHL[k - 1])
        acc ^= int.from_bytes(lagged, "big")
    head = bytes((seed << i) & 0xFF for i in range(min(n, 8)))
    acc ^= int.from_bytes(head + bytes(n - len(head)), "big")
    return acc.to_bytes(n, "big")


def _plausible(plain: bytes) -> bool:
    """Cheap check that ``plain`` starts like a PNG, OGG or text asset."""
    return plain.startswith((PNG_HEADER, OGG_HEADER)) or set(plain[:8]) <= _TEXT


def _is_json(plain: bytes) -> bool:
    try:
        json.loads(plain)
    except ValueError:
        return False
    return True


def _recover(plain: bytes, body: bytes, length: int) -> bytes | None:
    """Redo the seed-dependent head of ``plain`` without the file name.

    Only the first 8 bytes depend on the seed (see ``_xor_stream``), and the
    first mask byte is the seed itself, so each expected first byte gives one
    candidate. A wrong seed sets bit 7 in one of the first 8 bytes, so for JSON
    a printable start picks the seed; json.loads decides when it cannot.
    """
    n = min(length, 8)

    def candidate(first: int) -> bytes:
        return _xor_stream(body[:n], body[0] ^ first) + plain[n:8]

    for header in (PNG_HEADER, OGG_HEADER):
        head = candidate(header[0])
        if head.startswith(header):
            return head + plain[8:]
    heads = [candidate(c) for c in b"{["]
    text = [h for h in heads if set(h + plain[8:_TEXT_PROBE]) <= _TEXT]
    if len(text) == 1:
        return text[0] + plain[8:]
    for head in heads:
        if _is_json(head + plain[8:]):
            return head + plain[8:]
    return None


def decrypt_with_source(data: bytes, name: str) -> tuple[bytes, SeedSource]:
    """Decrypt an asset. ``name`` is the asset's on-disk file name, unchanged.

    If the name gives an unrecognized header (say, the file was renamed), the
    seed is recovered from the header instead. Failing that, the name-based
    result is returned as "unverified".
    """
    if not is_encrypted(data):
        raise ValueError(f"{name}: missing {SIGNATURE.decode()} signature")
    body = data[len(SIGNATURE) + 1 :]
    length = data[len(SIGNATURE)] or len(body)
    plain = _xor_stream(body[:length], (mask(name) + 1) & 0xFF) + body[length:]
    if _plausible(plain) or _is_json(plain):
        return plain, "name"
    recovered = _recover(plain, body, length)
    return (recovered, "header") if recovered is not None else (plain, "unverified")


def decrypt(data: bytes, name: str) -> bytes:
    """Decrypt an asset; see ``decrypt_with_source``."""
    return decrypt_with_source(data, name)[0]


def guess_extension(data: bytes) -> str:
    if data.startswith(PNG_HEADER):
        return ".png"
    if data.startswith(OGG_HEADER):
        return ".ogg"
    if data.lstrip()[:1] in (b"{", b"["):
        return ".json"
    return ".bin"


@dataclass
class DecryptStats:
    decrypted: int = 0
    copied: int = 0
    failed: list[tuple[Path, str]] = field(default_factory=list)
    recovered: list[Path] = field(default_factory=list)
    unverified: list[Path] = field(default_factory=list)
    bytes: int = 0
    seconds: float = 0.0

    @property
    def files(self) -> int:
        return self.decrypted + self.copied

    def __iadd__(self, other: DecryptStats) -> DecryptStats:
        self.decrypted += other.decrypted
        self.copied += other.copied
        self.failed += other.failed
        self.recovered += other.recovered
        self.unverified += other.unverified
        self.bytes += other.bytes
        self.seconds += other.seconds
        return self


def decrypt_file(src: Path, dst_dir: Path) -> tuple[Path, SeedSource] | None:
    """Decrypt ``src`` into ``dst_dir`` with a sniffed extension.

    Returns the output path and where the seed came from. Unencrypted files
    are copied unchanged and ``None`` is returned.
    """
    data = src.read_bytes()
    dst_dir.mkdir(parents=True, exist_ok=True)
    if not is_encrypted(data):
        shutil.copyfile(src, dst_dir / src.name)
        return None
    plain, source = decrypt_with_source(data, src.name)
    out = dst_dir / (src.name + guess_extension(plain))
    out.write_bytes(plain)
    return out, source


def _walk(root: Path) -> Iterator[Path]:
    return (p for p in sorted(root.rglob("*")) if p.is_file())


def decrypt_tree(src_root: Path, dst_root: Path, *, workers: int = 8, verbose: bool = False) -> DecryptStats:
    """Decrypt every file under ``src_root`` into ``dst_root``, keeping the layout."""
    stats = DecryptStats()
    start = time.perf_counter()

    def job(path: Path) -> tuple[tuple[Path, SeedSource] | None, int]:
        result = decrypt_file(path, dst_root / path.parent.relative_to(src_root))
        return result, path.stat().st_size

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {p: pool.submit(job, p) for p in _walk(src_root)}
        for src, fut in futures.items():
            try:
                result, size = fut.result()
            except (OSError, ValueError) as exc:
                # Report the failing file without aborting the rest of the tree.
                stats.failed.append((src, str(exc)))
                continue
            stats.bytes += size
            if result is None:
                stats.copied += 1
                if verbose:
                    print(f"{src} -> copied unchanged")
                continue
            out, source = result
            stats.decrypted += 1
            if source == "header":
                stats.recovered.append(src)
            elif source == "unverified":
                stats.unverified.append(src)
            if verbose:
                print(f"{src} -> {out}{SOURCE_NOTES[source]}")
    stats.seconds = time.perf_counter() - start
    return stats
