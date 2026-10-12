import { catalogue } from "@/lib/lab";

export const researchUnits = [
  { id: "2604.01658", code: "CR", x: 57.2, y: 45.7, heading: "011°T", role: "PEER ORGANIZATION" },
  { id: "2609.35738", code: "HL", x: 79.2, y: 19.6, heading: "026°T", role: "HARNESS REVISION" },
  { id: "2609.14858", code: "DR", x: 43.0, y: 61.0, heading: "342°T", role: "EXPLORATION POLICY" },
] as const;
export type ResearchUnit = typeof researchUnits[number];
export type ConsolePanel = "queue" | "findings" | "replay" | "sources" | null;
export type Finding = { id: string; title: string; claim: { statement: string }; confidence: { mechanism: { level: string; basis: string }; local_benefit: { level: string; basis: string } }; proof: { status: string; note: string }; evidence: { source_id: string; locator?: string; url?: string }[]; limitations: string[] };
export type TraceEvent = { event_id?: string; event_type?: string; timestamp?: string; at?: string; description?: string; decision?: string; artifact_paths?: string[] };
export const units = researchUnits.map((unit) => ({ ...unit, paper: catalogue.find((paper) => paper.id === unit.id)! }));
export const alerts = [
  { time: "01", title: "LOCAL PROOF · NOT RUN", detail: "ALL RESEARCH METHODS", level: "CHECK", description: "Published evidence supports components. No experiment has established improvement in this lab." },
  { time: "02", title: "REVISION POLICY · UNVERIFIED", detail: "HARNESS LEARNING", level: "REVIEW", description: "Official proposer checkpoints and implementation availability need verification." },
  { time: "03", title: "SWARM · NOT CONNECTED", detail: "RUNTIME ADAPTER", level: "INFO", description: "This console contains research and architecture data. No live research swarm is connected." },
  { time: "04", title: "DAILY RESEARCH · CONFIGURED", detail: "09:00 AMERICA/VANCOUVER", level: "INFO", description: "Daily research was configured in the local desktop scheduler. The dashboard does not control that scheduler or prove a run completed." },
];
export const chartData = Array.from({ length: 60 }, (_, i) => ({ x: i, value: 38 + Math.sin(i * .71) * 8 + Math.cos(i * 1.7) * 7 + (i > 42 ? (i - 42) * 1.8 : 0) }));
export const traceLabel = (event: TraceEvent) => event.description ?? event.decision ?? event.event_type ?? "Research event";
