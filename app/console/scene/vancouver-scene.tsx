"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { units } from "../console-data";
import { geographicLabels, type SceneHandle, type VancouverGeometry } from "./types";
import "./scene.css";

export default function VancouverScene({ selected, terrain, tracks, connections, zoom, resetKey, onSelect, onVesselHeading, active }: { selected: string; terrain: boolean; tracks: boolean; connections: boolean; zoom: number; resetKey: number; onSelect: (id: string) => void; onVesselHeading: (heading: number) => void; active: boolean }) {
  const host = useRef<HTMLDivElement>(null), runtime = useRef<SceneHandle | null>(null);
  const markers = useRef<Record<string, HTMLElement | null>>({}), reticle = useRef<HTMLDivElement>(null);
  const latest = useRef({ selected, terrain, tracks, connections, onSelect, onVesselHeading, paused: false });
  const [paused, setPaused] = useState(false), [error, setError] = useState("");
  const [status, setStatus] = useState({ ready: false, heading: 335, fps: 0, mode: "3D" });
  latest.current = { selected, terrain, tracks, connections, onSelect, onVesselHeading, paused: paused || !active };
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
    const abort = new AbortController(); let disposed = false;
    Promise.all([import("./engine"), fetch("/data/vancouver/scene.json", { signal: abort.signal }).then(async (response) => { if (!response.ok) throw new Error("Vancouver geometry is unavailable."); return response.json() as Promise<VancouverGeometry>; })]).then(([engine, data]) => {
      if (disposed || !host.current) return;
      runtime.current = engine.createVancouverScene(host.current, data, {
        select: (id) => latest.current.onSelect(id),
        project: (id, x, y, visible) => {
          const marker = markers.current[id];
          if (marker) { marker.style.left = `${x}px`; marker.style.top = `${y}px`; marker.style.visibility = visible && (geographicLabels.some((label) => label.id === id) || latest.current.tracks) ? "visible" : "hidden"; }
          if (reticle.current && id === (units.some((unit) => unit.id === latest.current.selected) ? latest.current.selected : units[0].id)) { reticle.current.style.left = `${x}px`; reticle.current.style.top = `${y}px`; reticle.current.style.visibility = visible ? "visible" : "hidden"; }
        },
        status: (heading, fps, _seconds, mode, vesselHeading) => { setStatus({ ready: true, heading: Math.round(heading), fps, mode: mode === "canvas" ? "CPU 3D" : "WEBGL 3D" }); latest.current.onVesselHeading(Math.round(vesselHeading)); },
      });
      runtime.current.setState(latest.current);
    }).catch((cause: unknown) => { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "WebGL could not start."); });
    return () => { disposed = true; abort.abort(); runtime.current?.dispose(); runtime.current = null; };
  }, []);
  useEffect(() => { runtime.current?.setState(latest.current); }, [selected, terrain, tracks, connections, paused, active]);
  useEffect(() => { runtime.current?.zoom(zoom); }, [zoom]);
  useEffect(() => { runtime.current?.reset(); }, [resetKey]);
  return <div className="vancouver-scene" data-scene-status={error ? "error" : status.ready ? "rendering" : "loading"}>
    <div ref={host} className="vancouver-canvas"/>
    {units.map((unit) => <button ref={(element) => { markers.current[unit.id] = element; }} key={unit.id} className={`map-target ${selected === unit.id ? "selected" : ""}`} onClick={() => onSelect(unit.id)} aria-label={`Select ${unit.paper.name} research unit`}><span className="target-dot"/><span className="map-target-label">{unit.code} <small>{unit.paper.name.toUpperCase()}</small></span></button>)}
    {geographicLabels.map((label) => <span ref={(element) => { markers.current[label.id] = element; }} className="geographic-label" key={label.id}>{label.text}</span>)}
    <div ref={reticle} className="target-reticle"><div className="reticle-north">N</div><i className="reticle-corner tl"/><i className="reticle-corner tr"/><i className="reticle-corner bl"/><i className="reticle-corner br"/><div className="reticle-cross horizontal"/><div className="reticle-cross vertical"/><div className="reticle-circle"/></div>
    <div className="scene-caption"><span>VANCOUVER / ENGLISH BAY</span><small>{status.ready ? `${status.mode} · ${status.heading}° · ${status.fps} FPS` : "PREPARING GEOGRAPHY"}</small></div>
    <div className="scene-motion-controls"><button onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play scene animation" : "Pause scene animation"}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button><button onClick={() => runtime.current?.reset()} aria-label="Restore northwest aerial camera"><RotateCcw size={13}/></button><span>SIMULATED VESSELS</span></div>
    <a className="scene-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · City of Vancouver</a>
    {error && <div className="scene-error"><strong>3D renderer unavailable</strong><p>{error}</p><p>Enable WebGL 2 to view the interactive scene.</p></div>}
  </div>;
}
