/*!
 * pixel-cat.js — a tiny walking pixel-art cat you can drop on any page.
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
 *         walk over with a little bounce/run animation.
 * picker: true (default) — click the creature to open a "collection" panel
 *         with a real preview image + name for every skin.
 * The chosen skin is remembered across visits via localStorage.
 */
(function (global) {
  'use strict';

  // Each shape is an 11x11 grid. 0 = transparent.
  // Colors are just labels into each skin's palette — swap freely.
  var CAT_SHAPE = [
    '00A00A0000',
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

  // Each skin declares which shape it uses, its palette, and a friendly label.
  var SKINS = {
    classic:  { shape: 'cat', label: 'Classic',  palette: { A: '#f4f4f4', B: '#ffffff', C: '#2b2b2b', D: '#e08ab0', E: '#e8e8e8', F: '#dadada' } },
    charcoal: { shape: 'cat', label: 'Charcoal', palette: { A: '#6b6b6b', B: '#8a8a8a', C: '#111111', D: '#e08ab0', E: '#4d4d4d', F: '#3a3a3a' } },
    orange:   { shape: 'cat', label: 'Orange',   palette: { A: '#e07b39', B: '#f2a25c', C: '#2b2b2b', D: '#e08ab0', E: '#c9642c', F: '#a8541f' } },
    steel:    { shape: 'cat', label: 'Steel',    palette: { A: '#7c8a99', B: '#aebdcb', C: '#2b2b2b', D: '#e08ab0', E: '#66727e', F: '#4f5960' } },
    ivy:      { shape: 'cat', label: 'Ivy',      palette: { A: '#5f8f5a', B: '#93c68b', C: '#2b2b2b', D: '#e08ab0', E: '#4a7345', F: '#3a5c36' } },
    sable:    { shape: 'cat', label: 'Sable',    palette: { A: '#6b4d38', B: '#9c754f', C: '#111111', D: '#e08ab0', E: '#4a3527', F: '#2c2018' } },
    frost:    { shape: 'cat', label: 'Frost',    palette: { A: '#7fc4de', B: '#e6f6fb', C: '#1f2f36', D: '#3f8fae', E: '#a9d8e8', F: '#5aa9c7' } },
    star:     { shape: 'cat', label: 'Star',     palette: { A: '#ffb703', B: '#ffe29a', C: '#2b2b2b', D: '#ef476f', E: '#f4a300', F: '#d98c00' } },
    eevee:    { shape: 'cat', label: 'Eevee',    palette: { A: '#8b5a2b', B: '#e0b884', C: '#2b2b2b', D: '#e08ab0', E: '#6b421f', F: '#573419' } },
    'blue-butterfly': { shape: 'butterfly', label: 'Blue Butterfly', palette: { A: '#4fc3e8', B: '#4fc3e8', C: '#1a1a1a' } }
  };

  var state = { skins: Object.keys(SKINS), current: 'classic', size: 96, el: null, canvas: null, ctx: null };
  var STORAGE_KEY = 'pixelcat-skin';

  function saveSkin(name) {
    try { localStorage.setItem(STORAGE_KEY, name); } catch (e) { /* storage unavailable, ignore */ }
  }

  function loadSkin() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function drawSkinOnCtx(ctx, size, skinName) {
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
        if (key === '0') continue;
        ctx.fillStyle = palette[key] || '#000';
        ctx.fillRect(Math.round(x * cell), Math.round(y * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
      }
    }
  }

  function makeThumbnail(skinName, px) {
    var c = document.createElement('canvas');
    c.width = px;
    c.height = px;
    c.style.cssText = 'width:' + px + 'px;height:' + px + 'px;image-rendering:pixelated;display:block;margin:0 auto;';
    drawSkinOnCtx(c.getContext('2d'), px, skinName);
    return c;
  }

  // ==========================================
  // COLLECTION PANEL — a real preview + name per skin,
  // opened by clicking the creature itself.
  // ==========================================
  function buildCollectionPanel(onPick) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);pointer-events:auto;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1b1420;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:20px;max-width:340px;width:88vw;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);';

    var titleRow = document.createElement('div');
    titleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;';
    var title = document.createElement('div');
    title.textContent = 'Cat collection';
    title.style.cssText = 'font-weight:800;font-size:1.15rem;color:#ff6fae;font-family:sans-serif;';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;color:#ccc;font-size:1.1rem;cursor:pointer;padding:4px 8px;';
    titleRow.appendChild(title);
    titleRow.appendChild(closeBtn);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;';

    var cardButtons = [];
    state.skins.forEach(function (name) {
      var card = document.createElement('button');
      card.type = 'button';
      card.style.cssText = 'background:rgba(255,255,255,0.04);border:2px solid transparent;border-radius:12px;padding:10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;';
      card.appendChild(makeThumbnail(name, 48));
      var label = document.createElement('span');
      label.textContent = SKINS[name].label;
      label.style.cssText = 'color:#eee;font-size:0.72rem;font-family:sans-serif;text-align:center;';
      card.appendChild(label);
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        onPick(name);
        cardButtons.forEach(function (b) { b.style.borderColor = 'transparent'; });
        card.style.borderColor = '#ff6fae';
      });
      cardButtons.push(card);
      grid.appendChild(card);
    });

    var hint = document.createElement('div');
    hint.textContent = 'Tap a skin to pick it';
    hint.style.cssText = 'margin-top:14px;text-align:center;color:#8a7d8f;font-size:0.7rem;font-family:sans-serif;';

    panel.appendChild(titleRow);
    panel.appendChild(grid);
    panel.appendChild(hint);
    overlay.appendChild(panel);

    function open(currentSkin) {
      overlay.style.display = 'flex';
      var idx = state.skins.indexOf(currentSkin);
      cardButtons.forEach(function (b, i) { b.style.borderColor = i === idx ? '#ff6fae' : 'transparent'; });
    }
    function close() { overlay.style.display = 'none'; }

    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    document.body.appendChild(overlay);
    return { open: open, close: close };
  }

  // ==========================================
  // WALK ANIMATION — squash/stretch bounce + a
  // step-cycle wobble while the creature travels,
  // plus a horizontal flip so it visibly "faces"
  // the direction it's walking.
  // ==========================================
  var WALK_KEYFRAMES_ID = 'pixelcat-walk-keyframes';
  function ensureWalkKeyframes() {
    if (document.getElementById(WALK_KEYFRAMES_ID)) return;
    var style = document.createElement('style');
    style.id = WALK_KEYFRAMES_ID;
    style.textContent =
      '@keyframes pixelcat-bounce {' +
      '  0%   { transform: translateY(0) scaleX(var(--pc-flip,1)); }' +
      '  20%  { transform: translateY(-14%) scaleX(var(--pc-flip,1)); }' +
      '  40%  { transform: translateY(0) scaleX(var(--pc-flip,1)); }' +
      '  60%  { transform: translateY(-10%) scaleX(var(--pc-flip,1)); }' +
      '  80%  { transform: translateY(0) scaleX(var(--pc-flip,1)); }' +
      '  100% { transform: translateY(0) scaleX(var(--pc-flip,1)); }' +
      '}' +
      '.pixelcat-walking canvas.pixelcat-sprite { animation: pixelcat-bounce 0.42s steps(2) infinite; }';
    document.head.appendChild(style);
  }

  function init(opts) {
    opts = opts || {};
    var size = opts.size || 96;
    var storedRaw = loadSkin();
    var stored = SKINS[storedRaw] ? storedRaw : null;
    var skin = stored || (SKINS[opts.skin] ? opts.skin : 'classic');
    var corner = opts.corner || 'bottom-left';
    var showPicker = opts.picker !== false;
    var follow = opts.follow !== false;

    ensureWalkKeyframes();

    var host = document.createElement('div');
    var pos = {
      'bottom-left': 'left:16px;bottom:16px;',
      'bottom-right': 'right:16px;bottom:16px;',
      'top-left': 'left:16px;top:16px;',
      'top-right': 'right:16px;top:16px;'
    }[corner] || 'left:16px;bottom:16px;';

    host.style.cssText = 'position:fixed;' + pos + 'z-index:99999;display:flex;flex-direction:column;align-items:center;font-family:sans-serif;pointer-events:none;transition:left 0.5s cubic-bezier(0.4,0,0.2,1),top 0.5s cubic-bezier(0.4,0,0.2,1);';

    var canvas = document.createElement('canvas');
    canvas.className = 'pixelcat-sprite';
    canvas.width = size;
    canvas.height = size;
    canvas.style.cssText = 'width:' + size + 'px;height:' + size + 'px;image-rendering:pixelated;cursor:pointer;pointer-events:auto;transform-origin:50% 100%;';
    host.appendChild(canvas);

    document.body.appendChild(host);

    var ctx = canvas.getContext('2d');
    drawSkinOnCtx(ctx, size, skin);
    state.current = skin;

    var panel = null;
    if (showPicker) {
      panel = buildCollectionPanel(function (name) {
        state.current = name;
        drawSkinOnCtx(ctx, size, name);
        saveSkin(name);
      });
      canvas.addEventListener('click', function (e) {
        e.stopPropagation();
        panel.open(state.current);
      });
    }

    if (follow) {
      document.addEventListener('click', function (e) {
        if (host.contains(e.target)) return; // don't chase clicks on the creature/panel itself
        var rect = host.getBoundingClientRect();
        var w = rect.width || size;
        var h = rect.height || size;
        var currentLeft = rect.left;
        var left = Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - w / 2));
        var top = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - h / 2));

        // Face the direction of travel.
        host.style.setProperty('--pc-flip', left < currentLeft ? '-1' : '1');

        host.style.right = 'auto';
        host.style.bottom = 'auto';
        host.style.left = left + 'px';
        host.style.top = top + 'px';

        host.classList.add('pixelcat-walking');
        clearTimeout(host._walkTimer);
        host._walkTimer = setTimeout(function () {
          host.classList.remove('pixelcat-walking');
        }, 520);
      });
    }

    state.el = host;
    state.canvas = canvas;
    state.ctx = ctx;
    return state;
  }

  global.PixelCat = { init: init, skins: SKINS };
})(window);

