import os
import random

import pytest
from conftest import REAL_GAME, encrypt

from llamatoolkit import crypto


def reference_xor(cipher: bytes, seed: int) -> bytes:
    out = bytearray(cipher)
    for i, c in enumerate(cipher):
        out[i] = c ^ seed
        seed = ((seed << 1) ^ c) & 0xFF
    return bytes(out)


@pytest.mark.parametrize("n", [0, 1, 7, 8, 9, 64, 1000])
def test_fast_xor_matches_reference(n):
    rng = random.Random(n)
    for _ in range(20):
        cipher = os.urandom(n)
        seed = rng.randrange(256)
        assert crypto._xor_stream(cipher, seed) == reference_xor(cipher, seed)


@pytest.mark.parametrize("length", [0, 1, 5, 128])
def test_round_trip(length):
    plain = b"\x89PNG\r\n\x1a\n" + os.urandom(300)
    name = "0123abcd4567ef89"
    assert crypto.decrypt(encrypt(plain, name, length), name) == plain


def test_partial_encryption_leaves_tail_untouched():
    plain = bytes(range(200))
    blob = encrypt(plain, "x", length=16)
    assert blob[7 + 16 :] == plain[16:]
    assert crypto.decrypt(blob, "x") == plain


@pytest.mark.parametrize(
    "plain",
    [b"\x89PNG\r\n\x1a\n" + os.urandom(300), b"OggS" + os.urandom(300), b'{"a":1}', b"[1, 2, 3]",
     '{"名前": "アンディ"}'.encode()],
)
@pytest.mark.parametrize("length", [0, 5, 128])
def test_wrong_name_recovers(plain, length):
    assert crypto.decrypt(encrypt(plain, "right", min(length, len(plain))), "wrong") == plain


def test_non_ascii_json_keeps_right_name():
    plain = '{"名前": 1}'.encode()
    assert crypto.decrypt(encrypt(plain, "right"), "right") == plain


def test_unknown_format_keeps_right_name():
    plain = bytes(range(200))
    assert crypto.decrypt(encrypt(plain, "right"), "right") == plain


@pytest.mark.parametrize(
    ("plain", "name", "source"),
    [(b'{"a":1}', "right", "name"), (b'{"a":1}', "wrong", "header"), (bytes(range(200)), "right", "unverified")],
)
def test_decrypt_reports_seed_source(plain, name, source):
    assert crypto.decrypt_with_source(encrypt(plain, "right"), name) == (plain, source)


def test_rejects_unencrypted():
    with pytest.raises(ValueError):
        crypto.decrypt(b"LANGDATA{}", "x")


@pytest.mark.parametrize(
    ("data", "ext"),
    [(b"\x89PNG\r\n\x1a\n...", ".png"), (b"OggS...", ".ogg"), (b'{"a":1}', ".json"),
     (b"[\nnull]", ".json"), (b"\x00\x01", ".bin")],
)
def test_guess_extension(data, ext):
    assert crypto.guess_extension(data) == ext


def test_decrypt_tree(tmp_path):
    src = tmp_path / "src"
    (src / "sub").mkdir(parents=True)
    (src / "sub" / "aaaa").write_bytes(encrypt(b"OggS" + bytes(50), "aaaa"))
    (src / "bbbb").write_bytes(encrypt(b'{"k": 2}', "bbbb"))
    (src / "Credits.txt").write_bytes(b"plain text")

    stats = crypto.decrypt_tree(src, tmp_path / "out")

    assert (stats.decrypted, stats.copied, stats.failed) == (2, 1, [])
    assert (stats.recovered, stats.unverified) == ([], [])
    assert (tmp_path / "out" / "sub" / "aaaa.ogg").read_bytes().startswith(b"OggS")
    assert (tmp_path / "out" / "bbbb.json").read_bytes() == b'{"k": 2}'
    assert (tmp_path / "out" / "Credits.txt").read_bytes() == b"plain text"


def test_decrypt_tree_tracks_seed_source(tmp_path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "renamed").write_bytes(encrypt(b'{"k": 2}', "original"))
    (src / "odd").write_bytes(encrypt(bytes(range(200)), "odd"))

    stats = crypto.decrypt_tree(src, tmp_path / "out")

    assert (stats.recovered, stats.unverified) == ([src / "renamed"], [src / "odd"])
    assert (tmp_path / "out" / "renamed.json").read_bytes() == b'{"k": 2}'


@pytest.mark.skipif(not REAL_GAME.is_dir(), reason="real game not available")
def test_real_assets_decrypt_without_name():
    files = [p for p in (REAL_GAME / "www").rglob("*") if p.is_file() and crypto.is_encrypted(p.read_bytes())]
    assert files
    for p in files:
        data = p.read_bytes()
        assert crypto.decrypt(data, "renamed") == crypto.decrypt(data, p.name), p
