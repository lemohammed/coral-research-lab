export type Layer = "peers" | "exploration" | "mutation" | "context" | "memory" | "tools" | "evaluation" | "research";
export type Paper = {
  id: string; title: string; name: string; summary: string; authors: string[];
  year: number; publishedAt: string; url: string; source: "arxiv" | "crossref" | "reference";
  arxivId?: string; doi?: string; codeUrl?: string; layer: Layer;
  mechanisms: string[]; inputs: string[]; outputs: string[];
  evidence: "Source reviewed" | "Abstract indexed" | "Metadata only";
  retrievedAt: string; savedAt?: string; mappingSource?: "user";
};
export type Source = { id: string; name: string; kind: string; url: string; status: "planned" };
export type LabConfig = {
  name: string; mission: string; peers: number; experimentWorkers: number;
  dailyBudget: number; sourceTarget: number; priorities: string[];
  modules: string[]; sources: Source[];
};
export type ResearchEvent = { id: string; kind: string; title: string; at: string; refs: string[]; detail: string };
export type Composition = {
  id: string; name: string; createdAt: string; paperIds: string[]; objective: string;
  hypothesis: string; synergies: string[]; conflicts: string[];
  contracts: { from: string; to: string; artifact: string; status: "specified" | "adapter_needed" }[];
  gaps: string[]; experiments: string[]; confidence: "medium" | "low";
  proof: "not_run";
};
export type Workspace = { papers: Paper[]; compositions: Composition[]; config: LabConfig; events: ResearchEvent[] };

const reviewed = "2026-10-03T00:00:00.000Z";
function paper(id: string, name: string, title: string, year: number, summary: string,
  layer: Layer, mechanisms: string[], inputs: string[], outputs: string[], codeUrl?: string): Paper {
  return { id, name, title, year, summary, layer, mechanisms, inputs, outputs, codeUrl,
    publishedAt: `${year}-01-01`, authors: [], url: `https://arxiv.org/abs/${id}`,
    arxivId: id, source: "arxiv", evidence: "Source reviewed", retrievedAt: reviewed, savedAt: reviewed };
}
export const catalogue: Paper[] = [
  paper("2609.35738", "Harness Learning", "Harness Learning Enables Generalizable Test-Time Adaptation", 2026,
    "A trained proposer revises executable harnesses from execution feedback. Both models remain frozen during deployment adaptation. Reported transfer to unseen reasoning families and QA benchmarks has not been reproduced in this lab.",
    "mutation", ["Learned harness revision", "Test-time adaptation"], ["parent harness", "failure traces", "evaluation feedback"], ["agent variants", "change manifest"]),
  paper("2604.01658", "CORAL", "CORAL: Towards Autonomous Multi-Agent Evolution for Open-Ended Discovery", 2026,
    "Persistent agents explore independently and share evaluated attempts, notes, and reusable skills. Collaboration develops through shared memory, with independent grading and periodic reflection.",
    "peers", ["Emergent coordination", "Shared memory"], ["research charter", "code workspace", "evaluation feedback"], ["attempt history", "shared lessons", "candidate artifacts"], "https://github.com/Human-Agent-Society/CORAL"),
  paper("2609.14858", "Dream-RSI", "Dream-RSI: Recursive Self-Improvement through Evolving Worlds", 2026,
    "Recorded discovery trees become replay environments for evaluating alternative exploration policies. Selected policies return to online discovery while the underlying agent and evaluator remain fixed.",
    "exploration", ["Historical replay", "Policy evolution"], ["attempt history", "cost records", "fixed discovery interface"], ["exploration policy", "replay results"], "https://github.com/zhengkid/Dream-RSI"),
  paper("2609.19526", "SIFT", "Self Improvement via Fast Tree-search", 2026,
    "Pairwise judgments rank agent-harness revisions during tree search. Promising variants receive downstream evaluation while further expansion proceeds asynchronously.",
    "mutation", ["Candidate ranking", "Asynchronous evaluation"], ["agent variants", "evaluation feedback"], ["variant ranking", "evaluation queue"]),
  paper("2505.22954", "DGM", "Darwin Godel Machine: Open-Ended Evolution of Self-Improving Agents", 2025,
    "Agents modify their own implementation and empirically test child versions. An archive retains diverse variants and stepping stones for later improvements.",
    "mutation", ["Self-mutation", "Diverse archive"], ["agent source", "failure traces", "evaluation feedback"], ["agent variants", "mutation lineage"], "https://sakana.ai/dgm/"),
  paper("2507.19457", "GEPA", "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning", 2025,
    "Execution feedback informs reflective prompt edits. Pareto-aware search preserves candidates with complementary strengths across tasks.",
    "context", ["Reflective optimization", "Pareto selection"], ["failure traces", "instructions", "evaluation feedback"], ["instruction variants", "candidate archive"], "https://github.com/gepa-ai/gepa"),
  paper("2510.04618", "ACE", "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models", 2025,
    "A playbook accumulates and refines useful strategies through generation, reflection, and curation. Incremental updates preserve detailed contextual knowledge.",
    "context", ["Context adaptation", "Playbook curation"], ["shared lessons", "failure traces"], ["context playbook", "curated lessons"]),
  paper("2509.25140", "ReasoningBank", "ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory", 2025,
    "Successful and unsuccessful experiences are distilled into reusable strategies. Retrieved memory guides subsequent investigations without changing model weights.",
    "memory", ["Procedural memory", "Learning from failure"], ["attempt history", "evaluation feedback"], ["shared lessons", "retrieved procedures"], "https://github.com/google-research/reasoning-bank"),
  paper("2511.03690", "OpenHands SDK", "The OpenHands Software Agent SDK: A Composable and Extensible Foundation for Production Agents", 2025,
    "A modular software-agent runtime provides tools, persistent conversations, workspaces, and isolated execution interfaces for coding work.",
    "tools", ["Typed tools", "Isolated execution"], ["tool schemas", "workspace", "agent instructions"], ["candidate artifacts", "execution traces"], "https://github.com/OpenHands/software-agent-sdk"),
  paper("2601.11868", "Terminal-Bench", "Terminal-Bench: Benchmarking Agents on Hard, Realistic Tasks in Command Line Interfaces", 2026,
    "Realistic terminal tasks combine reproducible environments with outcome verification. Harbor packages task instructions, execution environments, and graders.",
    "evaluation", ["Independent verification", "Reproducible tasks"], ["candidate artifacts", "protected tests"], ["evaluation feedback", "reproduction receipts"], "https://www.harborframework.com/"),
];
// Seed dates are year-only bibliography labels, never represented as exact publication dates.
catalogue.forEach((p) => { p.publishedAt = ""; });

