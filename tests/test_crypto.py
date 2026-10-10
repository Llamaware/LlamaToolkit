import os
import random

import pytest
from conftest import encrypt

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


def test_name_matters():
    blob = encrypt(b'{"a":1}', "right")
    assert crypto.decrypt(blob, "wrong") != b'{"a":1}'


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
    assert (tmp_path / "out" / "sub" / "aaaa.ogg").read_bytes().startswith(b"OggS")
    assert (tmp_path / "out" / "bbbb.json").read_bytes() == b'{"k": 2}'
    assert (tmp_path / "out" / "Credits.txt").read_bytes() == b"plain text"
