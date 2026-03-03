# Urban Shadows 🔫

A browser-based **tactical third-person shooter** built with **Three.js** and **vanilla JavaScript** — no frameworks, no build tools. Playable on both **desktop** and **mobile**.

![Urban Shadows](https://img.shields.io/badge/status-production--ready-brightgreen)

---

## UI

## 🎮 Game Controls

### Desktop (Laptop)

| Action     | Input             |
| ---------- | ----------------- |
| Move       | `W` `A` `S` `D`   |
| Aim        | Mouse             |
| Shoot      | Left-click        |
| Jump       | `Space`           |
| Reload     | `R`               |
| Pause      | `ESC`             |
| Fullscreen | Fullscreen button |

### Mobile (Phone / Tablet)

| Action | Input                          |
| ------ | ------------------------------ |
| Move   | Virtual joystick (left side)   |
| Aim    | Swipe right side of screen     |
| Shoot  | 🎯 Shoot button (bottom-right) |
| Jump   | ⬆ Jump button (left of shoot)  |
| Reload | ↻ Reload button (above stick)  |
| Pause  | ⏸ Pause button (top-right)     |

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
├── index.html          # Game entry point + HUD + touch controls
├── styles.css          # UI styling, overlays, touch controls & animations
├── admin.html          # Developer admin panel
├── vercel.json         # Vercel deployment config
├── .env                # Environment variables
├── README.md
└── js/
    ├── main.js         # Game loop, state machine, HUD, camera, particles
    ├── Player.js       # Player class (movement, shooting, health, jumping)
    ├── Enemy.js        # Enemy class (patrol/chase AI, respawn)
    ├── Bullet.js       # Bullet class + object pool
    ├── InputHandler.js # Keyboard, mouse, pointer lock & touch controls
    └── utils.js        # Collision, spawn, angle helpers
```

---

## ✨ Features

### 🎮 Gameplay

- **Third-person camera** with smooth orbit and pitch control
- **Three.js rendering** with shadows, fog, and tone mapping
- **Light mode** environment — sky blue atmosphere with green terrain
- **WASD movement** with normalised diagonals
- **Mouse aiming** via Pointer Lock API — auto re-locks after alt-tab
- **Magazine + reserve ammo** system with reload
- **Jumping** with gravity physics
- **Patrol / Chase AI** with hysteresis to prevent flickering
- **Object-pooled bullets** — zero GC pressure
- **Particle effects** on hit and kill
- **Building collision** for player and enemies
- **Health bar** with colour gradient (green → yellow → red)

### 📱 Mobile Support

- **Device selection screen** — choose Phone/Tablet or Laptop on launch
- **Virtual joystick** — left side for movement
- **Camera swipe zone** — right side drag to aim
- **Touch buttons** — shoot (crosshair SVG), jump (arrow SVG), reload (circular SVG)
- **Touch pause button** — top-right corner
- **Adaptive UI** — menu text, controls hint change based on device

### 🖥️ UI & Flow

- **Device selection** → **Username entry** (danger-themed) → **Menu** → **Game**
- **Pause menu** with Resume, Restart & Exit options
- **Game Over screen** with score, kills & time survived
- **Danger-themed landing page** — hazard stripes, glowing red UI, flickering text
- **FPS counter**
- **Fullscreen support** with pointer lock recovery

### 🔒 Security

- **Admin panel** with hash-based authentication
- **No plaintext passwords** in source code
- **Session-less auth** — password required on every visit

### ⚙️ Technical

- **Smooth 60 FPS** game loop with delta-time
- **Responsive** — scales to any screen
- **Zero dependencies** — pure vanilla JS (ES6 modules) + Three.js via CDN
- **Vercel ready** — deploy in one command

---

## 📄 License

MIT — do whatever you want with it.
