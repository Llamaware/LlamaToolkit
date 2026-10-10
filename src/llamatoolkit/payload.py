"""Static extraction of the game's hidden script.

The game hides its main script as a zlib stream, base64-encoded and split
across several functions spread over the plugin files:

    function _0x375027_() { return "eJzs..."; }       // in plugin A
    function _0x30b90a_() { return "..."; }           // in plugin B
    function _() {
        let s = _0x375027_() + _0x30b90a_() + ...,
            b = Buffer.from(s, 'base64'),
            js = require('zlib').inflateSync(b);
        // appended to the page as a <script>
    }

and ``_()`` is invoked from the last enabled plugin. We reassemble and inflate
the stream directly instead of running the game.
"""

from __future__ import annotations

import base64
import binascii
import re
import zlib
from dataclasses import dataclass
from pathlib import Path

from llamatoolkit import ToolkitError
from llamatoolkit.game import GameDir

_IDENT = r"[A-Za-z_$][\w$]*"
_LOADER_DEF = re.compile(r"function\s+_\s*\(\s*\)\s*\{")
# A bare `_()` call statement, not part of a longer identifier, member access
# or the definition itself.
_LOADER_CALL = re.compile(r"(?<![\w$.])(?<!function )_\s*\(\s*\)(?!\s*\{)")
_CALL_CHAIN = re.compile(rf"{_IDENT}\s*\(\s*\)(?:\s*\+\s*{_IDENT}\s*\(\s*\))*")
_CALLEE = re.compile(rf"({_IDENT})\s*\(")
_PIECE = re.compile(
    rf"function\s+({_IDENT})\s*\(\s*\)\s*\{{\s*return\s*([\"'])([A-Za-z0-9+/=]*)\2\s*;?\s*\}}"
)


@dataclass(frozen=True)
class Piece:
    name: str
    file: Path
    data: str


@dataclass(frozen=True)
class Payload:
    code: str
    loader_file: Path
    caller_file: Path | None
    pieces: list[Piece]


def _function_body(src: str, open_brace: int) -> str:
    """Return the text between the brace at ``open_brace`` and its match.

    Skips string literals so braces inside them don't count. Regex literals
    and comments are not handled; the loader contains neither.
    """
    depth = 0
    i = open_brace
    quote = None
    while i < len(src):
        ch = src[i]
        if quote:
            if ch == "\\":
                i += 1
            elif ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return src[open_brace + 1 : i]
        i += 1
    raise ToolkitError("Loader function _() is not closed.")


def _read_sources(game: GameDir) -> dict[Path, str]:
    return {
        p: p.read_text(encoding="utf-8", errors="replace")
        for p in sorted(game.plugins_dir.glob("*.js"))
    }


def find_caller(game: GameDir, sources: dict[Path, str]) -> Path | None:
    """The plugin that calls ``_()``, expected to be the last enabled plugin."""
    plugins = game.enabled_plugins()
    if plugins and _LOADER_CALL.search(sources.get(plugins[-1], "")):
        return plugins[-1]
    for path in reversed(plugins):
        if _LOADER_CALL.search(sources.get(path, "")):
            return path
    return None


def find_loader(sources: dict[Path, str]) -> tuple[Path, list[str]]:
    """Locate ``function _()`` and return its file and ordered piece names."""
    found = [(p, m) for p, s in sources.items() for m in _LOADER_DEF.finditer(s)]
    if not found:
        raise ToolkitError("Loader function _() not found in any plugin.")
    if len(found) > 1:
        names = ", ".join(p.name for p, _ in found)
        raise ToolkitError(f"Multiple definitions of _() found: {names}")
    path, match = found[0]
    body = _function_body(sources[path], match.end() - 1)
    chains = [m.group(0) for m in _CALL_CHAIN.finditer(body)]
    if not chains:
        raise ToolkitError(f"No piece concatenation found inside _() in {path.name}.")
    chain = max(chains, key=lambda c: c.count("+"))
    return path, _CALLEE.findall(chain)


def find_pieces(sources: dict[Path, str]) -> dict[str, Piece]:
    pieces: dict[str, Piece] = {}
    for path, src in sources.items():
        for name, _, data in _PIECE.findall(src):
            pieces[name] = Piece(name, path, data)
    return pieces


def extract(game: GameDir) -> Payload:
    sources = _read_sources(game)
    loader_file, order = find_loader(sources)
    available = find_pieces(sources)
    missing = [n for n in order if n not in available]
    if missing:
        raise ToolkitError(f"Pieces referenced by _() not found: {', '.join(missing)}")
    pieces = [available[n] for n in order]

    try:
        raw = zlib.decompress(base64.b64decode("".join(p.data for p in pieces), validate=True))
        code = raw.decode("utf-8")
    except (binascii.Error, zlib.error, UnicodeDecodeError) as exc:
        raise ToolkitError(f"Reassembled payload failed to decode: {exc}") from exc

    return Payload(code, loader_file, find_caller(game, sources), pieces)
