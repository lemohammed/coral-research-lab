"use client";
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowUpRight, Plus } from "lucide-react";
import { alerts, chartData, type Finding } from "./console-data";
import { catalogue } from "@/lib/lab";

export function Signal({ accent = false, large = false }: { accent?: boolean; large?: boolean }) {
  return <div className={`instrument-chart ${large ? "large" : ""}`} aria-label="Illustrative research activity waveform, not live telemetry"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 260, height: 60 }} minWidth={0}><AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}><Area dataKey="value" stroke={accent ? "#e9784c" : "#565959"} strokeWidth={.8} fill={accent ? "#f7cbb8" : "#dcdddd"} isAnimationActive={false}/><ReferenceLine y={45} stroke="#a8abab" strokeDasharray="2 3"/></AreaChart></ResponsiveContainer></div>;
}
export function InstrumentTitle({ children, suffix }: { children: React.ReactNode; suffix?: React.ReactNode }) {
  return <div className="instrument-title"><span>{children}</span>{suffix}</div>;
}
export function Inspector({ unit, onSource }: { unit: { id: string; code: string; heading: string }; onSource: () => void }) {
  const paper = catalogue.find((item) => item.id === unit.id)!;
  return <section className="instrument inspector"><InstrumentTitle suffix={<button aria-label="Read selected paper" onClick={onSource}><ArrowUpRight size={12}/></button>}>TARGET INSPECTOR</InstrumentTitle>
    <div className="method-diagram" aria-label="Source to harness to evaluation artifact flow"><span>SOURCE</span><i/><span className="highlight">{unit.code}</span><i/><span>EXECUTION</span><i/><span>EVIDENCE</span></div>
    <dl className="instrument-fields"><dt>METHOD</dt><dd>{paper.name.toUpperCase()}</dd><dt>MODE</dt><dd>BLUEPRINT</dd><dt>ARXIV</dt><dd>{paper.id}</dd><dt>CONFIDENCE</dt><dd>QUALITATIVE</dd><dt>LAYER</dt><dd>{paper.layer.toUpperCase()}</dd><dt>LOCAL PROOF</dt><dd className="orange">NOT RUN</dd><dt>INPUTS</dt><dd>{paper.inputs.length} CONTRACTS</dd><dt>RUNTIME</dt><dd>DISCONNECTED</dd><dt>OUTPUTS</dt><dd>{paper.outputs.length} ARTIFACTS</dd><dt>REPRODUCED</dt><dd className="orange">NO</dd><dt>HEADING</dt><dd>{unit.heading}</dd><dt>STATUS</dt><dd>SOURCE REVIEWED</dd></dl>
  </section>;
}
export function ResearchQueue({ findings, onQueue }: { findings: Finding[]; onQueue: () => void }) {
  return <section className="instrument queue-instrument"><InstrumentTitle suffix={<button aria-label="Inspect research queue" onClick={onQueue}><Plus size={12}/></button>}>RESEARCH QUEUE</InstrumentTitle>
    <div className="queue-metrics"><div><strong>{catalogue.length}<sup>SRC</sup></strong><small>PAPERS</small></div><div><strong>{findings.length}<sup>CLM</sup></strong><small>FINDINGS</small></div><div><strong>0<sup>RUN</sup></strong><small>LIVE</small></div><div><strong>+1<sup>NEW</sup></strong><small>PRIORITY</small></div></div>
    <div className="queue-track">{catalogue.map((paper, i) => <button key={paper.id} aria-label={`Inspect ${paper.name}`} onClick={onQueue} className={i === 0 ? "priority" : ""}><span/></button>)}</div>
    <div className="queue-key"><span>10 METHODS / SOURCE REVIEW</span><span className="orange">NO RUNNER</span></div><Signal accent/><div className="chart-caption"><span>DISCOVER</span><span>COMPOSE</span><span>VALIDATE</span></div>
  </section>;
}
export function AlertFeed({ onAlerts, active }: { onAlerts: () => void; active: number }) {
  return <section className="instrument alert-instrument"><InstrumentTitle suffix={<small>{active} OPEN / 0 CRIT</small>}>REVIEW FEED</InstrumentTitle><div className="feed-channel"><span>[ LAB STATE · EVIDENCE ]</span><span>SNAPSHOT</span></div>
    <div className="signal-line" aria-label="Illustrative review signal"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 260, height: 60 }} minWidth={0}><LineChart data={chartData}><Line dataKey="value" stroke="#5e6060" strokeWidth={.8} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer><span>PROOF NOT RUN</span></div>
    <div className="feed-rows">{alerts.map((alert, i) => <button onClick={onAlerts} className={i === 0 ? "attention" : ""} key={alert.time}><time>{alert.time}</time><span>{alert.title}<small>{alert.detail}</small></span><b>{alert.level}</b></button>)}</div>
  </section>;
}
