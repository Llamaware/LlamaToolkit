"""Deobfuscation of the extracted script."""

from __future__ import annotations

from pyjsclear import deobfuscate as _pyjsclear


def deobfuscate(code: str) -> str:
    return _pyjsclear(code)
