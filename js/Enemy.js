import * as THREE from "three";
import {
  getDistance,
  getAngleXZ,
  randomRange,
  randomEdgeSpawn,
} from "./utils.js";

const RADIUS = 0.4;
const MAX_HP = 3;
const PATROL_SPEED = 3;
const CHASE_SPEED = 5;
const DETECT_RANGE = 12;
const LOSE_RANGE = 16;
const DIRECTION_CHANGE = 2.5;
const DAMAGE_PER_SEC = 20;
const DEATH_FADE_TIME = 0.5;
const RESPAWN_DELAY = 5;
const HIT_FLASH_TIME = 0.12;
const STATE = { PATROL: 0, CHASE: 1 };

const greenMain = new THREE.MeshLambertMaterial({ color: 0x4a8c3f });
const greenLight = new THREE.MeshLambertMaterial({ color: 0x6db85a });
const brownAccent = new THREE.MeshLambertMaterial({ color: 0x8b6b3d });
const cyanVisor = new THREE.MeshBasicMaterial({ color: 0x44ddff });
const grayMetal = new THREE.MeshLambertMaterial({ color: 0x777777 });
const darkMetal = new THREE.MeshLambertMaterial({ color: 0x333333 });
const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

export default class Enemy {
  constructor(scene, x, z, arenaHalf) {
    this.scene = scene;
    this.arenaHalf = arenaHalf;
    this.radius = RADIUS;

    this.group = new THREE.Group();

    this.torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.5, 0.3),
      greenMain.clone(),
    );
    this.torso.position.y = 1.0;
    this.group.add(this.torso);

    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.08, 0.32),
      brownAccent.clone(),
    );
    belt.position.y = 0.78;
    this.group.add(belt);

    const shoulderGeo = new THREE.BoxGeometry(0.18, 0.12, 0.26);
    const ls = new THREE.Mesh(shoulderGeo, greenLight.clone());
    ls.position.set(-0.34, 1.22, 0);
    this.group.add(ls);
    const rs = new THREE.Mesh(shoulderGeo, greenLight.clone());
    rs.position.set(0.34, 1.22, 0);
    this.group.add(rs);

    this.head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      greenMain.clone(),
    );
    this.head.position.y = 1.48;
    this.group.add(this.head);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.1, 0.08),
      cyanVisor.clone(),
    );
    visor.position.set(0, 1.46, 0.16);
    this.group.add(visor);

    const armGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.35, 8);
    this.leftArm = new THREE.Mesh(armGeo, brownAccent.clone());
    this.leftArm.position.set(-0.34, 0.9, 0);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, brownAccent.clone());
    this.rightArm.position.set(0.34, 0.9, 0);
    this.group.add(this.rightArm);

    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.4),
      grayMetal.clone(),
    );
    gun.position.set(0.34, 0.7, 0.18);
    this.group.add(gun);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.15, 6),
      darkMetal,
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.34, 0.7, 0.42);
    this.group.add(barrel);

    const legGeo = new THREE.BoxGeometry(0.12, 0.35, 0.14);
    this.leftLeg = new THREE.Mesh(legGeo, brownAccent.clone());
    this.leftLeg.position.set(-0.12, 0.5, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, brownAccent.clone());
    this.rightLeg.position.set(0.12, 0.5, 0);
    this.group.add(this.rightLeg);

    const bootGeo = new THREE.BoxGeometry(0.14, 0.1, 0.18);
    this.leftBoot = new THREE.Mesh(bootGeo, darkMetal);
    this.leftBoot.position.set(-0.12, 0.28, 0.02);
    this.group.add(this.leftBoot);
    this.rightBoot = new THREE.Mesh(bootGeo, darkMetal);
    this.rightBoot.position.set(0.12, 0.28, 0.02);
    this.group.add(this.rightBoot);

    this.hpPips = [];
    const pipGeo = new THREE.SphereGeometry(0.04, 6, 6);
    for (let i = 0; i < MAX_HP; i++) {
      const pip = new THREE.Mesh(
        pipGeo,
        new THREE.MeshBasicMaterial({ color: 0x44ff44 }),
      );
      pip.position.set((i - 1) * 0.12, 1.85, 0);
      pip.visible = false;
      this.group.add(pip);
      this.hpPips.push(pip);
    }

    this.group.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    this.group.position.set(x, 0, z);
    scene.add(this.group);

    this.hp = MAX_HP;
    this.alive = true;
    this.state = STATE.PATROL;
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.dirTimer = randomRange(1.5, 3);
    this.deathTimer = 0;
    this.respawnTimer = 0;
    this.hitFlash = 0;
    this.scoreValue = 100;
    this.walkPhase = Math.random() * Math.PI * 2;

    this._origMaterials = [];
    this.group.traverse((child) => {
      if (child.isMesh)
        this._origMaterials.push({ mesh: child, mat: child.material });
    });
  }

  update(dt, playerPos) {
    if (!this.alive) {
      if (this.deathTimer < DEATH_FADE_TIME) {
        this.deathTimer += dt;
        const alpha = 1 - this.deathTimer / DEATH_FADE_TIME;
        this.group.traverse((child) => {
          if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = alpha;
          }
        });
        this.group.position.y = -(this.deathTimer / DEATH_FADE_TIME) * 0.5;
      } else {
        this.group.visible = false;
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) this._respawn(playerPos);
      }
      return;
    }

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.hitFlash <= 0) {
        for (const entry of this._origMaterials)
          entry.mesh.material = entry.mat;
      }
    }

    const dist = getDistance(this.group.position, playerPos);
    if (this.state === STATE.PATROL && dist < DETECT_RANGE) {
      this.state = STATE.CHASE;
    } else if (this.state === STATE.CHASE && dist > LOSE_RANGE) {
      this.state = STATE.PATROL;
      this.patrolAngle = Math.random() * Math.PI * 2;
      this.dirTimer = randomRange(1.5, 3);
    }

    let speed, angle;
    if (this.state === STATE.CHASE) {
      speed = CHASE_SPEED;
      angle = getAngleXZ(this.group.position, playerPos);
      this.group.rotation.y = Math.atan2(
        playerPos.x - this.group.position.x,
        playerPos.z - this.group.position.z,
      );
    } else {
      speed = PATROL_SPEED;
      angle = this.patrolAngle;
      this.dirTimer -= dt;
      if (this.dirTimer <= 0) {
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.dirTimer = randomRange(1.5, 3);
      }
      this.group.rotation.y = Math.atan2(
        Math.sin(angle + Math.PI / 2),
        Math.cos(angle + Math.PI / 2),
      );
    }

    this.group.position.x += Math.cos(angle) * speed * dt;
    this.group.position.z += Math.sin(angle) * speed * dt;

    const limit = this.arenaHalf - 1;
    if (this.group.position.x < -limit) {
      this.group.position.x = -limit;
      this.patrolAngle = Math.PI - this.patrolAngle;
    }
    if (this.group.position.x > limit) {
      this.group.position.x = limit;
      this.patrolAngle = Math.PI - this.patrolAngle;
    }
    if (this.group.position.z < -limit) {
      this.group.position.z = -limit;
      this.patrolAngle = -this.patrolAngle;
    }
    if (this.group.position.z > limit) {
      this.group.position.z = limit;
      this.patrolAngle = -this.patrolAngle;
    }

    this.walkPhase += dt * (this.state === STATE.CHASE ? 12 : 8);
    const swing = Math.sin(this.walkPhase) * 0.3;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
    this.leftArm.rotation.x = -swing * 0.5;
    this.rightArm.rotation.x = swing * 0.5;
  }

  hit() {
    if (!this.alive) return false;
    this.hp--;
    this.hitFlash = HIT_FLASH_TIME;
    this.group.traverse((child) => {
      if (child.isMesh) child.material = flashMat;
    });
    this._updatePips();
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer = 0;
      this.respawnTimer = RESPAWN_DELAY;
      return true;
    }
    return false;
  }

  _updatePips() {
    for (let i = 0; i < MAX_HP; i++) {
      this.hpPips[i].visible = this.hp < MAX_HP;
      if (this.hpPips[i].visible) {
        this.hpPips[i].material.color.setHex(i < this.hp ? 0x44ff44 : 0x333333);
      }
    }
  }

  _respawn(playerPos) {
    const pos = randomEdgeSpawn(this.arenaHalf, this.arenaHalf, playerPos);
    this.group.position.set(pos.x, 0, pos.z);
    this.hp = MAX_HP;
    this.alive = true;
    this.group.visible = true;
    this.state = STATE.PATROL;
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.dirTimer = randomRange(1.5, 3);
    this.deathTimer = 0;
    this.hitFlash = 0;
    for (const entry of this._origMaterials) {
      entry.mesh.material = entry.mat;
      entry.mat.transparent = false;
      entry.mat.opacity = 1;
    }
    for (const pip of this.hpPips) pip.visible = false;
  }

  get position() {
    return this.group.position;
  }
}

export { DAMAGE_PER_SEC };
