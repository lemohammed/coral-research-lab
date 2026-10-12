import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Point, VancouverGeometry } from "./types";

function shape(ring: Point[]) {
  return new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
}
function inside(x: number, z: number, ring: Point[]) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}
export function beadTexture() {
  const size = 32, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x - 15.5) / 15.5, dy = (y - 15.5) / 15.5, radius = Math.hypot(dx, dy);
    const shade = 220 + Math.max(0, -dx - dy) * 18, i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = Math.min(255, shade);
    data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (1 - radius) * 7)));
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}
function pointCloud(points: number[], size: number, texture: THREE.Texture, opacity = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size, map: texture, alphaTest: .15, transparent: opacity < 1, opacity, sizeAttenuation: true }));
}
export function createGeography(data: VancouverGeometry) {
  const group = new THREE.Group(), texture = beadTexture();
  const landShape = shape(data.land);
  for (const lake of data.lakes) landShape.holes.push(new THREE.Path(lake.ring.map(([x, z]) => new THREE.Vector2(x, -z))));
  const landGeometry = new THREE.ShapeGeometry(landShape); landGeometry.rotateX(-Math.PI / 2);
  const land = new THREE.Mesh(landGeometry, new THREE.MeshStandardMaterial({ color: 0xe9eae7, roughness: 1, side: THREE.DoubleSide }));
  land.position.y = 4; land.receiveShadow = true; group.add(land);
  const buildingGeometry: THREE.BufferGeometry[] = [], edges: number[] = [], roofPoints: number[] = [];
  for (const building of data.buildings) {
    const geometry = new THREE.ExtrudeGeometry(shape(building.ring), { depth: building.height, bevelEnabled: false, steps: 1 });
    geometry.rotateX(-Math.PI / 2); geometry.translate(0, 5, 0); buildingGeometry.push(geometry);
    for (let y = 5; y < building.height + 6; y += 6) {
      for (let i = 1; i < building.ring.length; i++) {
        const a = building.ring[i - 1], b = building.ring[i]; edges.push(a[0], y, a[1], b[0], y, b[1]);
      }
    }
    for (const [x, z] of building.ring) roofPoints.push(x, building.height + 5.7, z);
  }
  if (buildingGeometry.length) {
    const merged = mergeGeometries(buildingGeometry);
    if (merged) { const buildings = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color: 0xf3f3ef, roughness: .9 })); buildings.castShadow = true; buildings.receiveShadow = true; group.add(buildings); }
    buildingGeometry.forEach((geometry) => geometry.dispose());
  }
  const edgeGeometry = new THREE.BufferGeometry(); edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  group.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0x919c9d, transparent: true, opacity: .2 })));
  group.add(pointCloud(roofPoints, 2.8, texture));
  const forest: number[] = [];
  for (const [x, z, height] of data.forest) {
    const hill = 39 * Math.exp(-((x + 300) ** 2 / 650 ** 2 + (z + 1400) ** 2 / 1000 ** 2));
    forest.push(x, height + hill + 4, z);
  }
  group.add(pointCloud(forest, 11, texture));
  const terrain: number[] = [];
  const bounds = data.land.reduce((box, [x, z]) => [Math.min(box[0], x), Math.max(box[1], x), Math.min(box[2], z), Math.max(box[3], z)], [Infinity, -Infinity, Infinity, -Infinity]);
  for (let x = bounds[0]; x < bounds[1]; x += 16) for (let z = bounds[2]; z < bounds[3]; z += 16) {
    if (inside(x, z, data.land) && !data.lakes.some((lake) => inside(x, z, lake.ring))) terrain.push(x, 4.6, z);
  }
  group.add(pointCloud(terrain, 2, texture, .8));
  for (const road of data.roads) {
    const geometry = new THREE.BufferGeometry().setFromPoints(road.points.map(([x, z]) => new THREE.Vector3(x, 5.1, z)));
    group.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: road.name === "Beach Avenue" ? 0xb4aaa1 : 0xb4bbbb, transparent: true, opacity: .55 })));
  }
  const shoreline = new THREE.BufferGeometry().setFromPoints(data.coastline.map(([x, z]) => new THREE.Vector3(x, 5.4, z)));
  group.add(new THREE.Line(shoreline, new THREE.LineBasicMaterial({ color: 0xffffff })));
  return group;
}
