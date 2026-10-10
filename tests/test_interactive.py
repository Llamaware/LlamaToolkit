import pytest
from conftest import PAYLOAD

from llamatoolkit import cli, drm, interactive
from llamatoolkit.game import GameDir


def feed(*answers):
    """An input() replacement that returns ``answers`` in order, then EOF."""
    it = iter(answers)

    def ask(prompt):
        print(prompt, end="")
        try:
            return next(it)
        except StopIteration:
            raise EOFError from None

    return ask


def test_finds_game_in_cwd_and_dumps(game, monkeypatch, capsys):
    monkeypatch.chdir(game)
    assert interactive.run(feed("3", "0")) == 0
    assert (game / cli.OBFUSCATED_NAME).read_text(encoding="utf-8") == PAYLOAD
    assert f"Game found: {game.resolve()}" in capsys.readouterr().out


def test_asks_for_game_path(game, tmp_path, monkeypatch, capsys):
    monkeypatch.chdir(tmp_path)
    assert interactive.run(feed(str(tmp_path / "nope"), f'"{game}"', "0")) == 0
    out = capsys.readouterr().out
    assert "Game not found" in out
    assert "Game found" in out


def test_blank_path_exits(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert interactive.run(feed("")) == 0


def test_drm_toggle(game, monkeypatch, capsys):
    monkeypatch.chdir(game)
    assert interactive.run(feed("4", "4", "0")) == 0
    out = capsys.readouterr().out
    assert "DRM removed." in out
    assert "DRM restored." in out
    assert not drm.is_removed(GameDir(game))


def test_errors_keep_menu_open(game, monkeypatch, capsys):
    monkeypatch.chdir(game)
    (game / "www" / "js" / "plugins" / "Second.js").write_text("// loader gone\n")
    assert interactive.run(feed("2", "9", "0")) == 0
    out = capsys.readouterr().out
    assert "error: Loader function _() not found" in out
    assert "Unknown option: 9" in out


@pytest.mark.parametrize("ending", [EOFError, KeyboardInterrupt])
def test_eof_and_ctrl_c_exit_cleanly(game, monkeypatch, ending):
    monkeypatch.chdir(game)

    def ask(prompt):
        raise ending

    assert interactive.run(ask) == 0
