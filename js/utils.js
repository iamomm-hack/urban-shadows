import * as THREE from "three";

export function sphereCollision(pos1, r1, pos2, r2) {
  const dx = pos2.x - pos1.x;
  const dz = pos2.z - pos1.z;
  const distSq = dx * dx + dz * dz;
  const radiiSum = r1 + r2;
  return distSq <= radiiSum * radiiSum;
}

export function getDistance(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function getAngleXZ(a, b) {
  return Math.atan2(b.z - a.z, b.x - a.x);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomEdgeSpawn(halfW, halfH, playerPos, minDist = 20) {
  const margin = 2;
  let x, z;
  for (let i = 0; i < 50; i++) {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0:
        x = randomRange(-halfW + margin, halfW - margin);
        z = -halfH + margin;
        break;
      case 1:
        x = randomRange(-halfW + margin, halfW - margin);
        z = halfH - margin;
        break;
      case 2:
        x = -halfW + margin;
        z = randomRange(-halfH + margin, halfH - margin);
        break;
      case 3:
        x = halfW - margin;
        z = randomRange(-halfH + margin, halfH - margin);
        break;
    }
    const pos = new THREE.Vector3(x, 0, z);
    if (getDistance(pos, playerPos) >= minDist) return pos;
  }
  return new THREE.Vector3(x, 0, z);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
