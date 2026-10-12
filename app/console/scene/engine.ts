import * as THREE from "three";
import { createSoftwareScene } from "./software";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createGeography } from "./geography";
import { createWater } from "./water";
import { createVessels } from "./vessels";
import { geographicLabels, type SceneCallbacks, type SceneHandle, type SceneState, type VancouverGeometry } from "./types";

export function createVancouverScene(host: HTMLDivElement, data: VancouverGeometry, callbacks: SceneCallbacks): SceneHandle {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { antialias: true, alpha: false });
  if (!context) return createSoftwareScene(host, data, callbacks);
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0xcdd2d4); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.domElement.setAttribute("aria-label", "Interactive 3D Vancouver: English Bay, Beach Avenue and Stanley Park. Drag to orbit; scroll to zoom.");
  renderer.domElement.setAttribute("role", "img"); renderer.domElement.dataset.renderMode = "webgl-geographic-scene";
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcdd2d4); scene.fog = new THREE.Fog(0xd5d9da, 4200, 12000);
  const camera = new THREE.PerspectiveCamera(44, 1, 5, 30000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.minDistance = 900; controls.maxDistance = 7000;
  controls.minPolarAngle = .18; controls.maxPolarAngle = Math.PI * .46; controls.maxTargetRadius = 3500;
  controls.rotateSpeed = .5; controls.panSpeed = .65; controls.zoomSpeed = .6; controls.screenSpacePanning = false;
  const defaultPosition = new THREE.Vector3(1000, 1500, 2500), defaultTarget = new THREE.Vector3(-200, 0, 650);
  function reset() { camera.position.copy(defaultPosition); controls.target.copy(defaultTarget); controls.update(); }
  reset(); controls.saveState();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x859397, 2.7));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(-1800, 3500, 900); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -3300; sun.shadow.camera.right = 3300; sun.shadow.camera.top = 3300; sun.shadow.camera.bottom = -3300;
  sun.shadow.camera.far = 9000; sun.shadow.normalBias = 2; sun.shadow.bias = -.0002; scene.add(sun);
  const geography = createGeography(data); scene.add(geography);
  const water = createWater(); scene.add(water.mesh);
  const vessels = createVessels(); vessels.ships.forEach((ship) => scene.add(ship.group, ship.wake));
  const connectionGeometry = new THREE.BufferGeometry(); connectionGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(18), 3));
  const connections = new THREE.LineSegments(connectionGeometry, new THREE.LineDashedMaterial({ color: 0xcf8e63, dashSize: 12, gapSize: 14, transparent: true, opacity: .55 })); scene.add(connections);
  let state: SceneState = { selected: "2604.01658", terrain: true, tracks: true, connections: false, paused: false };
  let seconds = 0, previous = performance.now(), lastStatus = previous, frames = 0, totalFrames = 0, disposed = false, dirty = true;
  controls.addEventListener("change", () => { dirty = true; });
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), screen = new THREE.Vector3();
  let down = { x: 0, y: 0 };
  const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
  const onUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(vessels.ships.map((ship) => ship.group), true)[0];
    let object: THREE.Object3D | null = hit?.object ?? null;
    while (object && !object.userData.paperId) object = object.parent;
    if (typeof object?.userData.paperId === "string") callbacks.select(object.userData.paperId);
  };
  renderer.domElement.addEventListener("pointerdown", onDown); renderer.domElement.addEventListener("pointerup", onUp);
  let width = 1, height = 1;
  const resize = new ResizeObserver(() => {
    width = host.clientWidth; height = host.clientHeight; if (!width || !height) return;
    renderer.setSize(width, height); camera.fov = width < 760 ? 82 : 44; camera.aspect = width / height;
    camera.setViewOffset(width, height, -width * .1, height * .08, width, height); camera.updateProjectionMatrix();
  }); resize.observe(host);
  function project(id: string, point: THREE.Vector3) {
    screen.copy(point).project(camera); callbacks.project(id, (screen.x + 1) * width / 2, (1 - screen.y) * height / 2, screen.z > -1 && screen.z < 1 && Math.abs(screen.x) < 1.2 && Math.abs(screen.y) < 1.2);
  }
  renderer.setAnimationLoop((now) => {
    if (disposed) return;
    const delta = Math.min(.1, (now - previous) / 1000); previous = now;
    if (!document.hidden && !state.paused) seconds += delta;
    controls.update(delta);
    if (document.hidden || (state.paused && !dirty)) return;
    geography.visible = state.terrain; connections.visible = state.connections;
    water.update(seconds); vessels.update(seconds, state.tracks);
    const attribute = connectionGeometry.getAttribute("position") as THREE.BufferAttribute;
    vessels.ships.forEach((ship, i) => {
      const next = vessels.ships[(i + 1) % vessels.ships.length];
      attribute.setXYZ(i * 2, ship.group.position.x, 18, ship.group.position.z); attribute.setXYZ(i * 2 + 1, next.group.position.x, 18, next.group.position.z);
      project(ship.id, ship.group.position.clone().add(new THREE.Vector3(0, 12, 0)));
    }); attribute.needsUpdate = true; connections.computeLineDistances();
    geographicLabels.forEach((label) => project(label.id, new THREE.Vector3(...label.point)));
    renderer.render(scene, camera); frames++; totalFrames++; dirty = false;
    renderer.domElement.dataset.simulationSeconds = seconds.toFixed(2); renderer.domElement.dataset.sceneFrame = String(totalFrames);
    if (now - lastStatus > 700) {
      const direction = camera.getWorldDirection(new THREE.Vector3()); const heading = (Math.atan2(direction.x, -direction.z) * 180 / Math.PI + 360) % 360;
      callbacks.status(heading, Math.round(frames * 1000 / (now - lastStatus)), seconds, "webgl", (vessels.ships.find((ship) => ship.id === state.selected) ?? vessels.ships[0]).heading); frames = 0; lastStatus = now;
    }
  });
  return {
    setState: (next) => { state = next; dirty = true; }, reset,
    zoom: (factor) => { const offset = camera.position.clone().sub(controls.target); camera.position.copy(controls.target).add(offset.setLength(defaultPosition.distanceTo(defaultTarget) / factor)); controls.update(); },
    dispose: () => {
      disposed = true; renderer.setAnimationLoop(null); resize.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointerup", onUp);
      const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
          resources.add(object.geometry); const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) { resources.add(material); if ("map" in material && material.map instanceof THREE.Texture) resources.add(material.map); }
        }
      }); resources.forEach((resource) => resource.dispose()); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
