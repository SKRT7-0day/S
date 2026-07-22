/*!
 * pixel-cat.js — a tiny sitting pixel-art cat you can drop on any page.
 * No dependencies. No tracking. No external assets.
 *
 * Usage:
 *   <script src="pixel-cat.js"></script>
 *   <script>PixelCat.init();</script>
 *
 * Options:
 *   PixelCat.init({ skin: 'classic', size: 96, corner: 'bottom-left', picker: true, follow: true });
 *
 * follow: true (default) — clicking anywhere on the page makes the creature
 *         walk to that spot. Set to false to keep it pinned in its corner.
 * The chosen skin is remembered across visits via localStorage.
 */
(function (global) {
  'use strict';

  // Each shape is an 11-row grid. 0 = transparent.
  // Colors are just labels into each skin's palette — swap freely.
  var CAT_SHAPE = [
    '00A A00000',
    '0AABBAA000',
    'AABBBBAA00',
    'ABBCCCBBA0',
    'ABBCDCBBA0',
    '0BBCCCBB00',
    '0BBBBBBB00',
    '00EEEEEE00',
    '00E0000E00',
    '00F0000F00',
    '0FF0000FF0'
  ].map(function (row) { return row.split(''); });

  var BUTTERFLY_SHAPE = [
    '0000000000',
    '00A0000B00',
    '0AAA00BBB0',
    'AAAAA0BBBB',
    '0AAA00BBB0',
    '000CC00000',
    '0000C00000',
    '0000000000',
    '0000000000',
    '0000000000',
    '0000000000'
  ].map(function (row) { return row.split(''); });

  var SHAPES = { cat: CAT_SHAPE, butterfly: BUTTERFLY_SHAPE };

  // Each skin declares which shape it uses plus its own color palette.
  var SKINS = {
    classic:       { shape: 'cat', palette: { A: '#f4f4f4', B: '#ffffff', C: '#2b2b2b', D: '#e08ab0', E: '#e8e8e8', F: '#dadada' } },
    charcoal:      { shape: 'cat', palette: { A: '#3a3a3a', B: '#4d4d4d', C: '#1a1a1a', D: '#e08ab0', E: '#333333', F: '#262626' } },
    orange:        { shape: 'cat', palette: { A: '#e07b39', B: '#f2a25c', C: '#2b2b2b', D: '#e08ab0', E: '#c9642c', F: '#a8541f' } },
    steel:         { shape: 'cat', palette: { A: '#7c8a99', B: '#9fb0bf', C: '#2b2b2b', D: '#e08ab0', E: '#66727e', F: '#4f5960' } },
    ivy:           { shape: 'cat', palette: { A: '#5f8f5a', B: '#83b57c', C: '#2b2b2b', D: '#e08ab0', E: '#4a7345', F: '#3a5c36' } },
    sable:         { shape: 'cat', palette: { A: '#4a3527', B: '#6b4d38', C: '#2b2b2b', D: '#e08ab0', E: '#3a2a1f', F: '#2c2018' } },
    frost:         { shape: 'cat', palette: { A: '#bfe3f0', B: '#e6f6fb', C: '#2b2b2b', D: '#7fc4de', E: '#a9d8e8', F: '#8fc6da' } },
    star:          { shape: 'cat', palette: { A: '#ffb703', B: '#ffd166', C: '#2b2b2b', D: '#ef476f', E: '#f4a300', F: '#d98c00' } },
    eevee:         { shape: 'cat', palette: { A: '#8b5a2b', B: '#c98a4b', C: '#2b2b2b', D: '#e08ab0', E: '#6b421f', F: '#573419' } },
    'blue-butterfly': { shape: 'butterfly', palette: { A: '#4fc3e8', B: '#4fc3e8', C: '#1a1a1a' } }
  };

  var state = { skins: Object.keys(SKINS), current: 'classic', size: 96, el: null, canvas: null, ctx: null };
  var STORAGE_KEY = 'pixelcat-skin';

  function saveSkin(name) {
    try { localStorage.setItem(STORAGE_KEY, name); } catch (e) { /* storage unavailable, ignore */ }
  }

  function loadSkin() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function drawSkin(ctx, size, skinName) {
    var skin = SKINS[skinName] || SKINS.classic;
    var shapeGrid = SHAPES[skin.shape] || SHAPES.cat;
    var palette = skin.palette;
    var cols = shapeGrid[0].length;
    var rows = shapeGrid.length;
    var cell = size / Math.max(cols, rows);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var key = shapeGrid[y][x];
        if (key === '0' || key === ' ') continue;
        ctx.fillStyle = palette[key] || '#000';
        ctx.fillRect(Math.round(x * cell), Math.round(y * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
      }
    }
  }

  function buildPicker(container, onPick) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;justify-content:center;';
    state.skins.forEach(function (name) {
      var sw = document.createElement('button');
      sw.type = 'button';
      sw.title = name;
      sw.style.cssText = 'width:18px;height:18px;border-radius:4px;border:2px solid transparent;cursor:pointer;padding:0;background:' + SKINS[name].palette.B + ';';
      sw.addEventListener('click', function (e) {
        e.stopPropagation();
        onPick(name);
        sw.parentNode.querySelectorAll('button').forEach(function(b){b.style.borderColor='transparent';});
        sw.style.borderColor = '#333';
      });
      wrap.appendChild(sw);
    });
    container.appendChild(wrap);
  }

  function init(opts) {
    opts = opts || {};
    var size = opts.size || 96;
    var stored = SKINS[loadSkin()] ? loadSkin() : null;
    var skin = stored || (SKINS[opts.skin] ? opts.skin : 'classic');
    var corner = opts.corner || 'bottom-left';
    var showPicker = opts.picker !== false;
    var follow = opts.follow !== false;

    var host = document.createElement('div');
    var pos = {
      'bottom-left': 'left:16px;bottom:16px;',
      'bottom-right': 'right:16px;bottom:16px;',
      'top-left': 'left:16px;top:16px;',
      'top-right': 'right:16px;top:16px;'
    }[corner] || 'left:16px;bottom:16px;';

    host.style.cssText = 'position:fixed;' + pos + 'z-index:99999;display:flex;flex-direction:column;align-items:center;font-family:sans-serif;pointer-events:none;transition:left 0.45s ease,top 0.45s ease;';

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.style.cssText = 'width:' + size + 'px;height:' + size + 'px;image-rendering:pixelated;';
    host.appendChild(canvas);

    document.body.appendChild(host);

    var ctx = canvas.getContext('2d');
    drawSkin(ctx, size, skin);
    state.current = skin;

    if (showPicker) {
      var pickerWrap = document.createElement('div');
      pickerWrap.style.pointerEvents = 'auto';
      buildPicker(pickerWrap, function (name) {
        state.current = name;
        drawSkin(ctx, size, name);
        saveSkin(name);
      });
      host.appendChild(pickerWrap);
      // Mark the loaded/default skin as selected in the picker.
      var swatches = pickerWrap.querySelectorAll('button');
      var idx = state.skins.indexOf(skin);
      if (idx > -1 && swatches[idx]) swatches[idx].style.borderColor = '#333';
    }

    if (follow) {
      document.addEventListener('click', function (e) {
        if (host.contains(e.target)) return; // don't chase clicks on the picker itself
        var rect = host.getBoundingClientRect();
        var w = rect.width || size;
        var h = rect.height || size;
        var left = Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - w / 2));
        var top = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - h / 2));
        host.style.right = 'auto';
        host.style.bottom = 'auto';
        host.style.left = left + 'px';
        host.style.top = top + 'px';
      });
    }

    state.el = host;
    state.canvas = canvas;
    state.ctx = ctx;
    return state;
  }

  global.PixelCat = { init: init, skins: SKINS };
})(window);
