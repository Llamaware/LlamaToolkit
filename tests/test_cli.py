import pytest
from conftest import PAYLOAD, encrypt

from llamatoolkit import drm
from llamatoolkit.cli import main


def test_no_args_prints_help(capsys):
    assert main([]) == 0
    assert "decrypt" in capsys.readouterr().out


def test_bad_game_dir(tmp_path, capsys):
    assert main(["dedrm", str(tmp_path)]) == 1
    assert "Game not found" in capsys.readouterr().err


def test_dedrm_redrm_round_trip(game):
    gw = game / "www" / "greenworks"
    assert main(["dedrm", str(game)]) == 0
    assert (gw / "greenworks.js").read_bytes() == drm.stub_source()
    assert (gw / "greenworks.bak").read_text() == "// steam\n"
    assert main(["dedrm", str(game)]) == 1
    assert main(["redrm", str(game)]) == 0
    assert (gw / "greenworks.js").read_text() == "// steam\n"
    assert not (gw / "greenworks.bak").exists()
    assert main(["redrm", str(game)]) == 1


def test_decrypt_game_dir(game, tmp_path):
    data = game / "www" / "data"
    data.mkdir()
    (data / "abcd").write_bytes(encrypt(b'{"x":1}', "abcd"))
    out = tmp_path / "out"
    assert main(["decrypt", str(game), str(out)]) == 0
    assert (out / "data" / "abcd.json").read_bytes() == b'{"x":1}'


def test_dump(game, tmp_path):
    out = tmp_path / "input.js"
    assert main(["dump", str(game), "-o", str(out)]) == 0
    assert out.read_text(encoding="utf-8") == PAYLOAD


@pytest.mark.parametrize("from_file", [False, True])
def test_deob(game, tmp_path, from_file):
    out = tmp_path / "output.js"
    if from_file:
        src = tmp_path / "input.js"
        src.write_text(PAYLOAD, encoding="utf-8")
        args = ["deob", "-f", str(src), "-o", str(out)]
    else:
        args = ["deob", str(game), "-o", str(out)]
    assert main(args) == 0
    assert "hidden {payload}" in out.read_text(encoding="utf-8")
