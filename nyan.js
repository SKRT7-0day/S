/* Nyan Cat flyby */
(function () {
  var COUNT = 10, DIR = '', DELAY = 2900, SPEED = 260;

  function fly() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var img = new Image();
    img.alt = ''; img.setAttribute('aria-hidden', 'true');
    img.src = DIR + 'nyan' + (Math.floor(Math.random() * COUNT) + 1) + '.gif';

    img.onload = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      var k = vw < 600 ? 0.65 : 1;
      var w = img.naturalWidth * k, h = img.naturalHeight * k;

      var lane = ['top', 'mid', 'bottom'][Math.floor(Math.random() * 3)];
      var pad = 16, y;
      if (lane === 'top') y = pad + Math.random() * vh * 0.12;
      else if (lane === 'bottom') y = vh - h - pad - Math.random() * vh * 0.12;
      else y = vh * 0.35 + Math.random() * Math.max(0, vh * 0.3 - h);
      y = Math.max(0, Math.min(vh - h, y));

      var rtl = Math.random() < 0.5;
      var from = rtl ? vw : -w, to = rtl ? -w : vw;
      var flip = rtl ? ' scaleX(-1)' : '';

      img.style.cssText = 'position:fixed;left:0;top:0;z-index:5;pointer-events:none;' +
        'image-rendering:pixelated;width:' + w + 'px;height:' + h + 'px;will-change:transform;';
      document.body.appendChild(img);

      var anim = img.animate([
        { transform: 'translate(' + from + 'px,' + y + 'px)' + flip },
        { transform: 'translate(' + to + 'px,' + y + 'px)' + flip }
      ], { duration: ((vw + w) / SPEED) * 1000, easing: 'linear', fill: 'forwards' });
      anim.onfinish = function () { img.remove(); };
    };
  }

  function start() { setTimeout(fly, DELAY); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
