"""Menu shown when the exe is started without arguments (e.g. double-clicked)."""

from __future__ import annotations

import argparse
from collections.abc import Callable

from llamatoolkit import ToolkitError, __version__, cli, drm
from llamatoolkit.game import GameDir

Input = Callable[[str], str]


def _locate_game(ask: Input) -> GameDir | None:
    try:
        return GameDir.find()
    except ToolkitError:
        print("No game found next to LlamaToolkit.")
    while True:
        # Dragging a folder onto the console pastes its path, quoted if it has spaces.
        path = ask("Drag the game folder here and press Enter (blank to exit): ").strip().strip('"')
        if not path:
            return None
        try:
            return GameDir.find(path)
        except ToolkitError as exc:
            print(exc)


def run(ask: Input = input) -> int:
    print(f"LlamaToolkit v{__version__}")
    print("Decompilation Toolkit for The Coffin of Andy and Leyley by Llamaware")
    try:
        game = _locate_game(ask)
        if game is None:
            return 0
        print(f"Game found: {game.root}")
        root = game.root

        while True:
            removed = drm.is_removed(game)
            # (label, detail, action) per numbered option.
            options: list[tuple[str, str, Callable[[], None]]] = [
                ("Decrypt assets", f"-> {root / 'decrypted'}",
                 lambda: cli.cmd_decrypt(argparse.Namespace(
                     input=str(root), output=str(root / "decrypted"), verbose=False))),
                ("Extract game script (deobfuscated)", f"-> {root / cli.DEOBFUSCATED_NAME}",
                 lambda: cli.cmd_deob(argparse.Namespace(
                     game=str(root), file=None, output=str(root / cli.DEOBFUSCATED_NAME)))),
                ("Extract game script (obfuscated)", f"-> {root / cli.OBFUSCATED_NAME}",
                 lambda: cli.cmd_dump(argparse.Namespace(
                     game=str(root), output=str(root / cli.OBFUSCATED_NAME)))),
                ("Restore DRM" if removed else "Remove DRM",
                 f"(currently: DRM {'removed' if removed else 'present'})",
                 lambda: (cli.cmd_redrm if removed else cli.cmd_dedrm)(
                     argparse.Namespace(game=str(root)))),
            ]
            width = max(len(label) for label, _, _ in options)
            print()
            for number, (label, detail, _) in enumerate(options, 1):
                print(f"  {number}. {label:<{width}}  {detail}")
            print("  0. Exit")
            choice = ask("\nChoose: ").strip()
            print()

            actions = {str(n): action for n, (_, _, action) in enumerate(options, 1)}
            if choice in ("0", ""):
                return 0
            if choice not in actions:
                print(f"Unknown option: {choice}")
                continue
            try:
                actions[choice]()
            except ToolkitError as exc:
                print(f"error: {exc}")
    except (EOFError, KeyboardInterrupt):
        print()
        return 0
