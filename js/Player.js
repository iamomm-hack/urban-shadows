import * as THREE from "three";
import { clamp } from "./utils.js";

const SPEED = 8;
const RADIUS = 0.5;
const MAX_HP = 100;
const MAG_SIZE = 30;
const RESERVE_MAX = 200;
const RELOAD_TIME = 1.5;
const SHOOT_COOLDOWN = 0.12;
const MUZZLE_FLASH_DURATION = 0.06;

const JUMP_FORCE = 9;
const GRAVITY = 22;

const yellowMain = new THREE.MeshLambertMaterial({ color: 0xf0c830 });
const yellowLight = new THREE.MeshLambertMaterial({ color: 0xffe066 });
const redVisor = new THREE.MeshBasicMaterial({ color: 0xff2222 });
const redAccent = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
const grayMetal = new THREE.MeshLambertMaterial({ color: 0x888888 });
const darkMetal = new THREE.MeshLambertMaterial({ color: 0x333333 });
const whiteMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });

export default class Player {
  constructor(scene) {
    this.scene = scene;
    this.radius = RADIUS;

    this.group = new THREE.Group();

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.6, 0.35),
      yellowMain,
    );
    torso.position.y = 1.05;
    this.group.add(torso);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.55, 0.36),
      redAccent,
    );
    stripe.position.y = 1.05;
    this.group.add(stripe);

    const shoulderGeo = new THREE.BoxGeometry(0.2, 0.15, 0.3);
    const leftShoulder = new THREE.Mesh(shoulderGeo, yellowLight);
    leftShoulder.position.set(-0.38, 1.3, 0);
    this.group.add(leftShoulder);
    const rightShoulder = new THREE.Mesh(shoulderGeo, yellowLight);
    rightShoulder.position.set(0.38, 1.3, 0);
    this.group.add(rightShoulder);

    const headBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.3, 0.3),
      whiteMat,
    );
    headBase.position.y = 1.55;
    this.group.add(headBase);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      yellowMain,
    );
    helmet.position.y = 1.65;
    this.group.add(helmet);

    const visorGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const leftEye = new THREE.Mesh(visorGeo, redVisor);
    leftEye.position.set(-0.08, 1.55, 0.16);
    this.group.add(leftEye);
    const rightEye = new THREE.Mesh(visorGeo, redVisor);
    rightEye.position.set(0.08, 1.55, 0.16);
    this.group.add(rightEye);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8);

    const leftArm = new THREE.Mesh(armGeo, grayMetal);
    leftArm.position.set(-0.38, 0.95, 0);
    this.group.add(leftArm);
    this.leftArm = leftArm;

    const fistGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const leftFist = new THREE.Mesh(fistGeo, darkMetal);
    leftFist.position.set(-0.38, 0.72, 0);
    this.group.add(leftFist);
    this.leftFist = leftFist;

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.38, 1.1, 0);
    const rightArm = new THREE.Mesh(armGeo, grayMetal);
    rightArm.position.y = -0.18;
    this.rightArmPivot.add(rightArm);

    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.5),
      darkMetal,
    );
    gunBody.position.set(0, -0.38, 0.22);
    this.rightArmPivot.add(gunBody);

    const gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6),
      grayMetal,
    );
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, -0.38, 0.5);
    this.rightArmPivot.add(gunBarrel);

    this.group.add(this.rightArmPivot);

    const legGeo = new THREE.BoxGeometry(0.14, 0.4, 0.16);
    const leftLeg = new THREE.Mesh(legGeo, grayMetal);
    leftLeg.position.set(-0.14, 0.55, 0);
    this.group.add(leftLeg);
    this.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, grayMetal);
    rightLeg.position.set(0.14, 0.55, 0);
    this.group.add(rightLeg);
    this.rightLeg = rightLeg;

    const bootGeo = new THREE.BoxGeometry(0.16, 0.12, 0.22);
    const leftBoot = new THREE.Mesh(bootGeo, darkMetal);
    leftBoot.position.set(-0.14, 0.3, 0.03);
    this.group.add(leftBoot);
    this.leftBoot = leftBoot;

    const rightBoot = new THREE.Mesh(bootGeo, darkMetal);
    rightBoot.position.set(0.14, 0.3, 0.03);
    this.group.add(rightBoot);
    this.rightBoot = rightBoot;

    this.group.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });

    scene.add(this.group);

    this.muzzleLight = new THREE.PointLight(0xffe066, 0, 5);
    this.muzzleLight.position.set(0, -0.38, 0.6);
    this.rightArmPivot.add(this.muzzleLight);

    this.hp = MAX_HP;
    this.maxHp = MAX_HP;
    this.alive = true;
    this.damageFlashTimer = 0;

    this.magAmmo = MAG_SIZE;
    this.reserveAmmo = RESERVE_MAX;
    this.reloading = false;
    this.reloadTimer = 0;

    this.shootTimer = 0;
    this.muzzleFlash = 0;

    this.kills = 0;

    this.walkPhase = 0;
    this.isMoving = false;

    this.velocityY = 0;
    this.onGround = true;
  }

  reset() {
    this.group.position.set(0, 0, 0);
    this.group.rotation.y = 0;
    this.hp = MAX_HP;
    this.alive = true;
    this.damageFlashTimer = 0;
    this.magAmmo = MAG_SIZE;
    this.reserveAmmo = RESERVE_MAX;
    this.reloading = false;
    this.reloadTimer = 0;
    this.shootTimer = 0;
    this.muzzleFlash = 0;
    this.kills = 0;
    this.walkPhase = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.group.visible = true;
  }

  update(dt, keys, mouse, shotFired, cameraYaw, arenaHalf, bulletPool) {
    if (!this.alive) return;

    let dx = 0,
      dz = 0;
    if (keys.w) dz += 1;
    if (keys.s) dz -= 1;
    if (keys.a) dx += 1;
    if (keys.d) dx -= 1;

    this.isMoving = dx !== 0 || dz !== 0;

    if (this.isMoving) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx /= len;
      dz /= len;

      const sinY = Math.sin(cameraYaw);
      const cosY = Math.cos(cameraYaw);
      const moveX = dx * cosY + dz * sinY;
      const moveZ = -dx * sinY + dz * cosY;

      const spd =
        localStorage.getItem("speedboost") === "true" ? SPEED * 2 : SPEED;
      this.group.position.x += moveX * spd * dt;
      this.group.position.z += moveZ * spd * dt;

      this.group.rotation.y = Math.atan2(moveX, moveZ);
    }

    this.group.position.x = clamp(
      this.group.position.x,
      -arenaHalf + 1,
      arenaHalf - 1,
    );
    this.group.position.z = clamp(
      this.group.position.z,
      -arenaHalf + 1,
      arenaHalf - 1,
    );

    if (mouse.down || this.shootTimer > 0) {
      this.group.rotation.y = cameraYaw;
    }

    if (keys.space && this.onGround) {
      this.velocityY = JUMP_FORCE;
      this.onGround = false;
    }

    this.velocityY -= GRAVITY * dt;
    this.group.position.y += this.velocityY * dt;

    if (this.group.position.y <= 0) {
      this.group.position.y = 0;
      this.velocityY = 0;
      this.onGround = true;
    }

    if (this.isMoving && this.onGround) {
      this.walkPhase += dt * 10;
      const swing = Math.sin(this.walkPhase) * 0.35;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.5;
      this.leftFist.position.y = 0.72 + Math.sin(this.walkPhase) * 0.03;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.walkPhase = 0;
    }

    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = MAG_SIZE - this.magAmmo;
        const canLoad = Math.min(needed, this.reserveAmmo);
        this.magAmmo += canLoad;
        this.reserveAmmo -= canLoad;
        this.reloading = false;
      }
    }
    if (
      keys.r &&
      !this.reloading &&
      this.magAmmo < MAG_SIZE &&
      this.reserveAmmo > 0
    ) {
      this._startReload();
    }

    if (this.shootTimer > 0) this.shootTimer -= dt;

    if (
      mouse.down &&
      !this.reloading &&
      this.shootTimer <= 0 &&
      this.magAmmo > 0
    ) {
      this._shoot(cameraYaw, bulletPool);
    }

    if (this.muzzleFlash > 0) {
      this.muzzleFlash -= dt;
      this.muzzleLight.intensity =
        (this.muzzleFlash / MUZZLE_FLASH_DURATION) * 4;
    } else {
      this.muzzleLight.intensity = 0;
    }

    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

    this.rightArmPivot.rotation.x *= 0.85;
  }

  _shoot(cameraYaw, bulletPool) {
    const dir = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
    const gunTip = new THREE.Vector3();
    this.muzzleLight.getWorldPosition(gunTip);
    gunTip.y = this.group.position.y + 1.0;

    bulletPool.fire(gunTip, dir);
    this.magAmmo--;
    this.shootTimer = SHOOT_COOLDOWN;
    this.muzzleFlash = MUZZLE_FLASH_DURATION;
    this.rightArmPivot.rotation.x = -0.3;

    if (this.magAmmo === 0 && this.reserveAmmo > 0) this._startReload();
  }

  _startReload() {
    this.reloading = true;
    this.reloadTimer = RELOAD_TIME;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.damageFlashTimer = 0.2;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  get position() {
    return this.group.position;
  }
}