export const layerLabels: Record<Layer, string> = {
  peers: "Peer organization", exploration: "Exploration", mutation: "Self-improvement",
  context: "Context", memory: "Memory", tools: "Tool runtime", evaluation: "Evaluation", research: "Research candidate",
};
export const modules = [
  { id: "sources", name: "Source registry", layer: "Evidence", description: "Versioned documents, code, metrics, and papers with source scopes and freshness.", contract: "Source IDs → immutable evidence references", essential: true },
  { id: "peers", name: "Persistent peers", layer: "Organization", description: "Peers choose investigations, collaborators, and methods from a shared charter.", contract: "Charter + evidence → candidate attempts", essential: true },
  { id: "blackboard", name: "Shared blackboard", layer: "Collaboration", description: "Questions, disagreements, peer invitations, discoveries, and cross-agent influences.", contract: "Notes + messages → shared research context", essential: true },
  { id: "tools", name: "Tool composition", layer: "Capabilities", description: "Typed tool APIs, sandboxed compositions, and versioned reusable capabilities.", contract: "Tool contracts → executable compositions", essential: false },
  { id: "memory", name: "Procedural memory", layer: "Learning", description: "Scoped lessons from successful and failed attempts, with counterexamples and expiry.", contract: "Evaluated experience → reusable procedures", essential: false },
  { id: "exploration", name: "Dream-RSI replay", layer: "Exploration", description: "Project-scoped replay of observed discovery histories to compare exploration policies.", contract: "Discovery trees → policy candidates", essential: false },
  { id: "mutation", name: "Mutation archive", layer: "Evolution", description: "Isolated child harnesses, preserved ancestors, and complementary variants.", contract: "Parent harness + traces → versioned children", essential: false },
  { id: "grading", name: "Independent graders", layer: "Verification", description: "Protected acceptance, baseline/candidate comparisons, and reproduction receipts.", contract: "Candidate + fixed workload → measured outcomes", essential: true },
  { id: "resources", name: "Resource broker", layer: "Operations", description: "Capacity, model and compute budgets, health, and concurrency. Research choices remain with peers.", contract: "Budget + capacity → bounded allocations", essential: true },
  { id: "lineage", name: "Finding ledger", layer: "Provenance", description: "Claims, confidence, source links, versions, traces, limitations, and validation state.", contract: "Evidence + receipts → structured findings", essential: true },
  { id: "integration", name: "Integration queue", layer: "Delivery", description: "Verify combined revisions before integrating independently successful changes.", contract: "Accepted candidates → integration revision", essential: true },
];
export const defaultConfig: LabConfig = {
  name: "My emergent research lab",
  mission: "Investigate how our software and operations can become faster, more reliable, less costly, and easier to maintain. Choose worthwhile questions, collaborate freely, share tools and lessons, and support improvement claims with reproducible evidence.",
  peers: 6, experimentWorkers: 2, dailyBudget: 0, sourceTarget: 100,
  priorities: ["Reliability", "Performance", "Operations"], modules: modules.map((m) => m.id), sources: [],
};
export function initialWorkspace(): Workspace {
  return { papers: catalogue, compositions: [], config: structuredClone(defaultConfig), events: [] };
}
export function event(kind: string, title: string, refs: string[], detail: string): ResearchEvent {
  return { id: crypto.randomUUID(), kind, title, refs, detail, at: new Date().toISOString() };
}

