import * as THREE from "three";
import { cameraRig } from "./camera";
import { paintGeography, paintShip, type Projector } from "./software-geography";
import { vesselDefinitions, vesselPoint } from "./vessels";
import { geographicLabels, type SceneCallbacks, type SceneHandle, type SceneState, type VancouverGeometry } from "./types";

export function createSoftwareScene(host: HTMLDivElement, data: VancouverGeometry, callbacks: SceneCallbacks): SceneHandle {
  const canvas = document.createElement("canvas"), cache = document.createElement("canvas");
  const context = canvas.getContext("2d"), cached = cache.getContext("2d");
  if (!context || !cached) throw new Error("Canvas rendering is unavailable.");
  canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "Interactive 3D Vancouver, software renderer. Drag to orbit; scroll to zoom.");
  canvas.dataset.renderMode = "canvas-geographic-3d"; host.appendChild(canvas);
  let dirty = true, pixelRatio = Math.min(1.4, window.devicePixelRatio, 1800 / Math.max(host.clientWidth, host.clientHeight)), frame = 0;
  const rig = cameraRig(host, canvas, (w, h) => {
    canvas.width = cache.width = Math.round(w * pixelRatio); canvas.height = cache.height = Math.round(h * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); cached.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); dirty = true;
  });
  rig.controls.addEventListener("change", () => { dirty = true; });
  let state: SceneState = { selected: "2604.01658", terrain: true, tracks: true, connections: false, paused: false };
  let seconds = 0, previous = performance.now(), lastStatus = previous, fpsFrames = 0, disposed = false;
  const matrix = new THREE.Matrix4(), direction = new THREE.Vector3();
  const project: Projector = (x, y, z) => {
    const e = matrix.elements, w = e[3] * x + e[7] * y + e[11] * z + e[15]; if (w < 5) return null;
    return { x: ((e[0]*x+e[4]*y+e[8]*z+e[12])/w+1)*rig.width/2, y: (1-(e[1]*x+e[5]*y+e[9]*z+e[13])/w)*rig.height/2, depth: w, scale: rig.camera.projectionMatrix.elements[5] * rig.height / (2 * w) };
  };
  const publish = (id: string, x: number, y: number, z: number) => { const p = project(x, y, z); callbacks.project(id, p?.x ?? 0, p?.y ?? 0, !!p && p.x > -100 && p.x < rig.width+100 && p.y > -100 && p.y < rig.height+100); };
  let pointerDown = { x: 0, y: 0 };
  function down(event: PointerEvent) { pointerDown = { x: event.clientX, y: event.clientY }; }
  function up(event: PointerEvent) {
    if (Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5) return;
    const rect = canvas.getBoundingClientRect();
    vesselDefinitions.forEach((vessel, i) => { const p = vesselPoint(i, seconds), screen = project(p.x, 12, p.z); if (screen && Math.hypot(screen.x-event.clientX+rect.left,screen.y-event.clientY+rect.top)<45) callbacks.select(vessel.id); });
  }
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointerup", up);
  function animate(now: number) {
    if (disposed || !context || !cached) return;
    const delta = Math.min(.1, (now-previous)/1000); previous = now; rig.controls.update(delta);
    if (!document.hidden && !state.paused) seconds += delta;
    if (!document.hidden && (!state.paused || dirty)) {
      rig.camera.updateMatrixWorld(); matrix.multiplyMatrices(rig.camera.projectionMatrix, rig.camera.matrixWorldInverse);
      if (dirty) { paintGeography(cached, data, project, rig.width, rig.height); dirty = false; }
      const background = context.createLinearGradient(0,0,0,rig.height); background.addColorStop(0,"#d0d7d9"); background.addColorStop(1,"#bac7cc"); context.fillStyle=background;context.fillRect(0,0,rig.width,rig.height);
      context.strokeStyle="#f1f5f31c";context.lineWidth=.5;
      for(let row=0;row<34;row++){context.beginPath();for(let i=0;i<42;i++){const x=-3000+i*150,z=-3000+row*190;const p=project(x,Math.sin(x*.012+z*.02+seconds*.8)*1.1,z);if(p){if(i)context.lineTo(p.x,p.y);else context.moveTo(p.x,p.y);}}context.stroke();}
      if(state.terrain)context.drawImage(cache,0,0,rig.width,rig.height);
      if(state.connections){context.strokeStyle="#cf946c99";context.setLineDash([5,7]);context.beginPath();vesselDefinitions.forEach((_,i)=>{const p=vesselPoint(i,seconds),screen=project(p.x,18,p.z);if(screen){if(i)context.lineTo(screen.x,screen.y);else context.moveTo(screen.x,screen.y);}});context.closePath();context.stroke();context.setLineDash([]);}
      vesselDefinitions.map((v,i)=>({v,i,p:vesselPoint(i,seconds)})).sort((a,b)=>(project(b.p.x,0,b.p.z)?.depth??0)-(project(a.p.x,0,a.p.z)?.depth??0)).forEach(({v,i,p})=>{
        const next=vesselPoint(i,seconds+1).sub(p),angle=Math.atan2(-next.x,-next.z);
        if(state.tracks)for(let j=0;j<90;j++){const w=vesselPoint(i,seconds-j*1.8-35),s=project(w.x,1,w.z);if(s){context.fillStyle=`rgba(248,251,246,${.7-j*.006})`;context.beginPath();context.arc(s.x,s.y,Math.max(.5,s.scale*2.3),0,Math.PI*2);context.fill();}}
        paintShip(context,project,p.x,p.z,angle,v.length);publish(v.id,p.x,12,p.z);
      });
      geographicLabels.forEach((label)=>publish(label.id,label.point[0],label.point[1],label.point[2]));
      canvas.dataset.simulationSeconds=seconds.toFixed(2);canvas.dataset.sceneFrame=String(++frame);fpsFrames++;
      if(now-lastStatus>700){rig.camera.getWorldDirection(direction);const heading=(Math.atan2(direction.x,-direction.z)*180/Math.PI+360)%360;const selectedIndex=Math.max(0,vesselDefinitions.findIndex(v=>v.id===state.selected));const point=vesselPoint(selectedIndex,seconds),velocity=vesselPoint(selectedIndex,seconds+1).sub(point);const vesselHeading=(Math.atan2(velocity.x,-velocity.z)*180/Math.PI+360)%360;callbacks.status(heading,Math.round(fpsFrames*1000/(now-lastStatus)),seconds,"canvas",vesselHeading);fpsFrames=0;lastStatus=now;}
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  return { setState:(next)=>{if(next.terrain!==state.terrain||next.selected!==state.selected||next.connections!==state.connections||next.tracks!==state.tracks)dirty=true;state=next;},reset:()=>{rig.reset();dirty=true;},zoom:(factor)=>{rig.zoom(factor);dirty=true;},dispose:()=>{disposed=true;rig.dispose();canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointerup",up);canvas.remove();} };
}
