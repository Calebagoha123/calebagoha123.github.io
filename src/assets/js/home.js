(() => {
  "use strict";

  const DISPERSER_MOVE = "ascii-disperser-move";
  const DISPERSER_CLEAR = "ascii-disperser-clear";

  /** Turns the portrait into individual glyphs for shimmer and cursor repulsion. */
  function initialiseAsciiPortrait() {
    const portrait = document.querySelector("#ascii-portrait");
    if (!portrait || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const densityBuckets = [" .,`'", ':;~"', "*+=-/", "(){}[]", "#%&$", "@8B"];
    const bucketFor = (character) => densityBuckets.find((bucket) => bucket.includes(character)) || "";
    const glyphs = [];
    const fragment = document.createDocumentFragment();

    for (const character of portrait.textContent) {
      if (character === " " || character === "\n") {
        fragment.append(document.createTextNode(character));
        continue;
      }

      const element = document.createElement("span");
      element.className = "ascii-glyph";
      element.textContent = character;
      fragment.append(element);
      glyphs.push({
        element,
        original: character,
        bucket: bucketFor(character),
        x: 0,
        y: 0
      });
    }

    if (!glyphs.length) return;
    portrait.replaceChildren(fragment);

    let metricsDirty = true;
    let pointer = null;
    let animationFrame = null;
    let spatialGrid = new Map();
    const activeGlyphs = new Set();
    const gridCellSize = 64;

    const measureGlyphs = () => {
      spatialGrid = new Map();
      glyphs.forEach((glyph) => {
        glyph.x = glyph.element.offsetLeft + glyph.element.offsetWidth / 2;
        glyph.y = glyph.element.offsetTop + glyph.element.offsetHeight / 2;

        const key = `${Math.floor(glyph.x / gridCellSize)}:${Math.floor(glyph.y / gridCellSize)}`;
        const cell = spatialGrid.get(key) || [];
        cell.push(glyph);
        spatialGrid.set(key, cell);
      });
      metricsDirty = false;
    };

    const disperse = () => {
      animationFrame = null;
      if (!pointer) return;
      if (metricsDirty) measureGlyphs();

      const bounds = portrait.getBoundingClientRect();
      const scaleX = bounds.width / portrait.offsetWidth || 1;
      const scaleY = bounds.height / portrait.offsetHeight || scaleX;
      const pointerX = (pointer.x - bounds.left) / scaleX;
      const pointerY = (pointer.y - bounds.top) / scaleY;
      const radius = pointer.radius || 86;
      const radiusSquared = radius * radius;
      const maximumTravel = 34;
      const candidates = [];
      const nextActiveGlyphs = new Set();
      const minimumColumn = Math.floor((pointerX - radius) / gridCellSize);
      const maximumColumn = Math.floor((pointerX + radius) / gridCellSize);
      const minimumRow = Math.floor((pointerY - radius) / gridCellSize);
      const maximumRow = Math.floor((pointerY + radius) / gridCellSize);

      for (let column = minimumColumn; column <= maximumColumn; column += 1) {
        for (let row = minimumRow; row <= maximumRow; row += 1) {
          const cell = spatialGrid.get(`${column}:${row}`);
          if (cell) candidates.push(...cell);
        }
      }

      candidates.forEach((glyph) => {
        const deltaX = glyph.x - pointerX;
        const deltaY = glyph.y - pointerY;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;

        if (distanceSquared >= radiusSquared) return;

        const distance = Math.sqrt(distanceSquared);
        const safeDistance = Math.max(distance, 0.5);
        const force = Math.pow(1 - distance / radius, 1.35);
        const travel = maximumTravel * force;
        const x = (deltaX / safeDistance) * travel;
        const y = (deltaY / safeDistance) * travel;
        glyph.element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        nextActiveGlyphs.add(glyph);
      });

      activeGlyphs.forEach((glyph) => {
        if (!nextActiveGlyphs.has(glyph)) glyph.element.style.transform = "";
      });
      activeGlyphs.clear();
      nextActiveGlyphs.forEach((glyph) => activeGlyphs.add(glyph));
    };

    const scheduleDispersion = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(disperse);
    };

    const clearDispersion = () => {
      pointer = null;
      portrait.classList.remove("is-dispersing");
      activeGlyphs.forEach((glyph) => {
        glyph.element.style.transform = "";
      });
      activeGlyphs.clear();
    };

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => { metricsDirty = true; }).observe(portrait);
    } else {
      window.addEventListener("resize", () => { metricsDirty = true; });
    }

    portrait.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      portrait.classList.add("is-dispersing");
      pointer = { x: event.clientX, y: event.clientY };
      scheduleDispersion();
    });
    portrait.addEventListener("pointerleave", clearDispersion);
    window.addEventListener(DISPERSER_MOVE, (event) => {
      portrait.classList.add("is-dispersing");
      pointer = event.detail;
      scheduleDispersion();
    });
    window.addEventListener(DISPERSER_CLEAR, clearDispersion);

    const swappable = glyphs.filter((glyph) => glyph.bucket);
    // A restrained shimmer keeps the portrait alive without forcing hundreds
    // of text updates per second on browsers with slower layout engines.
    const swapsPerTick = Math.max(12, Math.floor(swappable.length * 0.012));
    const shimmer = () => {
      for (let index = 0; index < swapsPerTick; index += 1) {
        const glyph = swappable[Math.floor(Math.random() * swappable.length)];
        glyph.element.textContent = Math.random() < 0.88
          ? glyph.bucket[Math.floor(Math.random() * glyph.bucket.length)]
          : glyph.original;
      }
    };

    let shimmerTimer = null;
    const startShimmer = () => {
      if (!shimmerTimer) shimmerTimer = window.setInterval(shimmer, 120);
    };
    const stopShimmer = () => {
      if (!shimmerTimer) return;
      window.clearInterval(shimmerTimer);
      shimmerTimer = null;
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting ? startShimmer() : stopShimmer());
      }).observe(portrait);
    } else {
      startShimmer();
    }
  }

  /** Makes the collage draggable while retaining the user's preferred default layout. */
  function initialiseDraggableCollage() {
    const layer = document.querySelector(".about-stickers");
    const portrait = document.querySelector("#ascii-portrait");
    if (!layer || !portrait) return;

    const draggables = Array.from(layer.querySelectorAll(".holo-sticker, .personality-token"));
    let active = null;
    let topLayer = 3;

    const geometry = () => {
      const bounds = layer.getBoundingClientRect();
      return {
        bounds,
        scaleX: bounds.width / layer.offsetWidth || 1,
        scaleY: bounds.height / layer.offsetHeight || 1
      };
    };

    const place = (sticker, left, top) => {
      const maximumLeft = Math.max(0, layer.offsetWidth - sticker.offsetWidth);
      const maximumTop = Math.max(0, layer.offsetHeight - sticker.offsetHeight);
      sticker.style.right = "auto";
      sticker.style.bottom = "auto";
      sticker.style.left = `${Math.max(0, Math.min(left, maximumLeft))}px`;
      sticker.style.top = `${Math.max(0, Math.min(top, maximumTop))}px`;
    };

    const disperseWith = (sticker) => {
      const bounds = sticker.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent(DISPERSER_MOVE, {
        detail: {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
          radius: Math.max(48, Math.max(bounds.width, bounds.height) * 0.72)
        }
      }));
    };

    const placeInitialStickers = () => {
      const layerBounds = layer.getBoundingClientRect();
      const portraitBounds = portrait.getBoundingClientRect();
      const compact = layer.offsetWidth < 500;
      const fromPortraitLeft = portraitBounds.left - layerBounds.left;
      const fromPortraitTop = portraitBounds.top - layerBounds.top;

      const positions = {
        "holo-sticker--oxford": [
          compact ? fromPortraitLeft + 27 : fromPortraitLeft - 115,
          fromPortraitTop + portraitBounds.height * (compact ? 0.28 : 0.412)
        ],
        "holo-sticker--uva": [
          fromPortraitLeft - (compact ? 180 : 51),
          fromPortraitTop + portraitBounds.height * (compact ? 0.36 : 0.103)
        ],
        "personality-token--hello": [
          compact ? fromPortraitLeft + portraitBounds.width * 0.18 : fromPortraitLeft - 5,
          fromPortraitTop + portraitBounds.height * (compact ? 0.68 : 0.363)
        ],
        "personality-token--homegoing": [
          compact ? fromPortraitLeft - 86 : fromPortraitLeft + portraitBounds.width * 0.807,
          compact ? fromPortraitTop + 30 : fromPortraitTop + portraitBounds.height * 0.31
        ],
        "personality-token--hamming": [
          compact ? fromPortraitLeft + 34 : portraitBounds.right - layerBounds.left + 19,
          compact ? fromPortraitTop - 8 : fromPortraitTop + portraitBounds.height * 0.45
        ],
        "personality-token--letterboxd-1": [
          fromPortraitLeft + portraitBounds.width * 0.74,
          fromPortraitTop - 10
        ],
        "personality-token--letterboxd-2": [
          portraitBounds.right - layerBounds.left + (compact ? 34 : -9),
          fromPortraitTop + (compact ? 34 : 8)
        ]
      };

      draggables.forEach((sticker) => {
        if (sticker.dataset.moved === "true") return;
        const className = Object.keys(positions).find((name) => sticker.classList.contains(name));
        if (className) place(sticker, ...positions[className]);
      });
    };

    draggables.forEach((sticker) => {
      sticker.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.closest("a")) return;

        const layerGeometry = geometry();
        const stickerBounds = sticker.getBoundingClientRect();
        active = {
          sticker,
          pointerId: event.pointerId,
          grabX: (event.clientX - stickerBounds.left) / layerGeometry.scaleX,
          grabY: (event.clientY - stickerBounds.top) / layerGeometry.scaleY
        };
        place(
          sticker,
          (stickerBounds.left - layerGeometry.bounds.left) / layerGeometry.scaleX,
          (stickerBounds.top - layerGeometry.bounds.top) / layerGeometry.scaleY
        );
        sticker.dataset.moved = "true";
        sticker.style.zIndex = String(++topLayer);
        sticker.classList.add("is-dragging");
        sticker.setPointerCapture(event.pointerId);
        event.preventDefault();
      });

      sticker.addEventListener("keydown", (event) => {
        const movement = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1]
        }[event.key];
        if (!movement) return;

        const step = event.shiftKey ? 16 : 6;
        place(sticker, sticker.offsetLeft + movement[0] * step, sticker.offsetTop + movement[1] * step);
        sticker.dataset.moved = "true";
        sticker.style.zIndex = String(++topLayer);
        event.preventDefault();
      });
    });

    const moveActive = (event) => {
      if (!active) return;
      const layerGeometry = geometry();
      place(
        active.sticker,
        (event.clientX - layerGeometry.bounds.left) / layerGeometry.scaleX - active.grabX,
        (event.clientY - layerGeometry.bounds.top) / layerGeometry.scaleY - active.grabY
      );
      disperseWith(active.sticker);
    };

    const releaseActive = (event) => {
      if (!active || event.pointerId !== active.pointerId) return;
      moveActive(event);

      const { sticker, pointerId } = active;
      sticker.classList.remove("is-dragging");
      if (sticker.hasPointerCapture(pointerId)) sticker.releasePointerCapture(pointerId);
      active = null;
      window.dispatchEvent(new CustomEvent(DISPERSER_CLEAR));
    };

    window.addEventListener("pointermove", moveActive);
    window.addEventListener("pointerup", releaseActive);
    window.addEventListener("pointercancel", releaseActive);
    window.addEventListener("resize", () => {
      draggables.forEach((sticker) => {
        if (sticker.dataset.moved === "true") place(sticker, sticker.offsetLeft, sticker.offsetTop);
      });
      placeInitialStickers();
    });

    if (document.readyState === "complete") {
      placeInitialStickers();
    } else {
      window.addEventListener("load", placeInitialStickers, { once: true });
    }
  }

  initialiseAsciiPortrait();
  initialiseDraggableCollage();
})();
