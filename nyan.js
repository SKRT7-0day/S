/* Random Nyan Cat flyby v2 */
(function () {
  var COUNT = 10, DIR = '', DELAY = 2900, SPEED = 260;
  var CAT = 120;

  var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var PATTERNS = {
    straight: function (c) {
      var y = rnd(c.vh * 0.1, c.vh - c.h - 10);
      return { f: function (t) { return { x: -c.w + t * (c.vw + c.w), y: y }; } };
    },
    wave: function (c) {
      var y = rnd(c.vh * 0.25, c.vh * 0.6), A = Math.min(70, c.vh * 0.12), k = rnd(1.5, 3);
      return { f: function (t) { return { x: -c.w + t * (c.vw + c.w), y: y + A * Math.sin(t * Math.PI * 2 * k) }; } };
    },
    bottom: function (c) {
      var x0 = rnd(c.vw * 0.05, c.vw * 0.45), y1 = rnd(c.vh * 0.15, c.vh * 0.45);
      return { crop: true, f: function (t) {
        var e = ease(Math.min(t / 0.4, 1));
        return { x: x0 + t * (c.vw - x0 + c.w), y: (c.vh + c.h) + (y1 - c.vh - c.h) * e };
      } };
    },
    bottomLoop: function (c) {
      var x0 = rnd(c.vw * 0.05, c.vw * 0.3), yc = rnd(c.vh * 0.35, c.vh * 0.55);
      var R = Math.max(55, Math.min(c.vh * 0.14, 90));
      return { crop: true, slow: 1.15, f: function (t) {
        var e = ease(Math.min(t / 0.35, 1));
        var bx = x0 + t * (c.vw - x0 + c.w), by = (c.vh + c.h) + (yc - c.vh - c.h) * e;
        if (t > 0.4 && t < 0.62) {
          var th = (t - 0.4) / 0.22 * Math.PI * 2;
          return { x: bx + R * Math.sin(th), y: by - R * (1 - Math.cos(th)) };
        }
        return { x: bx, y: by };
      } };
    },
    loop: function (c) {
      var R = Math.max(55, Math.min(c.vh * 0.14, 90));
      var y = rnd(c.vh * 0.5, Math.max(c.vh * 0.55, c.vh - c.h - 20)), s = rnd(0.35, 0.5);
      return { crop: true, slow: 1.15, f: function (t) {
        var bx = -c.w + t * (c.vw + c.w);
        if (t > s && t < s + 0.2) {
          var th = (t - s) / 0.2 * Math.PI * 2;
          return { x: bx + R * Math.sin(th), y: y - R * (1 - Math.cos(th)) };
        }
        return { x: bx, y: y };
      } };
    },
    spin: function (c) {
      var y = rnd(c.vh * 0.15, c.vh * 0.6);
      return { crop: true, spin: true, slow: 1.25, f: function (t) {
        var tt = t < 0.4 ? t / 0.4 * 0.45 : t < 0.6 ? 0.45 + (t - 0.4) / 0.2 * 0.04 : 0.49 + (t - 0.6) / 0.4 * 0.51;
        var u = Math.min(Math.max((t - 0.4) / 0.2, 0), 1);
        return { x: -c.w + tt * (c.vw + c.w), y: y, r: u * 360 };
      } };
    },
    dive: function (c) {
      var x0 = rnd(0, c.vw * 0.4), y1 = rnd(c.vh * 0.45, c.vh - c.h);
      return { crop: true, f: function (t) {
        return { x: x0 + t * (c.vw - x0 + c.w), y: -c.h + (y1 + c.h) * ease(Math.min(t / 0.5, 1)) - (t > 0.5 ? (t - 0.5) * 120 : 0) };
      } };
    }
  };
  var NAMES = Object.keys(PATTERNS);
  var CAN_FLIP = { straight: 1, wave: 1, bottom: 1, dive: 1 };

  function build(p, c, flip) {
    var N = 120, frames = [], prev = null;
    for (var i = 0; i <= N; i++) {
      var t = i / N, a = p.f(t), b = p.f(Math.min(t + 0.01, 1)), r;
      if (a.r !== undefined) r = a.r;
      else {
        r = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI * 0.8;
        if (prev !== null) { while (r - prev > 180) r -= 360; while (r - prev < -180) r += 360; }
        prev = r;
      }
      var x = flip ? c.vw - a.x - c.w : a.x;
      frames.push({
        transform: 'translate(' + x + 'px,' + a.y + 'px)' + (flip ? ' scaleX(-1)' : '') + ' rotate(' + r + 'deg)',
        offset: t
      });
    }
    return frames;
  }

  function fly() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var img = new Image();
    img.alt = ''; img.setAttribute('aria-hidden', 'true');
    img.src = DIR + 'nyan' + (Math.floor(Math.random() * COUNT) + 1) + '.gif';

    img.onload = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      var k = vw < 600 ? 0.65 : 1;
      var w = img.naturalWidth * k, h = img.naturalHeight * k;
      var c = { vw: vw, vh: vh, w: w, h: h };
      var name = NAMES[Math.floor(Math.random() * NAMES.length)];
      var p = PATTERNS[name](c);
      var flip = !!CAN_FLIP[name] && Math.random() < 0.3;

      img.style.cssText = 'position:fixed;left:0;top:0;z-index:5;pointer-events:none;image-rendering:pixelated;' +
        'width:' + w + 'px;height:' + h + 'px;will-change:transform;' +
        'transform-origin:' + (w - CAT * k * 0.5) + 'px 50%;' +
        (p.crop ? 'clip-path:inset(0 0 0 ' + (w * 0.55) + 'px);' : '');
      document.body.appendChild(img);

      var dur = ((vw + w) / SPEED) * 1000 * (p.slow || 1);
      var anim = img.animate(build(p, c, flip), { duration: dur, easing: 'linear', fill: 'forwards' });
      anim.onfinish = function () { img.remove(); };
    };
  }

  function start() { setTimeout(fly, DELAY); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
