import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const toModule = (name, replacements = []) => {
  let source = ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(from, to);
  return "data:text/javascript;base64," + Buffer.from(source).toString("base64");
};
const labUrl = toModule("lab");
const lab = await import(labUrl);
const research = await import(toModule("research", [['"./lab"', JSON.stringify(labUrl)]]));

test("combining exploration and harness mutation retains attribution constraints", () => {
  const composition = lab.compose(lab.catalogue.filter((p) => ["CORAL", "Dream-RSI", "DGM", "SIFT"].includes(p.name)), "reduce verified discovery cost");
  assert.equal(composition.proof, "not_run");
  assert.ok(composition.contracts.some((c) => c.artifact === "agent variants"));
  assert.ok(composition.contracts.some((c) => c.status === "adapter_needed"));
  assert.ok(composition.conflicts.some((c) => c.includes("Freeze the agent harness")));
  assert.ok(composition.gaps.some((c) => c.includes("Independent outcome evaluation")));
});
test("unreviewed and user-mapped interfaces never receive reviewed-method confidence", () => {
  const p = { ...lab.catalogue[0], id: "new-paper", evidence: "Abstract indexed", mappingSource: "user" };
  const c = lab.compose([p, lab.catalogue[1]], "improve reliability");
  assert.equal(c.confidence, "low");
  assert.equal(c.proof, "not_run");
});
test("arXiv parsing preserves source versions and recognizes reviewed methods", () => {
  const xml = '<feed><entry><id>http://arxiv.org/abs/2604.01658v3</id><title>CORAL</title><summary>Agents &amp; shared memory</summary><published>2026-04-02T00:00:00Z</published><author><name>Ao Qu</name></author></entry></feed>';
  const p = research.parseAtom(xml)[0];
  assert.equal(p.id, "2604.01658");
  assert.equal(p.url, "https://arxiv.org/abs/2604.01658v3");
  assert.equal(p.summary, "Agents & shared memory");
  assert.equal(p.layer, "peers");
});
test("architecture export remains a complete blueprint without enabling spending", () => {
  const config = { ...lab.defaultConfig, dailyBudget: 25, peers: 8 };
  const a = lab.architecture(config, [], lab.catalogue);
  assert.equal(a.runtime_state, "design_only");
  assert.equal(a.resources.spending_enabled, false);
  assert.equal(a.resources.peers, 8);
  assert.equal(a.finding_contract.proof_default, "not_run");
  for (const key of ["control_plane", "knowledge", "tool_runtime", "experiment_service", "persistence", "improvement", "integration", "observability"]) assert.ok(a.service_architecture[key]);
});
