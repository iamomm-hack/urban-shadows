# Urban Shadows 🔫

A browser-based 2D top-down tactical shooter built with **HTML Canvas** and **vanilla JavaScript** — no frameworks, no dependencies.

![Urban Shadows](https://img.shields.io/badge/status-production--ready-brightgreen)

---

## 🎮 Game Controls

| Action  | Input              |
| ------- | ------------------ |
| Move    | `W` `A` `S` `D`    |
| Aim     | Mouse              |
| Shoot   | Left-click         |
| Reload  | `R`                |
| Pause   | `ESC`              |
| Start   | `SPACE`            |
| Restart | `R` (on game-over) |

---

## 🚀 Run Locally

No build step needed — just serve the files over HTTP.

### Option 1: VS Code Live Server

1. Install the **Live Server** extension.
2. Right-click `index.html` → **Open with Live Server**.

### Option 2: Python

```bash
# Python 3
python -m http.server 8080

# Then open http://localhost:8080 in your browser
```

### Option 3: Node.js

```bash
npx -y serve .
```

> **Note:** Opening `index.html` directly via `file://` won't work because ES6 modules require an HTTP server.

---

## 🌐 Deploy to Vercel

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. From the project root:
   ```bash
   vercel
   ```
3. Follow the prompts — that's it! The included `vercel.json` handles the rest.

---

## 📁 Project Structure

```
urban-shadows/
├── index.html          # Canvas + module entry point
├── styles.css          # Page styling & responsive canvas
├── vercel.json         # Vercel deployment config
├── README.md
└── js/
    ├── main.js         # Game loop, state machine, HUD, particles
    ├── Player.js       # Player class (movement, shooting, health)
    ├── Enemy.js        # Enemy class (patrol/chase AI)
    ├── Bullet.js       # Bullet class + object pool
    ├── InputHandler.js # Keyboard & mouse tracking
    └── utils.js        # Collision, distance, angle helpers
```

---

## ✨ Features

- **Smooth 60 FPS** game loop with delta-time
- **8-directional movement** with normalised diagonals
- **Mouse aiming** — player triangle rotates toward cursor
- **Magazine + reserve ammo** system with 2-second reload
- **Patrol / Chase AI** with hysteresis to prevent flickering
- **Object-pooled bullets** (max 50) — zero GC pressure
- **Particle effects** on hit and kill
- **Muzzle flash** on each shot
- **Health bar** with colour gradient (green → yellow → red)
- **Game states**: Menu → Playing ↔ Paused → Game Over
- **Score & stats** (kills, time survived)
- **FPS counter**
- **Sound-effect hooks** (commented code, ready to wire up)
- **Responsive canvas** — scales to any screen
- **Zero dependencies** — pure vanilla JS (ES6+)

---

## 📄 License

MIT — do whatever you want with it.
