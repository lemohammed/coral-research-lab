"use client";
import { useEffect, useState } from "react";
import { Bell, ChevronLeft, Crosshair, Code2, Minus, Plus, Search } from "lucide-react";
import { catalogue } from "@/lib/lab";
import { alerts, units, researchUnits, type Finding, type TraceEvent, type ResearchUnit } from "./console-data";
import { AlertFeed, Inspector, InstrumentTitle, ResearchQueue, Signal } from "./instruments";
import { ConsoleDialogView, type ConsoleDialog } from "./console-dialog";
import "./console.css";

const layerNames = ["TRACKS", "EVIDENCE", "UNVERIFIED", "CONNECTIONS", "TERRAIN"];
export default function LabConsole({ displayName }: { displayName: string }) {
  const [selected, setSelected] = useState<string>("2604.01658"), [panel, setPanel] = useState<ConsoleDialog>(null);
  const [layers, setLayers] = useState([true, true, true, false, true]), [query, setQuery] = useState("");
  const [clock, setClock] = useState("--:--:--"), [latency, setLatency] = useState<string>("—"), [zoom, setZoom] = useState(1);
  const [findings, setFindings] = useState<Finding[]>([]), [trace, setTrace] = useState<TraceEvent[]>([]), [dataError, setDataError] = useState("");
  const selectedUnit: ResearchUnit = researchUnits.find((unit) => unit.id === selected) ?? { ...researchUnits[0], id: "2604.01658" };
  const unit = units.find((item) => item.id === selected) ?? { ...units[0], paper: catalogue.find((paper) => paper.id === selected) ?? units[0].paper };
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19)); tick(); const timer = setInterval(tick, 1000);
    const controller = new AbortController(); const started = performance.now();
    fetch("/api/health", { signal: controller.signal }).then((response) => { if (response.ok) setLatency(`${Math.round(performance.now() - started)}ms`); }).catch(() => setLatency("OFFLINE"));
    Promise.all([fetch("/research/console-findings.json", { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Evidence unavailable"); return response.json() as Promise<{ findings: Finding[] }>; }), fetch("/research/console-trace.jsonl", { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Trace unavailable"); return response.text(); })]).then(([bundle, events]) => { setFindings(bundle.findings); setTrace(events.split("\n").filter(Boolean).map((line) => JSON.parse(line) as TraceEvent)); }).catch((error: unknown) => { if (!controller.signal.aborted) setDataError(error instanceof Error ? error.message : "Evidence unavailable"); });
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  function select(id: string) { setSelected(id); }
  function search(event: React.FormEvent) { event.preventDefault(); setPanel("discover"); }
  return <main className={`lab-console ${!layers[4] ? "terrain-off" : ""}`}>
    <div className="terrain-image" style={{ transform: `scale(${zoom})` }} role="img" aria-label="Monochrome point-cloud strait with research vessels; decorative visualization"/>
    <header className="console-topbar"><div className="window-dots" aria-hidden="true"><i/><i/><i/></div><div className="console-path">CORAL Watch/Research Lab/<strong>{unit.paper.name}</strong></div><div className="console-clock">{clock} UTC <span>Latency: {latency}</span></div><form onSubmit={search} className="console-search"><Search size={13}/><input aria-label="Search research papers" placeholder="SEARCH..." value={query} onChange={(event) => setQuery(event.target.value)}/></form><button className="console-alert-button" onClick={() => setPanel("alerts")}><Bell size={13} fill="currentColor"/> REVIEWS <b>{alerts.length}</b></button></header>
    <aside className="console-rail"><div className="rail-top"><button className="console-wordmark" onClick={() => { setSelected("2604.01658"); setZoom(1); }}>[CORAL]</button><ChevronLeft size={17}/></div>
      <nav className="console-nav"><button onClick={() => setPanel("queue")}>QUEUE</button><button onClick={() => setPanel("findings")}>FINDINGS</button><button onClick={() => setPanel("architect")}>ARCHITECTURE</button><button onClick={() => setPanel("replay")}>REPLAY</button></nav>
      <div className="instrument-rule"/><div className="layer-controls"><h2>LAYERS</h2>{layerNames.map((name, i) => <label key={name}><input type="checkbox" checked={layers[i]} onChange={() => setLayers((prior) => prior.map((value, index) => i === index ? !value : value))}/><span>{name}</span></label>)}</div><div className="instrument-rule"/>
      <div className="rail-workbench"><button onClick={() => setPanel("discover")}>DISCOVER <Search size={12}/></button><button onClick={() => setPanel("compose")}>COMPOSE <Plus size={12}/></button><button onClick={() => setPanel("sources")}>SOURCES <span>{catalogue.length}</span></button></div>
      <section className="rail-transit"><div className="instrument-rule"/><InstrumentTitle suffix={<span>NO LIVE AGENTS</span>}>RESEARCH</InstrumentTitle><div className="rail-target"><strong>{unit.code}</strong><div><b>SOURCE REVIEWED</b><span>{unit.paper.name.toUpperCase()}</span></div><small>PROOF<br/>NOT RUN</small></div><div className="transit-tabs"><span>REVIEW</span><span>ADAPT</span><span>VERIFY</span></div><Signal large/><div className="chart-caption"><span>ILLUSTRATIVE SIGNAL / NO TELEMETRY</span></div></section>
    </aside>
    <div className="terrain-instruments" aria-label="Research method map">
      {layers[3] && <div className="connection-overlay"><span>CORAL → HARNESS LEARNING</span><span>EXECUTION → EVIDENCE → REVISION</span><span>DREAM-RSI → EXPLORATION POLICY</span></div>}
      {layers[0] && units.map((item) => <button key={item.id} className={`map-target ${selected === item.id ? "selected" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onClick={() => select(item.id)} aria-label={`Select ${item.paper.name} research unit`}><span className="target-dot"/><span className="map-target-label">{item.code} <small>{item.paper.name.toUpperCase()}</small></span></button>)}
      <div className="target-reticle" style={{ left: `${selectedUnit.x}%`, top: `${selectedUnit.y}%` }}><div className="reticle-north">N</div><i className="reticle-corner tl"/><i className="reticle-corner tr"/><i className="reticle-corner bl"/><i className="reticle-corner br"/><div className="reticle-cross horizontal"/><div className="reticle-cross vertical"/><div className="reticle-circle"/></div>
      <div className="vertical-ruler"><span>01 —</span><span>00 — 20</span><span>-01 —</span><span>-02 —</span></div><div className="heading-ruler"><div>│ ┆ │ ┆ │ ┆ │ ┆ │</div><span>35&nbsp;&nbsp; 00&nbsp;&nbsp; 01&nbsp;&nbsp; 02&nbsp;&nbsp; 03</span><strong>↑<br/>{unit.heading}</strong></div>
      <div className="map-status">{dataError || (layers[2] ? "RESEARCH SNAPSHOT / LOCAL PROOF NOT RUN" : "RESEARCH SNAPSHOT")}</div>
      {layers[1] && <button className="evidence-tag" onClick={() => setPanel("findings")}>EVIDENCE {findings.length.toString().padStart(2, "0")} <Plus size={10}/></button>}
      <div className="map-zoom"><button onClick={() => setZoom((prior) => Math.min(1.3, prior + .05))} aria-label="Zoom terrain in"><Plus size={14}/></button><button onClick={() => setZoom((prior) => Math.max(1, prior - .05))} aria-label="Zoom terrain out"><Minus size={14}/></button><button onClick={() => { setZoom(1); setSelected("2604.01658"); }} aria-label="Reset map view"><Crosshair size={14}/></button></div>
    </div>
    <section className="console-bottom"><Inspector unit={{ id: selected, code: unit.code, heading: selectedUnit.heading }} onSource={() => window.open(unit.paper.url, "_blank", "noopener,noreferrer")}/><ResearchQueue findings={findings} onQueue={() => setPanel("queue")}/><AlertFeed active={alerts.length} onAlerts={() => setPanel("alerts")}/></section>
    <a className="console-github" href="https://github.com/lemohammed/coral-research-lab" target="_blank" rel="noreferrer"><Code2 size={12}/> OPEN SOURCE</a>
    {panel && <ConsoleDialogView panel={panel} onClose={() => setPanel(null)} displayName={displayName} query={query} findings={findings} trace={trace} onSelect={select} onWorkbench={setPanel}/>}
  </main>;
}
