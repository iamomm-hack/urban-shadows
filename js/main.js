import * as THREE from "three";
import InputHandler from "./InputHandler.js";
import Player from "./Player.js";
import Enemy, { DAMAGE_PER_SEC } from "./Enemy.js";
import { BulletPool } from "./Bullet.js";
import {
  sphereCollision,
  randomEdgeSpawn,
  randomRange,
  clamp,
} from "./utils.js";

// dev mode flags from admin panel
function isDevMode() {
  return localStorage.getItem("devmode") === "true";
}
function isOneShot() {
  return localStorage.getItem("oneshot") === "true";
}
function isSpeedBoost() {
  return localStorage.getItem("speedboost") === "true";
}

const ARENA_SIZE = 50;
const ARENA_HALF = ARENA_SIZE / 2;
const ENEMY_COUNT = 5;

const CAM_DISTANCE = 8;
const CAM_HEIGHT = 5;
const CAM_SENSITIVITY = 0.003;
const CAM_MIN_PITCH = 0.3;
const CAM_MAX_PITCH = 1.2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

scene.add(new THREE.AmbientLight(0x334466, 1.0));

const moonLight = new THREE.DirectionalLight(0x8899cc, 2.0);
moonLight.position.set(15, 25, 10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 80;
moonLight.shadow.camera.left = -ARENA_HALF;
moonLight.shadow.camera.right = ARENA_HALF;
moonLight.shadow.camera.top = ARENA_HALF;
moonLight.shadow.camera.bottom = -ARENA_HALF;
scene.add(moonLight);

scene.add(new THREE.HemisphereLight(0x223344, 0x111122, 0.3));

const groundGeo = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(
  ARENA_SIZE,
  ARENA_SIZE / 2,
  0x222244,
  0x222244,
);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

const wallMat = new THREE.MeshLambertMaterial({
  color: 0x334466,
  transparent: true,
  opacity: 0.3,
});
const wallHeight = 3;

function createWall(width, height, depth, x, y, z) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    wallMat,
  );
  wall.position.set(x, y, z);
  wall.receiveShadow = true;
  scene.add(wall);
}

createWall(ARENA_SIZE, wallHeight, 0.3, 0, wallHeight / 2, -ARENA_HALF);
createWall(ARENA_SIZE, wallHeight, 0.3, 0, wallHeight / 2, ARENA_HALF);
createWall(0.3, wallHeight, ARENA_SIZE, -ARENA_HALF, wallHeight / 2, 0);
createWall(0.3, wallHeight, ARENA_SIZE, ARENA_HALF, wallHeight / 2, 0);

const buildingMat = new THREE.MeshLambertMaterial({ color: 0x2a2a3e });
const buildingData = [
  { w: 4, h: 4, d: 4, x: -10, z: -8 },
  { w: 3, h: 3, d: 5, x: 12, z: 6 },
  { w: 5, h: 5, d: 3, x: -6, z: 14 },
  { w: 3, h: 2.5, d: 3, x: 8, z: -12 },
  { w: 6, h: 3, d: 2, x: 0, z: -16 },
  { w: 2, h: 6, d: 2, x: -16, z: 2 },
  { w: 4, h: 3, d: 4, x: 16, z: -4 },
  { w: 3, h: 4, d: 3, x: -4, z: -4 },
];

for (const b of buildingData) {
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(b.w, b.h, b.d),
    buildingMat.clone(),
  );
  building.position.set(b.x, b.h / 2, b.z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(b.w + 0.3, 0.15, b.d + 0.3),
    new THREE.MeshLambertMaterial({ color: 0x3a3a55 }),
  );
  roof.position.set(b.x, b.h + 0.075, b.z);
  scene.add(roof);
}

const lampPositions = [
  [-15, -15],
  [15, -15],
  [-15, 15],
  [15, 15],
  [0, 10],
  [0, -10],
  [10, 0],
  [-10, 0],
];

for (const [lx, lz] of lampPositions) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3, 6),
    new THREE.MeshLambertMaterial({ color: 0x555555 }),
  );
  pole.position.set(lx, 1.5, lz);
  scene.add(pole);

  const lampHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffaa44 }),
  );
  lampHead.position.set(lx, 3.1, lz);
  scene.add(lampHead);

  const lampLight = new THREE.PointLight(0xffaa44, 0.6, 10);
  lampLight.position.set(lx, 3, lz);
  scene.add(lampLight);
}

const STATES = {
  DEVICE_SELECT: -2,
  USERNAME: -1,
  MENU: 0,
  PLAYING: 1,
  PAUSED: 2,
  GAME_OVER: 3,
};
let state = STATES.DEVICE_SELECT;
let playerUsername = "";
let isMobileMode = false;

const input = new InputHandler();
let player, bulletPool, enemies;
let score = 0,
  timeSurvived = 0;
