
(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  const nekoEl = document.createElement("div");
  let persistPosition = true;

  let nekoPosX = 32;
  let nekoPosY = 32;
  
  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  const nekoSpeed = 10;
  const nekoScale = 2.2;
  let menuOpen = false;
  let currentSkinFile = "./oneko.gif";
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function init() {
    let nekoFile = "./oneko.gif"
    const curScript = document.currentScript
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat
    }
    if (curScript && curScript.dataset.persistPosition) {
      if (curScript.dataset.persistPosition === "") {
        persistPosition = true;
      } else {
        persistPosition = JSON.parse(curScript.dataset.persistPosition.toLowerCase());
      }
    }

    currentSkinFile = nekoFile;
    try {
      const savedSkin = window.localStorage.getItem("onekoSkin");
      if (savedSkin) currentSkinFile = savedSkin;
    } catch (e) {}
  
    if (persistPosition) {
      let storedNeko = JSON.parse(window.localStorage.getItem("oneko"));
      if (storedNeko !== null) {
        nekoPosX = storedNeko.nekoPosX;
        nekoPosY = storedNeko.nekoPosY;
        mousePosX = storedNeko.mousePosX;
        mousePosY = storedNeko.mousePosY;
        frameCount = storedNeko.frameCount;
        idleTime = storedNeko.idleTime;
        idleAnimation = storedNeko.idleAnimation;
        idleAnimationFrame = storedNeko.idleAnimationFrame;
        nekoEl.style.backgroundPosition = storedNeko.bgPos;
      }
    }
  
    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "auto";
    nekoEl.style.cursor = "pointer";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 2147483647;
    nekoEl.style.transform = `scale(${nekoScale})`;
    nekoEl.style.transformOrigin = "center center";

    nekoEl.style.backgroundImage = `url(${currentSkinFile})`;
    
    document.body.appendChild(nekoEl);

    nekoEl.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleSkinMenu();
    });

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });
    
    if (persistPosition) {
      window.addEventListener("beforeunload", function (event) {
        window.localStorage.setItem("oneko", JSON.stringify({
          nekoPosX: nekoPosX,
          nekoPosY: nekoPosY,
          mousePosX: mousePosX,
          mousePosY: mousePosY,
          frameCount: frameCount,
          idleTime: idleTime,
          idleAnimation: idleAnimation,
          idleAnimationFrame: idleAnimationFrame,
          bgPos: nekoEl.style.backgroundPosition
        }));
      });
    }
    
    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  const SKIN_OPTIONS = [
    { file: "oneko.gif", label: "Classic" },
    { file: "oneko-alt1.webp", label: "Neko 1" },
    { file: "oneko-alt2.webp", label: "Neko 2" },
    { file: "oneko-alt3.webp", label: "Bear" },
  ];

  let skinMenuEl = null;

  function closeSkinMenu() {
    if (!skinMenuEl) return;
    const el = skinMenuEl;
    skinMenuEl = null;
    menuOpen = false;
    document.removeEventListener("click", onOutsideClick);
    document.removeEventListener("keydown", onMenuKey);
    el.style.opacity = "0";
    el.style.transform = el.dataset.hideTransform;
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 200);
  }

  function chooseSkin(file) {
    currentSkinFile = file;
    nekoEl.style.backgroundImage = `url(${file})`;
    try { window.localStorage.setItem("onekoSkin", file); } catch (e) {}
    closeSkinMenu();
  }

  function onOutsideClick(e) {
    if (skinMenuEl && skinMenuEl.contains(e.target)) return;
    closeSkinMenu();
  }

  function onMenuKey(e) {
    if (e.key === "Escape") closeSkinMenu();
  }

  function toggleSkinMenu() {
    if (skinMenuEl) {
      closeSkinMenu();
      return;
    }
    menuOpen = true;

    const panel = document.createElement("div");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Choose your cat");
    const s = panel.style;
    s.position = "fixed";
    s.zIndex = 2147483647;
    s.boxSizing = "border-box";
    s.width = `${Math.min(344, window.innerWidth - 16)}px`;
    s.padding = "14px 14px 16px";
    s.borderRadius = "20px";
    s.background = "linear-gradient(160deg,#2a1d38,#1a1325)";
    s.border = "1px solid rgba(255,255,255,0.12)";
    s.boxShadow = "0 18px 48px rgba(0,0,0,0.55)";
    s.color = "#fff";
    s.fontFamily = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    s.direction = "ltr";
    s.opacity = "0";
    s.transition = "opacity 0.2s ease, transform 0.25s cubic-bezier(0.2,1.3,0.4,1)";

    const title = document.createElement("div");
    title.textContent = "Choose your cat";
    title.style.cssText = "font-size:14px;font-weight:700;letter-spacing:0.3px;text-align:center;margin:0 0 12px;color:#ffd6ea";
    panel.appendChild(title);

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:8px";
    panel.appendChild(grid);

    SKIN_OPTIONS.forEach(function (skin) {
      const active = skin.file === currentSkinFile;
      const card = document.createElement("button");
      card.type = "button";
      card.title = skin.label;
      card.style.cssText =
        "display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 2px 7px;" +
        "border-radius:14px;cursor:pointer;color:#fff;font:600 11px system-ui,sans-serif;" +
        "transition:transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;" +
        "border:2px solid " + (active ? "#ff6fae" : "rgba(255,255,255,0.1)") + ";" +
        "background:" + (active ? "rgba(255,111,174,0.18)" : "rgba(255,255,255,0.05)");

      const box = document.createElement("div");
      box.style.cssText = "width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(0,0,0,0.28)";
      const sprite = document.createElement("div");
      sprite.style.cssText =
        "width:32px;height:32px;transform:scale(1.5);image-rendering:pixelated;" +
        "background-repeat:no-repeat;background-size:256px 128px;background-position:-96px -96px;" +
        `background-image:url(${skin.file})`;
      box.appendChild(sprite);

      const name = document.createElement("span");
      name.textContent = skin.label;

      card.appendChild(box);
      card.appendChild(name);

      card.addEventListener("mouseenter", function () {
        card.style.transform = "translateY(-2px)";
        if (!active) card.style.background = "rgba(255,255,255,0.12)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "none";
        if (!active) card.style.background = "rgba(255,255,255,0.05)";
      });
      card.addEventListener("click", function (e) {
        e.stopPropagation();
        chooseSkin(skin.file);
      });
      grid.appendChild(card);
    });

    panel.style.left = "-9999px";
    panel.style.top = "0";
    document.body.appendChild(panel);

    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    let left = nekoPosX - pw / 2;
    left = Math.max(8, Math.min(window.innerWidth - pw - 8, left));
    let top = nekoPosY - 16 * nekoScale - ph - 10;
    let below = false;
    if (top < 8) {
      top = nekoPosY + 16 * nekoScale + 10;
      below = true;
    }
    top = Math.max(8, Math.min(window.innerHeight - ph - 8, top));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    const hide = below ? "translateY(-8px) scale(0.96)" : "translateY(8px) scale(0.96)";
    panel.dataset.hideTransform = hide;
    panel.style.transform = hide;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        panel.style.opacity = "1";
        panel.style.transform = "none";
      });
    });

    skinMenuEl = panel;
    setTimeout(function () {
      document.addEventListener("click", onOutsideClick);
      document.addEventListener("keydown", onMenuKey);
    }, 0);
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    if (menuOpen) return;
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  init();
})();

