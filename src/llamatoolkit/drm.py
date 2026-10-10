"""Swapping the Steam greenworks module for an offline stub, and back."""

from __future__ import annotations

from importlib.resources import files

from llamatoolkit import ToolkitError
from llamatoolkit.game import GameDir


def stub_source() -> bytes:
    return files("llamatoolkit").joinpath("assets", "greenworks.js").read_bytes()


def is_removed(game: GameDir) -> bool:
    return (game.greenworks_dir / "greenworks.bak").exists()


def dedrm(game: GameDir) -> None:
    original = game.greenworks_dir / "greenworks.js"
    backup = game.greenworks_dir / "greenworks.bak"
    if backup.exists():
        raise ToolkitError("DRM is already removed (greenworks.bak exists).")
    if not original.is_file():
        raise ToolkitError(f"{original} not found.")
    original.rename(backup)
    original.write_bytes(stub_source())


def redrm(game: GameDir) -> None:
    original = game.greenworks_dir / "greenworks.js"
    backup = game.greenworks_dir / "greenworks.bak"
    if not backup.is_file():
        raise ToolkitError("DRM is already present (no greenworks.bak to restore).")
    backup.replace(original)