let particles = [];

let camYaw = 0;
let camPitch = 0.6;

let fps = 0,
  fpsFrames = 0,
  fpsTimer = 0;

const hud = document.getElementById("hud");
const healthFill = document.getElementById("health-bar-fill");
const healthText = document.getElementById("health-text");
const timeDisplay = document.getElementById("time-display");
const reloadText = document.getElementById("reload-text");
const ammoDisplay = document.getElementById("ammo-display");
const scoreDisplay = document.getElementById("score-display");
const fpsCounter = document.getElementById("fps-counter");
const damageFlash = document.getElementById("damage-flash");

const deviceScreen = document.getElementById("device-screen");
const devicePhoneBtn = document.getElementById("device-phone");
const deviceLaptopBtn = document.getElementById("device-laptop");
const usernameScreen = document.getElementById("username-screen");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");
const menuScreen = document.getElementById("menu-screen");
const pauseScreen = document.getElementById("pause-screen");
const gameoverScreen = document.getElementById("gameover-screen");
const finalScore = document.getElementById("final-score");
const finalKills = document.getElementById("final-kills");
const finalTime = document.getElementById("final-time");

const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");

const particleMeshes = [];
const particleGeo = new THREE.SphereGeometry(0.04, 4, 4);

function spawnParticles(position, count, color) {
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(particleGeo, mat);
    mesh.position.copy(position);

    const angle = Math.random() * Math.PI * 2;
    const pitch = randomRange(-0.5, 0.8);
    const speed = randomRange(3, 8);
    const life = randomRange(0.2, 0.5);

    scene.add(mesh);
    particles.push({
      mesh,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(pitch) * speed * 0.5 + 2,
      vz: Math.sin(angle) * speed,
      life,
      maxLife: life,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 9.8 * dt;
    p.life -= dt;
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);

    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose && p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

function clearParticles() {
  for (const p of particles) {
    scene.remove(p.mesh);
    p.mesh.material.dispose();
  }
  particles.length = 0;
}

function initGame() {
  if (player) scene.remove(player.group);
  if (enemies) {
    for (const e of enemies) scene.remove(e.group);
  }
  if (bulletPool) {
    for (const b of bulletPool.pool) {
      scene.remove(b.mesh);
      scene.remove(b.light);
    }
  }
  clearParticles();

  player = new Player(scene);
  bulletPool = new BulletPool(scene);
  enemies = [];
  score = 0;
  timeSurvived = 0;
  camYaw = 0;
  camPitch = 0.6;

  for (let i = 0; i < ENEMY_COUNT; i++) {
    const pos = randomEdgeSpawn(ARENA_HALF, ARENA_HALF, player.position);
    enemies.push(new Enemy(scene, pos.x, pos.z, ARENA_HALF));
  }
}

function showScreen(screen) {
  deviceScreen.classList.remove("active");
  usernameScreen.classList.remove("active");
  menuScreen.classList.remove("active");
  pauseScreen.classList.remove("active");
  gameoverScreen.classList.remove("active");
  if (screen) screen.classList.add("active");
}

function setHUDVisible(v) {
  hud.classList.toggle("visible", v);
}

function updateCamera() {
  if (!player) return;

  const target = player.position;

  const cx = target.x - Math.sin(camYaw) * Math.cos(camPitch) * CAM_DISTANCE;
  const cy = target.y + Math.sin(camPitch) * CAM_HEIGHT;
  const cz = target.z - Math.cos(camYaw) * Math.cos(camPitch) * CAM_DISTANCE;

  camera.position.set(cx, cy, cz);
  camera.lookAt(target.x, target.y + 1.2, target.z);
}

function updateHUD() {
  if (!player) return;

  const ratio = player.hp / player.maxHp;
  healthFill.style.width = `${ratio * 100}%`;
  healthFill.className = ratio > 0.5 ? "" : ratio > 0.25 ? "medium" : "low";
  healthText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

  timeDisplay.textContent = formatTime(timeSurvived);

  reloadText.classList.toggle("visible", player.reloading);

  ammoDisplay.textContent = `${player.magAmmo} / ${player.reserveAmmo}`;
  ammoDisplay.classList.toggle(
    "empty",
    player.magAmmo === 0 && !player.reloading,
  );

  scoreDisplay.textContent = `Score: ${score}`;

  fpsCounter.textContent = `${fps} FPS`;

  damageFlash.classList.toggle("active", player.damageFlashTimer > 0);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);

  fpsFrames++;
  fpsTimer += dt;
  if (fpsTimer >= 1) {
    fps = fpsFrames;
    fpsFrames = 0;
    fpsTimer -= 1;
  }

  switch (state) {
    case STATES.DEVICE_SELECT:
    case STATES.USERNAME:
      // camera orbit in background but don't call tickMenu (it overrides the screen)
      camYaw += dt * 0.2;
      camera.position.set(Math.sin(camYaw) * 20, 12, Math.cos(camYaw) * 20);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      break;
    case STATES.MENU:
      tickMenu(dt);
      break;
    case STATES.PLAYING:
      tickPlaying(dt);
      break;
    case STATES.PAUSED:
      tickPaused(dt);
      break;
    case STATES.GAME_OVER:
      tickGameOver(dt);
      break;
  }
});

