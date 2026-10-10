from __future__ import annotations

import base64
import os
import zlib
from pathlib import Path

import pytest

from llamatoolkit import crypto

# Real game install for integration tests. Never committed.
REAL_GAME = Path(os.environ.get("LLAMA_GAME_DIR", Path(__file__).parents[2] / "nwjs-test-game"))


def encrypt(plain: bytes, name: str, length: int = 0) -> bytes:
    """Inverse of crypto.decrypt, for building fixtures."""
    out = bytearray(plain)
    m = (crypto.mask(name) + 1) & 0xFF
    for i in range(length or len(plain)):
        c = plain[i] ^ m
        out[i] = c
        m = ((m << 1) ^ c) & 0xFF
    return crypto.SIGNATURE + bytes([length]) + bytes(out)


PAYLOAD = "console.log('hidden {payload}');\n"


def make_game(root: Path, *, payload: str = PAYLOAD, call_loader: bool = True) -> Path:
    """Build a minimal game tree whose loader layout mirrors the real one."""
    root.mkdir(parents=True)
    (root / "Game.exe").write_bytes(b"")
    plugins = root / "www" / "js" / "plugins"
    plugins.mkdir(parents=True)
    (root / "www" / "greenworks").mkdir()
    (root / "www" / "greenworks" / "greenworks.js").write_text("// steam\n")

    blob = base64.b64encode(zlib.compress(payload.encode())).decode()
    parts = [blob[:10], blob[10:25], blob[25:]]
    names = ["_0xaaa111_", "_0xbbb222_", "_0xccc333_"]

    (root / "www" / "js" / "plugins.js").write_text(
        "var $plugins =\n[\n"
        '{"name":"First","status":true,"description":"","parameters":{}},\n'
        '{"name":"Second","status":true,"description":"","parameters":{"x":"}"}},\n'
        '{"name":"Last","status":true,"description":"","parameters":{}},\n'
        '{"name":"Disabled","status":false,"description":"","parameters":{}},\n'
        "];\n"
    )
    (plugins / "First.js").write_text(
        f'var a = 1;function {names[0]}() {{ return "{parts[0]}"; }}\n'
        f'function {names[2]}() {{ return "{parts[2]}"; }}\n'
    )
    (plugins / "Second.js").write_text(
        "function _0xstr_(i){return ['x}','from'][i];}\n"
        "function _(){const k=_0xstr_;"
        f"let s={names[0]}()+{names[1]}()+{names[2]}(),b=Buffer[k(1)](s,'base64'),"
        "z=require('zlib')['inflateSync'](b);document.body.appendChild(z);}"
        f'function {names[1]}() {{ return "{parts[1]}"; }}\n'
    )
    (plugins / "Last.js").write_text("var x = 2;\n" + ("}_();\n" if call_loader else "}\n"))
    (plugins / "Disabled.js").write_text("_();\n")
    return root


@pytest.fixture
def game(tmp_path: Path) -> Path:
    return make_game(tmp_path / "game")
