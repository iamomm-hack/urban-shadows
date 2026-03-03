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

  requestPointerLock(canvas) {
    if (!document.pointerLockElement) {
      canvas.requestPointerLock();
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  exitPointerLock() {
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
