"""Command-line interface."""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from llamatoolkit import ToolkitError, __version__
from llamatoolkit.game import GameDir, is_game_dir

ASSET_DIRS = ("audio", "data", "img")
OBFUSCATED_NAME = "script_obfuscated.js"
DEOBFUSCATED_NAME = "script_deobfuscated.js"


def _size(n: float) -> str:
    for unit in ("B", "KB", "MB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.2f} GB"


def _duration(seconds: float) -> str:
    return f"{seconds * 1000:.0f} ms" if seconds < 1 else f"{seconds:.2f} s"


def _list_paths(what: str, paths: list[Path], limit: int = 10) -> None:
    if not paths:
        return
    print(f"{len(paths)} file(s) {what}:")
    for path in paths[:limit]:
        print(f"  {path}")
    if len(paths) > limit:
        print(f"  ... and {len(paths) - limit} more (list them all with --verbose)")


def cmd_decrypt(args: argparse.Namespace) -> None:
    from llamatoolkit import crypto

    output = Path(args.output)
    src = Path(args.input) if args.input else GameDir.find().root

    if src.is_file():
        result = crypto.decrypt_file(src, output)
        if result is None:
            print(f"{src} is not encrypted; copied unchanged.")
        else:
            out, source = result
            print(f"Saved to {out}{crypto.SOURCE_NOTES[source]}")
        return
    if not src.is_dir():
        raise ToolkitError(f"{src} does not exist.")

    if is_game_dir(src):
        www = GameDir(src).www
        roots = [(www / d, output / d) for d in ASSET_DIRS if (www / d).is_dir()]
    else:
        roots = [(src, output)]

    print(f"Decrypting {src} ...")
    total = crypto.DecryptStats()
    for root, dst in roots:
        stats = crypto.decrypt_tree(root, dst, verbose=args.verbose)
        print(f"  {root.name + ':':<8} {stats.files:>5} files  {_size(stats.bytes):>9}  "
              f"{_duration(stats.seconds):>7}")
        total += stats
    for path, reason in total.failed:
        print(f"  failed: {path}: {reason}", file=sys.stderr)
    rate = total.bytes / total.seconds if total.seconds else 0
    print(f"Decrypted {total.decrypted} files ({_size(total.bytes)}) in "
          f"{_duration(total.seconds)}, {_size(rate)}/s")
    print(f"{total.copied} copied unchanged, {len(total.failed)} failed -> {output}")
    _list_paths("did not match their name; seed recovered from the file header", total.recovered)
    _list_paths("have an unknown format; their first 8 bytes are unverified", total.unverified)
    if total.failed:
        raise ToolkitError(f"{len(total.failed)} file(s) failed to decrypt.")


def cmd_dedrm(args: argparse.Namespace) -> None:
    from llamatoolkit import drm

    drm.dedrm(GameDir.find(args.game))
    print("DRM removed. The game can now be launched without Steam.")


def cmd_redrm(args: argparse.Namespace) -> None:
    from llamatoolkit import drm

    drm.redrm(GameDir.find(args.game))
    print("DRM restored.")


def _extract(game_arg: str | None):
    from llamatoolkit import payload

    found = payload.extract(GameDir.find(game_arg))
    where = f", called from {found.caller_file.name}" if found.caller_file else ""
    print(f"Loader _() in {found.loader_file.name}{where}; {len(found.pieces)} pieces.")
    if found.caller_file is None:
        print("warning: no _() call found in the enabled plugins.", file=sys.stderr)
    return found


def cmd_dump(args: argparse.Namespace) -> None:
    found = _extract(args.game)
    Path(args.output).write_text(found.code, encoding="utf-8")
    print(f"Obfuscated script written to {args.output}")


def cmd_deob(args: argparse.Namespace) -> None:
    from llamatoolkit.deob import deobfuscate

    if args.file:
        code = Path(args.file).read_text(encoding="utf-8")
    else:
        code = _extract(args.game).code
    print("Deobfuscating ...")
    Path(args.output).write_text(deobfuscate(code), encoding="utf-8")
    print(f"Deobfuscated script written to {args.output}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="LlamaToolkit",
        description="Decompilation toolkit for The Coffin of Andy and Leyley by Llamaware. "
        "If no game directory is provided, defaults to the current directory.",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command", metavar="<command>")

    p = sub.add_parser("decrypt", help="decrypt game assets")
    p.add_argument("input", nargs="?",
                   help="file, folder, or game directory (default: game in current directory)")
    p.add_argument("output", nargs="?", default="decrypted", help="output folder (default: decrypted)")
    p.add_argument("-v", "--verbose", action="store_true", help="list every file")
    p.set_defaults(func=cmd_decrypt)

    p = sub.add_parser("dedrm", help="allow launching the game without Steam")
    p.add_argument("game", nargs="?", help="game directory")
    p.set_defaults(func=cmd_dedrm)

    p = sub.add_parser("redrm", help="undo dedrm")
    p.add_argument("game", nargs="?", help="game directory")
    p.set_defaults(func=cmd_redrm)

    p = sub.add_parser("dump", help="extract the hidden game script, still obfuscated")
    p.add_argument("game", nargs="?", help="game directory")
    p.add_argument("-o", "--output", default=OBFUSCATED_NAME, help=f"output file (default: {OBFUSCATED_NAME})")
    p.set_defaults(func=cmd_dump)

    p = sub.add_parser("deob", help="extract the hidden game script and deobfuscate it")
    p.add_argument("game", nargs="?", help="game directory")
    p.add_argument("-f", "--file", help="deobfuscate this file instead of extracting from the game")
    p.add_argument("-o", "--output", default=DEOBFUSCATED_NAME, help=f"output file (default: {DEOBFUSCATED_NAME})")
    p.set_defaults(func=cmd_deob)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.command:
        # A person at a console (e.g. the exe was double-clicked) gets the menu.
        # Piped or automated runs keep the old behaviour of printing help.
        if sys.stdin is not None and sys.stdin.isatty():
            from llamatoolkit import interactive

            return interactive.run()
        parser.print_help()
        return 0
    start = time.perf_counter()
    try:
        args.func(args)
    except ToolkitError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"Done in {time.perf_counter() - start:.1f}s.")
    return 0
