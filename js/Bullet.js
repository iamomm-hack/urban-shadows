import * as THREE from "three";

const BULLET_SPEED = 45;
const BULLET_RADIUS = 0.12;
const HIT_RADIUS = 0.3;
const MAX_BULLETS = 100;
const MAX_RANGE = 120;

const bulletGeo = new THREE.SphereGeometry(BULLET_RADIUS, 6, 6);
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

export class Bullet {

  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Mesh(bulletGeo, bulletMat.clone());
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    this.light = new THREE.PointLight(0xffe066, 1, 3);
    this.light.visible = false;
    this.scene.add(this.light);

    this.velocity = new THREE.Vector3();
    this.active = false;
    this.travelled = 0;
    this.radius = HIT_RADIUS;
    this.prevPos = new THREE.Vector3();
  }

  init(position, direction) {
    this.mesh.position.copy(position);
    this.prevPos.copy(position);
    this.velocity.copy(direction).normalize().multiplyScalar(BULLET_SPEED);
    this.mesh.visible = true;
    this.light.visible = true;
    this.light.position.copy(position);
    this.active = true;
    this.travelled = 0;
  }

  update(dt) {
    if (!this.active) return;

    this.prevPos.copy(this.mesh.position);
    const move = this.velocity.clone().multiplyScalar(dt);
    this.mesh.position.add(move);
    this.light.position.copy(this.mesh.position);
    this.travelled += move.length();

    if (this.travelled > MAX_RANGE) this.deactivate();
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
    this.light.visible = false;
  }

  hits(targetPos, targetRadius) {
    if (!this.active) return false;
    const rSum = this.radius + targetRadius;
    const rSumSq = rSum * rSum;

    const dx = targetPos.x - this.mesh.position.x;
    const dz = targetPos.z - this.mesh.position.z;
    if (dx * dx + dz * dz <= rSumSq) return true;

    const pdx = targetPos.x - this.prevPos.x;
    const pdz = targetPos.z - this.prevPos.z;
    if (pdx * pdx + pdz * pdz <= rSumSq) return true;

    const mx = (this.mesh.position.x + this.prevPos.x) * 0.5;
    const mz = (this.mesh.position.z + this.prevPos.z) * 0.5;
    const mdx = targetPos.x - mx;
    const mdz = targetPos.z - mz;
    if (mdx * mdx + mdz * mdz <= rSumSq) return true;

    return false;
  }
}

export class BulletPool {

  constructor(scene) {
    this.pool = Array.from({ length: MAX_BULLETS }, () => new Bullet(scene));
  }

  fire(position, direction) {
    for (const b of this.pool) {
      if (!b.active) {
        b.init(position, direction);
        return b;
      }
    }
    return null;
  }

  update(dt) {
    for (const b of this.pool) b.update(dt);
  }

  getActive() {
    return this.pool.filter((b) => b.active);
  }
}
