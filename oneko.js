// oneko.js: https://github.com/adryd325/oneko.js

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
  const nekoScale = 2.2; // bump this up/down to resize the cat (1 = original 32px size)
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
    } catch (e) { /* ignore */ }
  
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
    // Stops execution if the neko element is removed from DOM
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

  // ==========================================
  // SKIN PICKER — click the cat to pop out a
  // circle of character choices around it.
  // ==========================================
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
    el.style.opacity = "0";
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 180);
  }

  function chooseSkin(file) {
    currentSkinFile = file;
    nekoEl.style.backgroundImage = `url(${file})`;
    try { window.localStorage.setItem("onekoSkin", file); } catch (e) { /* ignore */ }
    closeSkinMenu();
  }

  function toggleSkinMenu() {
    if (skinMenuEl) {
      closeSkinMenu();
      return;
    }
    menuOpen = true;

    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.left = "0";
    wrap.style.top = "0";
    wrap.style.width = "0";
    wrap.style.height = "0";
    wrap.style.zIndex = 2147483647;
    wrap.style.opacity = "1";
    wrap.style.transition = "opacity 0.18s ease";

    const centerX = nekoPosX;
    const centerY = nekoPosY;
    const radius = 78;
    const count = SKIN_OPTIONS.length;

    SKIN_OPTIONS.forEach(function (skin, i) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const bx = centerX + Math.cos(angle) * radius;
      const by = centerY + Math.sin(angle) * radius;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = skin.label;
      btn.style.position = "fixed";
      btn.style.left = `${bx - 20}px`;
      btn.style.top = `${by - 20}px`;
      btn.style.width = "40px";
      btn.style.height = "40px";
      btn.style.borderRadius = "50%";
      btn.style.border = skin.file === currentSkinFile ? "2px solid #ff6fae" : "2px solid rgba(255,255,255,0.25)";
      btn.style.background = "#1b1420";
      btn.style.backgroundImage = `url(${skin.file})`;
      btn.style.backgroundPosition = "-96px -96px"; // idle frame crop
      btn.style.backgroundSize = "256px 128px";
      btn.style.imageRendering = "pixelated";
      btn.style.cursor = "pointer";
      btn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
      btn.style.transform = "scale(0)";
      btn.style.opacity = "0";
      btn.style.transition = "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease";
      btn.style.transitionDelay = `${i * 0.05}s`;

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        chooseSkin(skin.file);
      });

      wrap.appendChild(btn);

      // Trigger the pop-in on the next frame so the transition applies.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          btn.style.transform = "scale(1)";
          btn.style.opacity = "1";
        });
      });
    });

    document.body.appendChild(wrap);
    skinMenuEl = wrap;

    // Close if the user clicks anywhere outside the menu/cat.
    setTimeout(function () {
      document.addEventListener("click", onOutsideClick);
    }, 0);
  }

  function onOutsideClick() {
    document.removeEventListener("click", onOutsideClick);
    closeSkinMenu();
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    // every ~ 20 seconds
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
      // count down after being alerted before moving
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

