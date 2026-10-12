import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function cameraRig(host: HTMLElement, canvas: HTMLCanvasElement, resize: (width: number, height: number) => void) {
  const camera = new THREE.PerspectiveCamera(44, 1, 5, 30000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.minDistance = 900; controls.maxDistance = 7000;
  controls.minPolarAngle = .18; controls.maxPolarAngle = Math.PI * .46; controls.maxTargetRadius = 3500;
  controls.rotateSpeed = .5; controls.panSpeed = .65; controls.zoomSpeed = .6; controls.screenSpacePanning = false;
  const position = new THREE.Vector3(1000, 1500, 2500), target = new THREE.Vector3(-200, 0, 650);
  function reset() { camera.position.copy(position); controls.target.copy(target); controls.update(); }
  reset(); controls.saveState();
  let width = 1, height = 1;
  function measure() {
    width = host.clientWidth; height = host.clientHeight; if (!width || !height) return;
    camera.fov = width < 760 ? 82 : 44; camera.aspect = width / height; camera.setViewOffset(width, height, -width * .1, height * .08, width, height); camera.updateProjectionMatrix(); resize(width, height);
  }
  const observer = new ResizeObserver(measure); observer.observe(host); measure();
  return { camera, controls, reset, get width() { return width; }, get height() { return height; },
    zoom: (factor: number) => { const offset = camera.position.clone().sub(controls.target); camera.position.copy(controls.target).add(offset.setLength(position.distanceTo(target) / factor)); controls.update(); },
    dispose: () => { observer.disconnect(); controls.dispose(); },
  };
}
