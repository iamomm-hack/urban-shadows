export default class InputHandler {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      r: false,
      space: false,
      escape: false,
    };

    this.mouse = { dx: 0, dy: 0, down: false, clicked: false };
    this.pointerLocked = false;
    this.mobileMode = false;

    window.addEventListener("keydown", (e) => this._onKey(e, true));
    window.addEventListener("keyup", (e) => this._onKey(e, false));

    document.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    });
    document.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        this.mouse.clicked = true;
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.down = false;
    });
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = !!document.pointerLockElement;
    });
  }

  enableMobileMode() {
    this.mobileMode = true;
    this.pointerLocked = true; // keep true so mouse.dx/dy logic works

    document.body.classList.add("mobile-mode");

    // ── Joystick ──
    const joystick = document.getElementById("touch-joystick");
    const knob = document.getElementById("joystick-knob");
    let joystickTouchId = null;
    let joyCenter = { x: 0, y: 0 };
    const joyRadius = 40;

    joystick.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        joystickTouchId = t.identifier;
        const rect = joystick.getBoundingClientRect();
        joyCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      },
      { passive: false },
    );

    joystick.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier !== joystickTouchId) continue;
          let dx = t.clientX - joyCenter.x;
          let dy = t.clientY - joyCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > joyRadius) {
            dx = (dx / dist) * joyRadius;
            dy = (dy / dist) * joyRadius;
          }

          knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

          // Map joystick to WASD
          const threshold = 0.3;
          const nx = dx / joyRadius;
          const ny = dy / joyRadius;
          this.keys.w = ny < -threshold;
          this.keys.s = ny > threshold;
          this.keys.a = nx < -threshold;
          this.keys.d = nx > threshold;
        }
      },
      { passive: false },
    );

    const resetJoystick = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joystickTouchId) continue;
        joystickTouchId = null;
        knob.style.transform = "translate(-50%, -50%)";
        this.keys.w = false;
        this.keys.s = false;
        this.keys.a = false;
        this.keys.d = false;
      }
    };
    joystick.addEventListener("touchend", resetJoystick, { passive: false });
    joystick.addEventListener("touchcancel", resetJoystick, { passive: false });

    // ── Camera zone (right side drag to look around) ──
    const camZone = document.getElementById("touch-camera-zone");
    let camTouchId = null;
    let camLastX = 0,
      camLastY = 0;

    camZone.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        camTouchId = t.identifier;
        camLastX = t.clientX;
        camLastY = t.clientY;
      },
      { passive: false },
    );

    camZone.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier !== camTouchId) continue;
          this.mouse.dx += (t.clientX - camLastX) * 1.5;
          this.mouse.dy += (t.clientY - camLastY) * 1.5;
          camLastX = t.clientX;
          camLastY = t.clientY;
        }
      },
      { passive: false },
    );

    const resetCam = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === camTouchId) camTouchId = null;
      }
    };
    camZone.addEventListener("touchend", resetCam, { passive: false });
    camZone.addEventListener("touchcancel", resetCam, { passive: false });

    // ── Shoot button ──
    const shootBtn = document.getElementById("touch-shoot");
    shootBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        this.mouse.clicked = true;
        this.mouse.down = true;
      },
      { passive: false },
    );
    shootBtn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.mouse.down = false;
      },
      { passive: false },
    );

    // ── Jump button ──
    const jumpBtn = document.getElementById("touch-jump");
    jumpBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        this.keys.space = true;
      },
      { passive: false },
    );
    jumpBtn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.keys.space = false;
      },
      { passive: false },
    );

    // ── Reload button ──
    const reloadBtn = document.getElementById("touch-reload");
    reloadBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        this.keys.r = true;
      },
      { passive: false },
    );
    reloadBtn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.keys.r = false;
      },
      { passive: false },
    );

    // ── Pause button ──
    const pauseBtn = document.getElementById("touch-pause");
    pauseBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        this.keys.escape = true;
      },
      { passive: false },
    );
    pauseBtn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.keys.escape = false;
      },
      { passive: false },
    );
  }

  requestPointerLock(canvas) {
    if (this.mobileMode) return; // no pointer lock on mobile
    if (!document.pointerLockElement) {
      canvas.requestPointerLock();
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  exitPointerLock() {
    if (this.mobileMode) return;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  resetMouseDelta() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  consumeKey(name) {
    if (this.keys[name]) {
      this.keys[name] = false;
      return true;
    }
    return false;
  }

  consumeClick() {
    if (this.mouse.clicked) {
      this.mouse.clicked = false;
      return true;
    }
    return false;
  }

  _onKey(e, pressed) {
    const key = e.key.toLowerCase();
    if (e.key === "Escape") {
      this.keys.escape = pressed;
      return;
    }
    if (key === " ") {
      e.preventDefault();
      this.keys.space = pressed;
      return;
    }
    if (key in this.keys) this.keys[key] = pressed;
  }
}
