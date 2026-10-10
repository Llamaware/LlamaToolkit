"""Asset decryption.

Encrypted assets are laid out as:

    b"TCOAAL" | length: u8 | body

The first ``length`` bytes of the body (all of it when ``length`` is 0) are
XORed with a rolling one-byte mask seeded from the uppercased file name.
"""

from __future__ import annotations

import shutil
import time
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

SIGNATURE = b"TCOAAL"


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


def decrypt(data: bytes, name: str) -> bytes:
    """Decrypt an asset. ``name`` is the asset's on-disk file name, unchanged."""
    if not is_encrypted(data):
        raise ValueError(f"{name}: missing {SIGNATURE.decode()} signature")
    body = data[len(SIGNATURE) + 1 :]
    length = data[len(SIGNATURE)] or len(body)
    return _xor_stream(body[:length], (mask(name) + 1) & 0xFF) + body[length:]


def guess_extension(data: bytes) -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data.startswith(b"OggS"):
        return ".ogg"
    if data.lstrip()[:1] in (b"{", b"["):
        return ".json"
    return ".bin"


@dataclass
class DecryptStats:
    decrypted: int = 0
    copied: int = 0
    failed: list[tuple[Path, str]] = field(default_factory=list)
    bytes: int = 0
    seconds: float = 0.0

    @property
    def files(self) -> int:
        return self.decrypted + self.copied

    def __iadd__(self, other: DecryptStats) -> DecryptStats:
        self.decrypted += other.decrypted
        self.copied += other.copied
        self.failed += other.failed
        self.bytes += other.bytes
        self.seconds += other.seconds
        return self


def decrypt_file(src: Path, dst_dir: Path) -> Path | None:
    """Decrypt ``src`` into ``dst_dir`` with a sniffed extension.

    Unencrypted files are copied unchanged and ``None`` is returned.
    """
    data = src.read_bytes()
    dst_dir.mkdir(parents=True, exist_ok=True)
    if not is_encrypted(data):
        shutil.copyfile(src, dst_dir / src.name)
        return None
    plain = decrypt(data, src.name)
    out = dst_dir / (src.name + guess_extension(plain))
    out.write_bytes(plain)
    return out


def _walk(root: Path) -> Iterator[Path]:
    return (p for p in sorted(root.rglob("*")) if p.is_file())


def decrypt_tree(src_root: Path, dst_root: Path, *, workers: int = 8, verbose: bool = False) -> DecryptStats:
    """Decrypt every file under ``src_root`` into ``dst_root``, keeping the layout."""
    stats = DecryptStats()
    start = time.perf_counter()

    def job(path: Path) -> tuple[Path | None, int]:
        out = decrypt_file(path, dst_root / path.parent.relative_to(src_root))
        return out, path.stat().st_size

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {p: pool.submit(job, p) for p in _walk(src_root)}
        for src, fut in futures.items():
            try:
                out, size = fut.result()
            except (OSError, ValueError) as exc:
                # Report the failing file without aborting the rest of the tree.
                stats.failed.append((src, str(exc)))
                continue
            stats.bytes += size
            if out is None:
                stats.copied += 1
            else:
                stats.decrypted += 1
            if verbose:
                print(f"{src} -> {out or 'copied unchanged'}")
    stats.seconds = time.perf_counter() - start
    return stats