// Device selection handlers
devicePhoneBtn.addEventListener("click", () => {
  isMobileMode = true;
  input.enableMobileMode();
  // Update menu text for mobile
  const menuPrompt = document.getElementById("menu-prompt");
  const menuControls = document.getElementById("menu-controls");
  if (menuPrompt) menuPrompt.textContent = "Tap to Start";
  if (menuControls)
    menuControls.textContent =
      "Joystick — Move  |  Swipe — Aim  |  🔥 — Shoot  |  ⬆ — Jump";
  state = STATES.USERNAME;
  showScreen(usernameScreen);
  usernameInput.focus();
});

deviceLaptopBtn.addEventListener("click", () => {
  isMobileMode = false;
  state = STATES.USERNAME;
  showScreen(usernameScreen);
  usernameInput.focus();
});

// Username submit handler
function submitUsername() {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.style.borderColor = "#ff0000";
    usernameInput.style.animation = "shake 0.4s ease";
    setTimeout(() => {
      usernameInput.style.animation = "";
    }, 400);
    return;
  }
  playerUsername = name;
  localStorage.setItem("player_username", name);
  state = STATES.MENU;
  showScreen(menuScreen);
}

usernameSubmit.addEventListener("click", submitUsername);
usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitUsername();
});

document.addEventListener("click", (e) => {
  // if clicking a button, let the button handler do it
  if (e.target.tagName === "BUTTON") return;

  // re-acquire pointer lock if lost during gameplay (e.g. after alt-tab)
  if (state === STATES.PLAYING && !document.pointerLockElement) {
    input.requestPointerLock(renderer.domElement);
    return;
  }

  if (state === STATES.MENU) {
    initGame();
    state = STATES.PLAYING;
    showScreen(null);
    setHUDVisible(true);
    input.requestPointerLock(renderer.domElement);
  } else if (state === STATES.GAME_OVER) {
    initGame();
    state = STATES.PLAYING;
    showScreen(null);
    setHUDVisible(true);
    input.requestPointerLock(renderer.domElement);
  }
});

resumeBtn.addEventListener("click", () => {
  if (state === STATES.PAUSED) {
    state = STATES.PLAYING;
    showScreen(null);
    input.requestPointerLock(renderer.domElement);
  }
});

restartBtn.addEventListener("click", () => {
  if (state === STATES.PAUSED) {
    initGame();
    state = STATES.PLAYING;
    showScreen(null);
    setHUDVisible(true);
    input.requestPointerLock(renderer.domElement);
  }
});

