import pytest
from conftest import PAYLOAD, REAL_GAME, make_game

from llamatoolkit import ToolkitError, payload
from llamatoolkit.game import GameDir


def test_extract(game):
    found = payload.extract(GameDir.find(game))
    assert found.code == PAYLOAD
    assert found.loader_file.name == "Second.js"
    assert found.caller_file.name == "Last.js"
    assert [p.name for p in found.pieces] == ["_0xaaa111_", "_0xbbb222_", "_0xccc333_"]
    assert [p.file.name for p in found.pieces] == ["First.js", "Second.js", "First.js"]


def test_disabled_plugins_skipped(game):
    names = [p.name for p in GameDir.find(game).enabled_plugins()]
    assert names == ["First.js", "Second.js", "Last.js"]


def test_missing_call_still_extracts(tmp_path):
    found = payload.extract(GameDir.find(make_game(tmp_path / "g", call_loader=False)))
    assert found.code == PAYLOAD
    assert found.caller_file is None


def test_missing_loader(game):
    second = game / "www" / "js" / "plugins" / "Second.js"
    second.write_text(second.read_text().replace("function _()", "function notit()"))
    with pytest.raises(ToolkitError, match="not found"):
        payload.extract(GameDir.find(game))


def test_missing_piece(game):
    first = game / "www" / "js" / "plugins" / "First.js"
    first.write_text(first.read_text().replace("_0xccc333_", "_0xdeleted_"))
    with pytest.raises(ToolkitError, match="_0xccc333_"):
        payload.extract(GameDir.find(game))


def test_corrupt_piece(game):
    first = game / "www" / "js" / "plugins" / "First.js"
    src = first.read_text()
    first.write_text(src.replace('return "', 'return "AAAA', 1))
    with pytest.raises(ToolkitError, match="failed to decode"):
        payload.extract(GameDir.find(game))


@pytest.mark.skipif(not REAL_GAME.is_dir(), reason="real game not available")
def test_real_game():
    found = payload.extract(GameDir.find(REAL_GAME))
    assert found.caller_file is not None
    assert found.caller_file == GameDir.find(REAL_GAME).enabled_plugins()[-1]
    assert len(found.code) > 10_000
