import * as THREE from "three";
import { beadTexture } from "./geography";

const white = new THREE.MeshStandardMaterial({ color: 0xf4f5f2, roughness: .6 });
const gray = new THREE.MeshStandardMaterial({ color: 0xb9c1c2, roughness: .85 });
export const vesselDefinitions = [
  { id: "2604.01658", code: "CR", center: [-900, 700], radius: [800, 750], phase: 1.25, speed: .004, length: 230 },
  { id: "2609.35738", code: "HL", center: [-920, -50], radius: [170, 250], phase: 2.6, speed: .014, length: 170 },
  { id: "2609.14858", code: "DR", center: [-1350, 1300], radius: [230, 140], phase: 4, speed: .016, length: 140 },
] as const;

function cargoShip(length: number) {
  const group = new THREE.Group(), scale = length / 155;
  const outline = new THREE.Shape(); outline.moveTo(-13, 60); outline.lineTo(13, 60); outline.lineTo(14, -43); outline.quadraticCurveTo(9, -68, 0, -78); outline.quadraticCurveTo(-9, -68, -14, -43); outline.closePath();
  const hull = new THREE.ExtrudeGeometry(outline, { depth: 10, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 1.5, bevelSegments: 1 });
  hull.rotateX(-Math.PI / 2); hull.rotateY(Math.PI);
  const hullMesh = new THREE.Mesh(hull, white); hullMesh.position.y = 1.5; group.add(hullMesh);
  const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, material = white) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh);
  };
  addBox(0, 15, 46, 23, 12, 19); addBox(0, 23, 49, 19, 5, 15); addBox(0, 28, 50, 17, 4, 10);
  for (let row = 0; row < 6; row++) for (const x of [-6, 6]) { addBox(x, 13, -43 + row * 13, 10, 6, 11, row % 3 ? white : gray); addBox(x, 16.5, -43 + row * 13, 8, 1, 9, gray); }
  addBox(0, 36, 46, 1, 16, 1); addBox(0, 41, 46, 12, 1, 1);
  addBox(0, 13, -63, 6, 2, 8); group.scale.setScalar(scale);
  return group;
}
export function vesselPoint(index: number, seconds: number) {
  const definition = vesselDefinitions[index], a = definition.phase + seconds * definition.speed;
  return new THREE.Vector3(definition.center[0] + Math.sin(a) * definition.radius[0], 0, definition.center[1] + Math.cos(a) * definition.radius[1]);
}
export function createVessels() {
  const ships = vesselDefinitions.map((definition) => {
    const group = cargoShip(definition.length); group.userData.paperId = definition.id;
    const wakeGeometry = new THREE.BufferGeometry(); wakeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(120 * 3), 3));
    const wake = new THREE.Points(wakeGeometry, new THREE.PointsMaterial({ color: 0xf7f8f7, size: 4.5, map: beadTexture(), alphaTest: .15, opacity: .75, transparent: true }));
    return { id: definition.id, group, wake, heading: 0 };
  });
  function update(seconds: number, tracks: boolean) {
    ships.forEach((ship, i) => {
      const p = vesselPoint(i, seconds), direction = vesselPoint(i, seconds + 1).sub(p);
      ship.group.position.copy(p); ship.group.rotation.y = Math.atan2(-direction.x, -direction.z);
      ship.group.rotation.z = Math.sin(seconds * .4 + i) * .004;
      ship.heading = (Math.atan2(direction.x, -direction.z) * 180 / Math.PI + 360) % 360;
      ship.wake.visible = tracks;
      const attribute = ship.wake.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let j = 0; j < 120; j++) {
        const point = vesselPoint(i, seconds - j * 1.6 - 35); const spread = (j % 2 ? 1 : -1) * (2 + j * .08);
        attribute.setXYZ(j, point.x + spread, .9, point.z + spread);
      }
      attribute.needsUpdate = true;
    });
  }
  return { ships, update };
}
