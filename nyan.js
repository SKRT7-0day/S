(function () {
  var COUNT = 10, DIR = '', DELAY = 2900, SPEED = 260;

  function fly() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var n = Math.floor(Math.random() * COUNT) + 1;
    var img = new Image();
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = DIR + 'nyan' + n + '.gif';
    img.onload = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      var k = vw < 600 ? 0.65 : 1;
      var w = img.naturalWidth * k, h = img.naturalHeight * k;
      img.style.cssText = 'position:fixed;left:0;top:0;z-index:5;pointer-events:none;image-rendering:pixelated;width:' + w + 'px;height:' + h + 'px;will-change:transform;';
      var y = Math.random() * (vh * 0.77 - h) + vh * 0.08;
      y = Math.max(0, Math.min(vh - h, y));
      document.body.appendChild(img);
      var anim = img.animate(
        [{ transform: 'translate(' + (-w) + 'px,' + y + 'px)' },
         { transform: 'translate(' + vw + 'px,' + y + 'px)' }],
        { duration: ((vw + w) / SPEED) * 1000, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = function () { img.remove(); };
    };
  }

  function start() { setTimeout(fly, DELAY); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
