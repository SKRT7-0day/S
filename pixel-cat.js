/*!
 * pixel-cat.js — a tiny pixel-art cat that follows your mouse in real time,
 * oneko.js-style. No dependencies. No tracking. No external image assets —
 * every frame is drawn on a <canvas> from plain color data.
 *
 * Usage:
 *   <script src="pixel-cat.js"></script>
 *   <script>PixelCat.init();</script>
 *
 * Options:
 *   PixelCat.init({ skin: 'classic', size: 72, picker: true, idleDistance: 48, speed: 5.5 });
 *
 * The cat continuously chases the pointer (mouse or touch), stopping a
 * short distance away like the original oneko.js, with a smooth walking
 * bob and a left/right flip that always faces the direction of travel.
 * Click the cat to open a picker with a real preview + name per skin.
 * The chosen skin is remembered across visits via localStorage.
 */
(function (global) {
  'use strict';

  // Each shape is an 11x11 grid. 0 = transparent.
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

  var state = { skins: Object.keys(SKINS), current: 'classic', size: 72 };
  var STORAGE_KEY = 'pixelcat-skin';

  function saveSkin(name) {
    try { localStorage.setItem(STORAGE_KEY, name); } catch (e) { /* ignore */ }
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
    return { open: open, close: close, isOpen: function () { return overlay.style.display === 'flex'; } };
  }

  function init(opts) {
    opts = opts || {};
    var size = opts.size || 72;
    var idleDistance = opts.idleDistance != null ? opts.idleDistance : 48;
    var maxSpeed = opts.speed != null ? opts.speed : 5.5;
    var storedRaw = loadSkin();
    var stored = SKINS[storedRaw] ? storedRaw : null;
    var skin = stored || (SKINS[opts.skin] ? opts.skin : 'classic');
    var showPicker = opts.picker !== false;

    var host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:' + size + 'px;height:' + size + 'px;pointer-events:none;will-change:left,top;';

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.style.cssText = 'width:' + size + 'px;height:' + size + 'px;image-rendering:pixelated;cursor:pointer;pointer-events:auto;display:block;transform-origin:50% 100%;';
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

    // Start roughly centered so there's no big opening lunge.
    var catX = window.innerWidth / 2 - size / 2;
    var catY = window.innerHeight / 2 - size / 2;
    host.style.left = catX + 'px';
    host.style.top = catY + 'px';

    var mouseX = catX + size / 2;
    var mouseY = catY + size / 2;
    var haveMouse = false;

    function setPointer(x, y) {
      mouseX = x;
      mouseY = y;
      haveMouse = true;
    }
    document.addEventListener('mousemove', function (e) { setPointer(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    var flip = 1;
    var walkPhase = 0;

    function frame(ts) {
      requestAnimationFrame(frame);
      if (panel && panel.isOpen()) return; // pause while picking a skin
      if (!haveMouse) return;

      var catCenterX = catX + size / 2;
      var catCenterY = catY + size / 2;
      var dx = mouseX - catCenterX;
      var dy = mouseY - catCenterY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      var moving = dist > idleDistance;
      if (moving) {
        var travel = Math.min(dist - idleDistance, maxSpeed);
        var nx = dx / dist;
        var ny = dy / dist;
        catX += nx * travel;
        catY += ny * travel;
        if (Math.abs(dx) > 2) flip = dx < 0 ? -1 : 1;
        walkPhase += 0.22;
      }

      catX = Math.max(4, Math.min(window.innerWidth - size - 4, catX));
      catY = Math.max(4, Math.min(window.innerHeight - size - 4, catY));

      host.style.left = catX + 'px';
      host.style.top = catY + 'px';

      var bob = moving ? Math.abs(Math.sin(walkPhase)) * (size * 0.09) : 0;
      var squash = moving ? 1 - Math.abs(Math.sin(walkPhase)) * 0.05 : 1;
      canvas.style.transform = 'translateY(' + (-bob) + 'px) scaleX(' + flip + ') scaleY(' + squash + ')';
    }
    requestAnimationFrame(frame);

    state.el = host;
    state.canvas = canvas;
    state.ctx = ctx;
    return state;
  }

  global.PixelCat = { init: init, skins: SKINS };
})(window);