const exitBtn = document.getElementById("exit-btn");
exitBtn.addEventListener("click", () => {
  if (state === STATES.PAUSED) {
    state = STATES.MENU;
    showScreen(menuScreen);
    setHUDVisible(false);
  }
});

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Re-acquire pointer lock when returning from minimized/alt-tab
document.addEventListener("fullscreenchange", () => {
  if (
    document.fullscreenElement &&
    state === STATES.PLAYING &&
    !document.pointerLockElement
  ) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener("visibilitychange", () => {
  if (
    !document.hidden &&
    state === STATES.PLAYING &&
    !document.pointerLockElement
  ) {
    renderer.domElement.requestPointerLock();
  }
});

function tickMenu(dt) {
  showScreen(menuScreen);
  setHUDVisible(false);

  camYaw += dt * 0.2;
  camera.position.set(Math.sin(camYaw) * 20, 12, Math.cos(camYaw) * 20);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function tickPlaying(dt) {
  if (input.consumeKey("escape")) {
    state = STATES.PAUSED;
    showScreen(pauseScreen);
    input.exitPointerLock();
    return;
  }

  timeSurvived += dt;

  camYaw -= input.mouse.dx * CAM_SENSITIVITY;
  camPitch = clamp(
    camPitch - input.mouse.dy * CAM_SENSITIVITY,
    CAM_MIN_PITCH,
    CAM_MAX_PITCH,
  );
  input.resetMouseDelta();

  const shotFired = input.consumeClick();
  player.update(
    dt,
    input.keys,
    input.mouse,
    shotFired,
    camYaw,
    ARENA_HALF,
    bulletPool,
  );
  bulletPool.update(dt);
  for (const e of enemies) e.update(dt, player.position);

  // dev mode superpowers
  if (isDevMode()) {
    player.magAmmo = 30;
    player.reserveAmmo = 200;
    player.hp = player.maxHp;
    player.reloading = false;
  }
  if (isSpeedBoost()) {
    player.group.position.x += player.group.position.x - player._prevX || 0;
    player.group.position.z += player.group.position.z - player._prevZ || 0;
  }

  for (const b of buildingData) {
    const halfW = b.w / 2 + player.radius;
    const halfD = b.d / 2 + player.radius;
    const px = player.position.x;
    const pz = player.position.z;
    if (
      px > b.x - halfW &&
      px < b.x + halfW &&
      pz > b.z - halfD &&
      pz < b.z + halfD
    ) {
      const overlapLeft = px - (b.x - halfW);
      const overlapRight = b.x + halfW - px;
      const overlapTop = pz - (b.z - halfD);
      const overlapBot = b.z + halfD - pz;
      const minOverlap = Math.min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBot,
      );
      if (minOverlap === overlapLeft) player.group.position.x = b.x - halfW;
      else if (minOverlap === overlapRight)
        player.group.position.x = b.x + halfW;
      else if (minOverlap === overlapTop) player.group.position.z = b.z - halfD;
      else player.group.position.z = b.z + halfD;
    }
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    for (const b of buildingData) {
      const halfW = b.w / 2 + e.radius;
      const halfD = b.d / 2 + e.radius;
      const ex = e.position.x;
      const ez = e.position.z;
      if (
        ex > b.x - halfW &&
        ex < b.x + halfW &&
        ez > b.z - halfD &&
        ez < b.z + halfD
      ) {
        const overlapLeft = ex - (b.x - halfW);
        const overlapRight = b.x + halfW - ex;
        const overlapTop = ez - (b.z - halfD);
        const overlapBot = b.z + halfD - ez;
        const minOverlap = Math.min(
          overlapLeft,
          overlapRight,
          overlapTop,
          overlapBot,
        );
        if (minOverlap === overlapLeft) e.group.position.x = b.x - halfW;
        else if (minOverlap === overlapRight) e.group.position.x = b.x + halfW;
        else if (minOverlap === overlapTop) e.group.position.z = b.z - halfD;
        else e.group.position.z = b.z + halfD;
      }
    }
  }

  const activeBullets = bulletPool.getActive();
  const oneshot = isOneShot();
  for (const b of activeBullets) {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (b.hits(e.position, e.radius)) {
        b.deactivate();
        let killed;
        if (oneshot) {
          e.hp = 0;
          e.alive = false;
          e.deathTimer = 0;
          e.respawnTimer = 5;
          killed = true;
        } else {
          killed = e.hit();
        }
        spawnParticles(
          b.mesh.position.clone(),
          killed ? 15 : 6,
          killed ? 0xff4444 : 0xffaa44,
        );
        if (killed) {
          score += e.scoreValue;
          player.kills++;
        }
        break;
      }
    }
  }

  if (player.alive) {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (
        sphereCollision(player.position, player.radius, e.position, e.radius)
      ) {
        player.takeDamage(DAMAGE_PER_SEC * dt);

        const sepDx = e.position.x - player.position.x;
        const sepDz = e.position.z - player.position.z;
        const sepDist = Math.sqrt(sepDx * sepDx + sepDz * sepDz) || 0.01;
        const overlap = player.radius + e.radius - sepDist;
        if (overlap > 0) {
          e.group.position.x += (sepDx / sepDist) * (overlap + 0.05);
          e.group.position.z += (sepDz / sepDist) * (overlap + 0.05);
        }
      }
    }
  }

  for (let i = 0; i < enemies.length; i++) {
    if (!enemies[i].alive) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      if (!enemies[j].alive) continue;
      const ei = enemies[i],
        ej = enemies[j];
      if (sphereCollision(ei.position, ei.radius, ej.position, ej.radius)) {
        const dx = ej.position.x - ei.position.x;
        const dz = ej.position.z - ei.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
        const overlap = ei.radius + ej.radius - dist;
        if (overlap > 0) {
          const pushX = (dx / dist) * (overlap / 2 + 0.02);
          const pushZ = (dz / dist) * (overlap / 2 + 0.02);
          ei.group.position.x -= pushX;
          ei.group.position.z -= pushZ;
          ej.group.position.x += pushX;
          ej.group.position.z += pushZ;
        }
      }
    }
  }

  if (!player.alive) {
    state = STATES.GAME_OVER;
    showScreen(gameoverScreen);
    finalScore.textContent = score;
    finalKills.textContent = player.kills;
    finalTime.textContent = formatTime(timeSurvived);
    input.exitPointerLock();
  }

  updateParticles(dt);

  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

function tickPaused(dt) {
  renderer.render(scene, camera);
}

function tickGameOver(dt) {
  camYaw += dt * 0.3;
  updateCamera();
  updateParticles(dt);
  renderer.render(scene, camera);
}