export function classify(title: string, summary: string): Pick<Paper, "name" | "layer" | "mechanisms" | "inputs" | "outputs"> {
  const text = `${title} ${summary}`.toLowerCase();
  const signals: [Layer, RegExp, string][] = [
    ["mutation", /self.modif|self.improv|agent.*evol|harness.*optim|recursive/, "Self-improvement"],
    ["memory", /procedural memory|memory framework|long.term memory|memory.bank/, "Procedural memory"],
    ["exploration", /exploration polic|tree.search|replay simul|search strateg/, "Exploration"],
    ["tools", /tool.call|tool compos|code execution|software.agent sdk/, "Tool use"],
    ["evaluation", /benchmark|verification|evaluat.*agent/, "Evaluation"],
    ["context", /context.engineer|prompt.optim|playbook/, "Context adaptation"],
    ["peers", /multi.agent|swarm|collaborat.*agent|agent.*collaborat/, "Multi-agent systems"],
  ];
  const matching = signals.filter(([, re]) => re.test(text));
  return { name: title.split(":")[0].slice(0, 48), layer: matching[0]?.[0] ?? "research", mechanisms: matching.map((x) => x[2]).slice(0, 3), inputs: [], outputs: [] };
}

export function compose(papers: Paper[], objective: string, name?: string): Composition {
  if (papers.length < 2 || papers.length > 8) throw new Error("Choose between 2 and 8 papers.");
  const names = papers.map((p) => p.name);
  const has = (n: string) => names.includes(n);
  const synergies: string[] = [], conflicts: string[] = [], contracts: Composition["contracts"] = [];
  if (has("CORAL") && has("Dream-RSI")) synergies.push("CORAL retains evaluated attempts and shared discoveries; a project can turn eligible discovery histories into Dream-RSI replay worlds.");
  if (has("DGM") && has("SIFT")) synergies.push("DGM proposes child harnesses and preserves their ancestry; SIFT can prioritize which children receive expensive downstream evaluation.");
  if (has("ACE") && has("ReasoningBank")) synergies.push("ReasoningBank distills experience into procedures; ACE can curate those procedures into an evolving context playbook.");
  if (has("OpenHands SDK")) synergies.push("A typed tool and workspace runtime provides an execution boundary for the selected research methods.");
  if (has("Terminal-Bench")) synergies.push("A reproducible task/evaluator layer provides external outcome feedback rather than relying on agent agreement.");
  if (has("Dream-RSI") && papers.some((p) => p.layer === "mutation")) conflicts.push("Freeze the agent harness during policy comparison, and freeze the exploration policy during harness comparison. Historical replay does not validate an unseen harness.");
  if (has("DGM") && has("GEPA")) conflicts.push("Separate broad code mutation from bounded instruction edits so an improvement can be attributed to the change under test.");
  if (has("CORAL") && has("Dream-RSI")) conflicts.push("Keep replay optional within agent-chosen projects. A single mandatory scheduler would constrain peer autonomy.");
  if (papers.some((p) => p.evidence !== "Source reviewed")) conflicts.push("Some method mappings come from indexed abstracts. Review their full methods and define interfaces before treating them as integration contracts.");
  for (const from of papers) for (const to of papers) {
    if (from.id === to.id) continue;
    for (const output of from.outputs) if (to.inputs.includes(output)) contracts.push({ from: from.id, to: to.id, artifact: output, status: "specified" });
  }
  if (has("CORAL") && has("Dream-RSI")) contracts.push({ from: "2604.01658", to: "2609.14858", artifact: "causal discovery tree + observations + costs", status: "adapter_needed" });
  const gaps: string[] = [];
  if (!papers.some((p) => p.layer === "evaluation")) gaps.push("Independent outcome evaluation and protected acceptance are still required.");
  if (!papers.some((p) => p.layer === "tools")) gaps.push("An isolated tool/workspace runtime and concrete integration interfaces remain to be selected.");
  if (!papers.some((p) => p.layer === "peers")) gaps.push("Persistent peers and a shared research environment remain to be specified.");
  gaps.push("Record peer-message influences and source versions; Git ancestry alone is not full research provenance.");
  if (contracts.length === 0) gaps.push("No reviewed artifact contracts match yet. Specify adapters before claiming interoperability.");
  if (!synergies.length) synergies.push("The selected papers address complementary research surfaces. Their combination is a design hypothesis that needs an explicit adapter and comparison.");
  return {
    id: crypto.randomUUID(), name: name?.trim().slice(0, 100) || `${names.slice(0, 3).join(" + ")}${names.length > 3 ? ` + ${names.length - 3}` : ""}`,
    createdAt: new Date().toISOString(), paperIds: papers.map((p) => p.id), objective: objective.trim().slice(0, 1200),
    hypothesis: `Combining ${names.join(", ")} could help achieve “${objective.trim() || "better verified research outcomes"}”. Compare the combination against its strongest individual baseline under an equal total budget.`,
    synergies, conflicts, contracts, gaps, confidence: contracts.length > 0 && papers.every((p) => p.evidence === "Source reviewed" && p.mappingSource !== "user") ? "medium" : "low", proof: "not_run",
    experiments: ["Freeze sources, workload, model, evaluator, and baseline versions.", "Compare the combined design against each relevant single-method baseline at equal total budget.", "Ablate one component at a time and retain failed or inconclusive attempts.", "Validate the selected design on held-out work with independent reproduction."],
  };
}
export function architecture(config: LabConfig, compositions: Composition[], papers: Paper[]) {
  const ids = new Set(compositions.length ? compositions.flatMap((c) => c.paperIds) : catalogue.map((p) => p.id));
  return {
    schema_version: "1.0", kind: "lab_architecture_blueprint", generated_at: new Date().toISOString(),
    name: config.name, mission: config.mission, organization: "emergent peers with optional agent-chosen projects",
    runtime_state: "design_only", source_target: config.sourceTarget, source_registry: config.sources,
    resources: { peers: config.peers, concurrent_experiments: config.experimentWorkers, daily_budget_usd: config.dailyBudget, spending_enabled: false },
    priorities: config.priorities, modules: modules.filter((m) => config.modules.includes(m.id)),
    selected_methods: papers.filter((p) => ids.has(p.id)).map((p) => ({ id: p.id, name: p.name, layer: p.layer, source: p.url, evidence: p.evidence, inputs: p.inputs, outputs: p.outputs })),
    compositions, finding_contract: { fields: ["claim", "scope", "confidence", "evidence", "proof", "reproduction", "trace", "limitations", "next_experiment"], confidence_probability: null, proof_default: "not_run", evidence_graph: true },
    service_architecture: {
      control_plane: { runtime: "CORAL on the evaluation host", organization: "Persistent peers; agent-chosen projects and temporary teams", responsibilities: ["Session lifecycle", "Workspace isolation", "Shared attempts and notes", "Reflection and recovery"] },
      knowledge: { retrieval: "Shared retrieval API such as Airweave", structured_queries: "Scoped SQL and native metrics APIs", code: "Pinned repository checkouts and symbol/text search", ingestion: "Incremental sync with permission and deletion propagation" },
      tool_runtime: { interfaces: "Versioned JSON schemas and typed code APIs", execution: "Isolated sandbox with bounded resources", registry: "Tested capability versions with input/output contracts and evidence links" },
      experiment_service: { request: ["hypothesis", "baseline_revision", "candidate_revision", "source_snapshot_ids", "model_version", "policy_version", "evaluator_version", "budget"], evaluation: "Protected grader outside candidate workspace; Harbor for applicable sandboxed tasks", outputs: ["raw_measurements", "test_receipt", "environment_manifest", "cost_record", "trace_id"] },
      persistence: { relational: "PostgreSQL or equivalent transactional ledger for projects, leases, versions, findings, and source registry", artifacts: "Content-addressed object storage for snapshots, traces, workspaces, and reproduction receipts", messaging: "Durable peer-message and event stream with causal links", boundaries: "External source facts, agent hypotheses, and measured results remain distinguishable" },
      improvement: { exploration: "Optional project-scoped Dream-RSI replay of observed histories", mutation: "Isolated child harnesses with retained parent and lineage", selection: "Diverse archives; SIFT ranking may prioritize full evaluation", validation: "Freeze one improvement surface during comparisons; fresh held-out evaluation before promotion" },
      integration: { queue: "Serialize accepted changes against the target branch", acceptance: "Verify combined revision, preserve unchanged passing receipts, and retain rollback", apple_acceptance: "Native Apple build and acceptance on the Mac before Android work" },
      observability: { operations: "OpenTelemetry trace/span IDs and cross-agent links", provenance: "Source hashes, version IDs, supports/contradicts/derived-from/supersedes edges", finding_confidence: "Qualitative rationale; numeric probabilities require calibration" },
    },
    implementation_sequence: ["Source registry, evidence ledger, and independent reproduction", "Persistent peers and shared blackboard", "Typed tool composition and procedural memory", "Project-scoped replay and isolated child-harness mutation", "Held-out evaluation and controlled integration"],
  };
}
