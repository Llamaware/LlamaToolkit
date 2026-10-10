"""Locating the game install and reading its layout."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path

from llamatoolkit import ToolkitError

EXECUTABLES = ("Game.exe", "nw.exe")

# plugins.js is a JS array literal (with trailing commas, so not valid JSON).
# Each entry starts with "name" then "status", which is all we need.
_PLUGIN_ENTRY = re.compile(r'"name"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"status"\s*:\s*(true|false)')


def is_game_dir(path: Path) -> bool:
    return any((path / exe).is_file() for exe in EXECUTABLES) and (path / "www").is_dir()


@dataclass(frozen=True)
class GameDir:
    root: Path

    @classmethod
    def find(cls, path: str | Path | None = None) -> GameDir:
        """Resolve the game directory.

        An explicit path must be a game directory. Otherwise try the working
        directory, then the directory holding the frozen executable, so that
        double-clicking the exe inside the game folder works.
        """
        if path is not None:
            candidates = [Path(path)]
        else:
            candidates = [Path.cwd()]
            if getattr(sys, "frozen", False):
                candidates.append(Path(sys.executable).parent)
        for candidate in candidates:
            if is_game_dir(candidate):
                return cls(candidate.resolve())
        where = ", ".join(str(c) for c in candidates)
        raise ToolkitError(f"Game not found in {where} (expected {' or '.join(EXECUTABLES)} and www/).")

    @property
    def www(self) -> Path:
        return self.root / "www"

    @property
    def js(self) -> Path:
        return self.www / "js"

    @property
    def plugins_dir(self) -> Path:
        return self.js / "plugins"

    @property
    def greenworks_dir(self) -> Path:
        return self.www / "greenworks"

    def enabled_plugins(self) -> list[Path]:
        """Plugin files in load order, skipping disabled ones."""
        text = (self.js / "plugins.js").read_text(encoding="utf-8")
        return [
            self.plugins_dir / f"{name}.js"
            for name, status in _PLUGIN_ENTRY.findall(text)
            if status == "true"
        ]
