import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { replayOracleRun, ORACLE_MODE } from "../tests/helpers/marcus-world-model-oracle.mjs";

const baselineSHA = "838b075081d0b97de468d4e84984ce1e57908e76";
if (!process.argv.includes("--capture-baseline")) throw new Error("Explicit --capture-baseline is required; ordinary tests never generate this fixture.");
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== baselineSHA) throw new Error(`Capture is allowed only on the historical baseline ${baselineSHA}; current HEAD ${head}.`);
const protectedPaths = ["src", "public", "schemas", "package.json", "package-lock.json", "scripts/encounter-server.mjs",
  "docs/marcus-lore-v01/SCENARIO_RESULTS.json", "tests/encounter-history.test.mjs", "tests/encounter-information.test.mjs"];
const dirtyInputs = execFileSync("git", ["diff", "--name-only", "HEAD", "--", ...protectedPaths], { encoding: "utf8" }).trim();
if (dirtyInputs) throw new Error(`Refusing baseline capture with changed tracked production/runtime or historical input files:\n${dirtyInputs}`);
const output = new URL("../tests/fixtures/marcus-world-model-baseline-v01.json", import.meta.url);
if (fs.existsSync(output) && !process.argv.includes("--overwrite-frozen-baseline")) throw new Error("Frozen fixture already exists; overwriting requires --overwrite-frozen-baseline on original baseline HEAD.");
const source = new URL("../docs/marcus-lore-v01/SCENARIO_RESULTS.json", import.meta.url);
const corpus = JSON.parse(fs.readFileSync(source, "utf8"));
const ask = (topic, vibeId = "EA") => ({ intent: { action: "ASK", topic, vibeId, intensity: "BALANCED" } });
const deal = (terms, information = "NONE", vibeId = "EA") => ({ intent: { action: "DEAL", terms, information, vibeId, intensity: "BALANCED" } });
const accept = () => ({ intent: { action: "ACCEPT", vibeId: "EA", intensity: "BALANCED" } });
const prep = () => [ask("VERIFY_SOURCE"), ask("PROBE_USEFULNESS"), ask("QUESTION_RECORD"), ask("DISCLOSE_FULL")];
const recovered = {
  positiveEarlyGiveaway: { evidence: "tests/encounter-information.test.mjs: partial evidence is not full knowledge; early giveaway loses trade value permanently", steps: [ask("DISCLOSE_FULL"), ask("VERIFY_SOURCE"), ask("PROBE_USEFULNESS")] },
  negativeWithoutOpening: { evidence: "SCENARIO_RESULTS.json controlNote + tests/encounter-information.test.mjs: negative disclosure gives one bounded useful opportunity or backlash according to preparation", steps: [...prep(), { ...deal(corpus.scenarios.negativeWithoutOpening.terms), control: "REMOVE_NEGATIVE_WINDOW" }] },
  negativeExpired: { evidence: "tests/encounter-information.test.mjs: negative opportunity expires and repeated disclosure never reopens it (through first expired DEAL)", steps: [...prep(), ...["SMALL_TALK", "ACK_MISSED", "DEBT"].map(topic => ask(topic)), deal({ units: 2, upfront: 40, repayment: 80, extra: 0, days: 7 })] },
  directCredit: { evidence: "tests/encounter-history.test.mjs: limited cash purchase and intended credit outcome stay distinct and transparent", steps: [deal({ units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 }), accept()] },
  limitedCashPurchase: { evidence: "tests/encounter-history.test.mjs: limited cash purchase and intended credit outcome stay distinct and transparent", steps: [deal({ units: 1, upfront: 60, repayment: 0, extra: 0, days: 1 }), accept()] },
};
const fromEvents = events => events.map(event => ({ intent: Object.fromEntries(["action", "topic", "terms", "information", "vibeId", "intensity"].filter(key => event[key] !== undefined).map(key => [key, event[key]])) }));
const routes = Object.entries(corpus.scenarios).map(([id, historical]) => ({ id, historical, seed: historical.seed,
  evidence: historical.events ? "docs/marcus-lore-v01/SCENARIO_RESULTS.json scenarios explicit events" : recovered[id].evidence,
  steps: historical.events ? fromEvents(historical.events) : recovered[id].steps }));
for (const historical of corpus.allCombinationRoutes) routes.push({
  id: `combination-${historical.variant}-${historical.quirk}-${historical.vibeId}`, seed: historical.seed, historical,
  evidence: "SCENARIO_RESULTS.json allCombinationRoutes sequence/vibeId + tests/encounter-information.test.mjs: each variant and quirk supports a seeded useful information route without forced Vibe",
  steps: [ask("VERIFY_SOURCE", historical.vibeId), ask("PROBE_USEFULNESS", historical.vibeId),
    ...(historical.variant === "NEGATIVE" ? [ask("QUESTION_RECORD", historical.vibeId), ask("DISCLOSE_FULL", historical.vibeId)] : []),
    deal({ units: 2, upfront: 50, repayment: 70, extra: 4, days: 7 }, historical.variant === "POSITIVE" ? "OFFER_INFORMATION" : "NONE", historical.vibeId), accept()],
});
const runs = routes.map(({ historical, ...run }) => {
  const captured = replayOracleRun(run);
  const final = captured.snapshots.at(-1);
  for (const key of ["status", "metrics", "obligations"]) assert.deepEqual(final.outcome[key], historical[key], `${run.id} historical ${key}`);
  for (const key of ["beliefs", "disclosure", "negativeWindow"]) assert.deepEqual(final.legacy[key], historical[key], `${run.id} historical ${key}`);
  return { ...run, ...captured, historicalFinalMatched: true };
});
const fixture = {
  schemaVersion: "marcus-world-model-baseline@0.1", baselineSHA, languageMode: ORACLE_MODE,
  historicalSourceBaseline: corpus.sourceBaseline,
  historicalCorpusSHA256: createHash("sha256").update(fs.readFileSync(source)).digest("hex"),
  normalizations: ["Fixed runId frozen-marcus-oracle, fixed requestId frozen_oracle_<zero-based-step>, fixed csrf frozen-oracle-csrf at input construction.", "JSON serialization removes undefined properties; array order, all text, numeric values, offer IDs, face operations, replies and semantic input remain exact.", "Snapshot omits debug.state/internal representation and selects legacy compatibility fields plus complete Play/options and the existing latest-turn fields; no world ledger fields existed at baseline."],
  corpusNote: "Plan's 17 was an estimate: actual source contains 11 named scenarios plus 12 combination routes (six variant/quirk pairs at EA and SE), captured as 23 runs.",
  missingReviewPlaythroughs: "Two prior 8–9-turn patience-ending review sequences unavailable in authoritative supplied logs; not invented.",
  runs,
};
fs.mkdirSync(new URL("../tests/fixtures/", import.meta.url), { recursive: true });
const bytes = JSON.stringify(fixture, null, 2) + "\n";
fs.writeFileSync(output, bytes);
console.log(JSON.stringify({ path: output.pathname, runs: runs.length, snapshots: runs.reduce((n, run) => n + run.snapshots.length, 0), transitions: runs.reduce((n, run) => n + run.steps.length, 0), sha256: createHash("sha256").update(bytes).digest("hex") }, null, 2));
