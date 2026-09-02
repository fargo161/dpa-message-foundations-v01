import { createHash } from "node:crypto";
import { posix } from "node:path";

export const ACQUISITION_STATES = Object.freeze(["MANIFEST_ONLY", "PAPER_ONLY", "FIXTURE_ONLY", "ACQUIRED", "ACQUIRED_AND_INDEXED", "ACQUIRED_NOT_INDEXED", "BLOCKED", "REJECTED", "APPROVED"]);
export const EXTERNAL_DATA_CACHE_ROOT = ".cache/external-data";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export function canonicalPosixPath(pathValue) {
  return String(pathValue).replaceAll("\\", "/");
}

const source = (spec) => ({
  sourceVersion: "unspecified",
  expectedArtifactName: "operator-supplied-and-validated",
  licenseUrl: null,
  redistributionPolicy: "REFERENCE_ONLY",
  enabledByDefault: false,
  acquisitionStatus: "MANIFEST_ONLY",
  checksum: null,
  byteSize: null,
  retrievedAt: null,
  verification: null,
  notes: [],
  ...spec,
});

export const SOURCE_MANIFESTS = Object.freeze([
  source({
    sourceId: "atomic-2020",
    title: "ATOMIC 2020",
    authors: ["Jena D. Hwang", "Chandra Bhagavatula", "Ronan Le Bras", "Jeff Da", "Keisuke Sakaguchi", "Antoine Bosselut", "Yejin Choi"],
    sourceType: "HUMAN_LOGIC_DATASET",
    canonicalUrl: "https://github.com/allenai/comet-atomic-2020",
    artifactUrl: "https://drive.google.com/uc?export=download&id=1uuY0Y_s8dhxdsoOe8OHRgsqf-9qJIai7",
    expectedArtifactName: "atomic2020_data-feb2021.zip",
    sourceVersion: "atomic2020_data-feb2021",
    licenseId: "CC-BY-UNVERSIONED",
    licenseUrl: "https://github.com/allenai/comet-atomic-2020",
    citation: "Hwang et al. (2021), COMET-ATOMIC 2020, AAAI.",
    authorityScope: "Event intentions, needs, effects, reactions, wants, obstacles, order, and object affordance priors.",
    acquisitionStatus: "ACQUIRED",
    checksum: "47c5f362ab4a3ea58c4962eebfdfd1c5420d3780e74cd3fe09efeef64f941c2b",
    byteSize: 12580048,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://github.com/allenai/comet-atomic-2020",
      artifactEvidenceUrl: "https://github.com/allenai/comet-atomic-2020",
      licenseEvidenceUrl: "https://github.com/allenai/comet-atomic-2020",
      note: "The maintainer README identifies the Google Drive data link and states that the dataset is CC-BY while the codebase is Apache-2.0.",
    },
    notes: ["Official repository distinguishes Apache-2.0 code from CC-BY dataset.", "The downloaded archive is retained in the ignored external-data cache; raw and normalized records remain evidence/prior material."],
  }),
  source({
    sourceId: "social-chemistry-101",
    title: "Social Chemistry 101",
    authors: ["Maxwell Forbes", "Jena D. Hwang", "Vered Shwartz", "Maarten Sap", "Yejin Choi"],
    sourceType: "HUMAN_LOGIC_DATASET",
    canonicalUrl: "https://github.com/mbforbes/social-chemistry-101",
    artifactUrl: "https://storage.googleapis.com/ai2-mosaic-public/projects/social-chemistry/data/social-chem-101.zip",
    expectedArtifactName: "social-chem-101.zip",
    sourceVersion: "v1.0",
    licenseId: "CC-BY-SA-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    citation: "Forbes et al. (2020), Social Chemistry 101, EMNLP.",
    authorityScope: "Contextual rules of thumb, agreement, judgment, legality, and cultural-pressure annotations.",
    acquisitionStatus: "ACQUIRED",
    checksum: "ebaa524280c53aa3dbfb2b73502b120eeb71d03523a557c659275aebb2afd95a",
    byteSize: 27610699,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://github.com/mbforbes/social-chemistry-101",
      artifactEvidenceUrl: "https://storage.googleapis.com/ai2-mosaic-public/projects/social-chemistry/data/social-chem-101.zip",
      licenseEvidenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      note: "The maintainer README publishes the ZIP, the 25-column schema, and the CC BY-SA 4.0 dataset license.",
    },
    notes: ["rot-bad records are excluded from default retrieval but retained in audit state.", "Source repository notes historical training dependencies are outdated; this foundation uses no training stack.", "Upstream user-generated/scraped material requires separate rights review."],
  }),
  source({
    sourceId: "moral-stories",
    title: "Moral Stories",
    authors: ["Denis Emelin", "Ronan Le Bras", "Jena D. Hwang", "Maxwell Forbes", "Yejin Choi"],
    sourceType: "HUMAN_LOGIC_DATASET",
    canonicalUrl: "https://github.com/demelin/moral_stories",
    artifactUrl: "https://huggingface.co/datasets/demelin/moral_stories/resolve/main/data/moral_stories_full.jsonl?download=true",
    currentAcquisitionUrl: "https://tinyurl.com/moral-stories-data",
    expectedArtifactName: "moral_stories_full.jsonl",
    sourceVersion: "main@329b83476b07d389ea035b98dddd876540519207",
    licenseId: "MIT",
    licenseUrl: "https://raw.githubusercontent.com/demelin/moral_stories/master/LICENSE",
    citation: "Emelin et al. (2021), Moral Stories, EMNLP.",
    authorityScope: "Situation, intention, paired action, norm, and consequence priors.",
    acquisitionStatus: "ACQUIRED",
    checksum: "98a62d4a083e02ba234ca3d4f2312df6c337ef10cd3f12dcf917a2957ba59c10",
    byteSize: 8015650,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://github.com/demelin/moral_stories",
      artifactEvidenceUrl: "https://huggingface.co/datasets/demelin/moral_stories/resolve/main/data/moral_stories_full.jsonl?download=true",
      licenseEvidenceUrl: "https://raw.githubusercontent.com/demelin/moral_stories/master/LICENSE",
      note: "The maintainer repository links the current Hugging Face dataset and reports 12k structured narratives; the repository license is MIT.",
    },
    notes: ["The maintainer now points to the Hugging Face file; its dataset listing identifies the downloaded file by the pinned file OID in sourceVersion.", "Both branches remain priors; moral labels do not define mechanical outcomes."],
  }),
  source({
    sourceId: "tpl-ontology-luangrath-peck-barger",
    title: "Textual Paralanguage and its Implications for Marketing Communications",
    authors: ["Andrea Webb Luangrath", "Joann Peck", "Victor A. Barger"],
    sourceType: "PAPER",
    canonicalUrl: "https://doi.org/10.1016/j.jcps.2016.05.002",
    artifactUrl: "https://arxiv.org/pdf/1605.06799",
    expectedArtifactName: "1605.06799.pdf",
    sourceVersion: "arXiv:1605.06799",
    licenseId: "PAPER_CONCEPTUAL_REFERENCE",
    licenseUrl: "https://arxiv.org/abs/1605.06799",
    citation: "Luangrath, Peck, and Barger (2017), Journal of Consumer Psychology.",
    authorityScope: "Conceptual definition and five-family TPL boundary only.",
    acquisitionStatus: "ACQUIRED",
    checksum: "4174eb89805e2e4a4fa3409f2cdc45f5313bc538f1e561f8d21a103ef3904104",
    byteSize: 1306437,
    retrievedAt: "2026-09-02T14:28:33.491Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://arxiv.org/abs/1605.06799",
      artifactEvidenceUrl: "https://arxiv.org/pdf/1605.06799",
      licenseEvidenceUrl: "https://arxiv.org/abs/1605.06799",
      note: "The arXiv record verifies title, authors, version, journal reference, and TPL definition. Only the manuscript is registered; no underlying social-media corpus is claimed available or reusable.",
    },
    notes: ["The manuscript PDF and metadata are acquired as research authority only. No underlying social-platform posts are copied or redistributed, and the underlying corpus is not claimed available or reusable."],
  }),
  source({
    sourceId: "stanford-politeness-wikipedia",
    title: "Stanford Politeness Corpus — Wikipedia",
    authors: ["Danescu-Niculescu-Mizil et al."],
    sourceType: "TPL_PRAGMATIC_DATASET",
    canonicalUrl: "https://convokit.cornell.edu/documentation/wiki_politeness.html",
    artifactUrl: "https://zissou.infosci.cornell.edu/convokit/datasets/wikipedia-politeness-corpus/wikipedia-politeness-corpus.zip",
    expectedArtifactName: "wikipedia-politeness-corpus.zip",
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    citation: "Danescu-Niculescu-Mizil et al. (2013), ACL P13-1025.",
    authorityScope: "ASK/request construction evidence; not truth, morality, or outcome.",
    sourceVersion: "ConvoKit@1",
    acquisitionStatus: "ACQUIRED",
    checksum: "90ec6c2c6e05d064a805d2e4be4a8d442f370b31f0025798e8eaf62d0014ba48",
    byteSize: 1737651,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://convokit.cornell.edu/documentation/wiki_politeness.html",
      artifactEvidenceUrl: "https://zissou.infosci.cornell.edu/convokit/datasets/wikipedia-politeness-corpus/wikipedia-politeness-corpus.zip",
      licenseEvidenceUrl: "https://creativecommons.org/licenses/by/4.0/",
      note: "ConvoKit documents the Wikipedia Talk-page request corpus, its 4,353 utterances, schema, download identifier, and CC BY 4.0 license.",
    },
    notes: ["The documented HTTP endpoint redirects to this verified HTTPS artifact.", "ConvoKit reports 4,353 utterances."],
  }),
  source({
    sourceId: "stanford-politeness-stack-exchange",
    title: "Stanford Politeness Corpus — Stack Exchange",
    authors: ["Danescu-Niculescu-Mizil et al."],
    sourceType: "TPL_PRAGMATIC_DATASET",
    canonicalUrl: "https://convokit.cornell.edu/documentation/stack_politeness.html",
    artifactUrl: "https://zissou.infosci.cornell.edu/convokit/datasets/stack-exchange-politeness-corpus/stack-exchange-politeness-corpus.zip",
    expectedArtifactName: "stack-exchange-politeness-corpus.zip",
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    citation: "Danescu-Niculescu-Mizil et al. (2013), ACL P13-1025.",
    authorityScope: "ASK/request construction evidence; not truth, morality, or outcome.",
    sourceVersion: "ConvoKit@1",
    acquisitionStatus: "ACQUIRED",
    checksum: "d5be7586c3f4224cffdb45cf87af17b5ad17c0ed4d2d5f6560bcb201703681a3",
    byteSize: 2264294,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://convokit.cornell.edu/documentation/stack_politeness.html",
      artifactEvidenceUrl: "https://zissou.infosci.cornell.edu/convokit/datasets/stack-exchange-politeness-corpus/stack-exchange-politeness-corpus.zip",
      licenseEvidenceUrl: "https://creativecommons.org/licenses/by/4.0/",
      note: "ConvoKit documents the Stack Exchange request corpus, its 6,603 utterances, schema, download identifier, and CC BY 4.0 license.",
    },
    notes: ["The documented HTTP endpoint redirects to this verified HTTPS artifact.", "ConvoKit reports 6,603 utterances."],
  }),
  source({
    sourceId: "casino",
    title: "CaSiNo: Campsite Negotiation Dialogues",
    authors: ["Kushal Chawla et al."],
    sourceType: "TPL_PRAGMATIC_DATASET",
    canonicalUrl: "https://github.com/kushalchawla/CaSiNo",
    artifactUrl: "https://zissou.infosci.cornell.edu/convokit/datasets/casino-corpus/casino-corpus.zip",
    expectedArtifactName: "casino-corpus.zip",
    sourceVersion: "ConvoKit@1",
    licenseId: "CC-BY-4.0",
    licenseUrl: "https://github.com/kushalchawla/CaSiNo/blob/main/LICENSE",
    citation: "Chawla et al. (2021), CaSiNo, NAACL.",
    authorityScope: "DEAL/negotiation move and sequencing evidence; not EMP-world facts or BASED meanings.",
    acquisitionStatus: "ACQUIRED",
    checksum: "71448281f192ffcecfa05877e0aecb0b2f7c68db763b8cf8dc5f9d1010ece387",
    byteSize: 875020,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://github.com/kushalchawla/CaSiNo",
      artifactEvidenceUrl: "https://zissou.infosci.cornell.edu/convokit/datasets/casino-corpus/casino-corpus.zip",
      licenseEvidenceUrl: "https://github.com/kushalchawla/CaSiNo/blob/main/LICENSE",
      note: "The maintainer repository describes the 1,030-dialogue campsite negotiation corpus and labels its repository license CC-BY-4.0; the ConvoKit artifact is retained as reference-only evidence.",
    },
    notes: ["The documented ConvoKit HTTP artifact route was verified through the HTTPS endpoint and acquired into the ignored cache.", "Demographics, personality, preferences, and outcomes are excluded from runtime semantics."],
  }),
  source({
    sourceId: "persuasion-for-good",
    title: "PersuasionForGood",
    authors: ["Wang et al."],
    sourceType: "TPL_PRAGMATIC_DATASET",
    canonicalUrl: "https://convokit.cornell.edu/documentation/persuasionforgood.html",
    artifactUrl: "https://gitlab.com/ucdavisnlp/persuasionforgood/-/archive/master/persuasionforgood-master.zip",
    expectedArtifactName: "persuasionforgood-master.zip",
    sourceVersion: "master@90a3fd7b",
    licenseId: "APACHE-2.0",
    licenseUrl: "https://gitlab.com/ucdavisnlp/persuasionforgood/-/raw/master/LICENSE",
    citation: "Wang et al. (2019), Persuasion for Good, ACL.",
    authorityScope: "PRESSURE/persuasion strategy evidence; not player profiling or BASED meaning.",
    acquisitionStatus: "ACQUIRED",
    checksum: "0d9deadfb126564a8dbbd9b0c33df1c7986cccbf65e03fd60ef2eaec9ec7a41d",
    byteSize: 324414067,
    retrievedAt: "2026-09-02T14:22:09.220Z",
    verification: {
      verifiedAt: "2026-09-02",
      primarySourceUrl: "https://gitlab.com/ucdavisnlp/persuasionforgood",
      artifactEvidenceUrl: "https://gitlab.com/ucdavisnlp/persuasionforgood/-/archive/master/persuasionforgood-master.zip",
      licenseEvidenceUrl: "https://gitlab.com/ucdavisnlp/persuasionforgood/-/raw/master/LICENSE",
      note: "The maintainer API resolves master to commit 90a3fd7b93437cec880e8f8192d26b144ecc493a and its LICENSE is Apache-2.0; the archive is retained as reference-only evidence.",
    },
    notes: ["Acquisition uses the maintainer's HTTPS GitLab repository archive because the current ConvoKit artifact route is HTTP.", "The official documentation reports demographic and psychological survey fields; these are excluded from runtime derivatives."],
  }),
  source({
    sourceId: "project-role-core",
    title: "EMP Relationship Role Core",
    authors: ["DPA project authors"],
    sourceType: "PROJECT_AUTHORED_PACK",
    canonicalUrl: "https://github.com/fargo161/one-room-behavior-lab",
    artifactUrl: null,
    expectedArtifactName: "project-authored-role-pack",
    licenseId: "PROJECT_AUTHORED",
    licenseUrl: null,
    citation: "DPA Message Foundations project-authored starter role pack, v0.1.",
    authorityScope: "Reviewed authoring suggestions for roles, obligations, permissions, leverage, blockers, and action affordances.",
    acquisitionStatus: "FIXTURE_ONLY",
    redistributionPolicy: "ALLOW_WITH_ATTRIBUTION",
    enabledByDefault: true,
    notes: ["Role suggestions are not universal behavior; authors must review concrete facts."],
  }),
]);

export const SOURCE_BY_ID = new Map(SOURCE_MANIFESTS.map((entry) => [entry.sourceId, entry]));

export function validateSourceManifest(entry) {
  const required = ["sourceId", "title", "authors", "sourceType", "canonicalUrl", "licenseId", "citation", "authorityScope", "acquisitionStatus", "redistributionPolicy", "verification", "notes"];
  const errors = required.filter((key) => !(key in entry));
  if (typeof entry.sourceId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.sourceId)) errors.push("invalid_source_id");
  if (!Array.isArray(entry.authors) || entry.authors.length === 0) errors.push("authors_required");
  if (entry.acquisitionStatus === "ACQUIRED" && (!entry.artifactUrl || !entry.checksum || !Number.isInteger(entry.byteSize))) errors.push("acquired_source_requires_receipt");
  if (entry.checksum !== null && (typeof entry.checksum !== "string" || !SHA256_PATTERN.test(entry.checksum))) errors.push("invalid_checksum");
  if (entry.byteSize !== null && (!Number.isSafeInteger(entry.byteSize) || entry.byteSize <= 0)) errors.push("invalid_byte_size");
  if (entry.acquisitionStatus !== "ACQUIRED" && entry.checksum !== null) errors.push("unverified_checksum");
  if (entry.expectedArtifactName && (entry.expectedArtifactName !== posix.basename(entry.expectedArtifactName) || entry.expectedArtifactName.includes("\\"))) errors.push("unsafe_expected_artifact_name");
  if (entry.verification !== null && (typeof entry.verification !== "object" || !entry.verification.verifiedAt || !entry.verification.primarySourceUrl)) errors.push("incomplete_source_verification");
  return errors;
}

export function validateAllSourceManifests(entries = SOURCE_MANIFESTS) {
  const errors = [];
  const ids = entries.map((entry) => entry.sourceId);
  if (new Set(ids).size !== ids.length) errors.push("duplicate_source_id");
  entries.forEach((entry) => validateSourceManifest(entry).forEach((error) => errors.push(`${entry.sourceId}:${error}`)));
  return errors;
}

const ALLOWED_HOSTS = new Set(["github.com", "raw.githubusercontent.com", "storage.googleapis.com", "drive.google.com", "huggingface.co", "arxiv.org", "doi.org", "convokit.cornell.edu", "zissou.infosci.cornell.edu", "gitlab.com", "creativecommons.org"]);

export function assertAllowedSourceUrl(rawUrl, { allowHttp = false } = {}) {
  const url = new URL(rawUrl);
  if (url.username || url.password) throw new Error("SOURCE_URL_CREDENTIALS_BLOCKED");
  if (url.hash) throw new Error("SOURCE_URL_FRAGMENT_NOT_ALLOWED");
  if (!(["https:", "http:"].includes(url.protocol))) throw new Error("SOURCE_URL_PROTOCOL_NOT_ALLOWED");
  if (url.protocol === "http:" && !allowHttp) throw new Error("SOURCE_HTTP_BLOCKED");
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error(`SOURCE_HOST_NOT_ALLOWLISTED:${url.hostname}`);
  return url.toString();
}

export function validateRedirectChain(urls, options = {}) {
  return urls.map((url) => assertAllowedSourceUrl(url, options));
}

export function validateArchiveEntries(entryNames, { maxEntries = 100000, maxPathLength = 240 } = {}) {
  if (entryNames.length > maxEntries) throw new Error("ARCHIVE_ENTRY_COUNT_EXCEEDED");
  for (const name of entryNames) {
    if (!name || name.length > maxPathLength || name.includes("\\") || name.startsWith("/") || /^[A-Za-z]:/.test(name)) throw new Error(`ARCHIVE_PATH_UNSAFE:${name}`);
    const normalized = posix.normalize(name);
    if (normalized === ".." || normalized.startsWith("../")) throw new Error(`ARCHIVE_PATH_TRAVERSAL:${name}`);
  }
  return true;
}

export function safeExtractEntries(entries, destination, { maxEntries = 1000, maxBytes = 20_000_000 } = {}) {
  validateArchiveEntries(entries.map((entry) => entry.name), { maxEntries });
  const totalBytes = entries.reduce((sum, entry) => sum + Buffer.byteLength(entry.bytes ?? ""), 0);
  if (totalBytes > maxBytes) throw new Error("ARCHIVE_EXPANDED_SIZE_EXCEEDED");
  const destinationPath = String(destination).replace(/[\\/]$/, "");
  return entries.map((entry) => {
    const relative = posix.normalize(entry.name).replaceAll("/", "\\");
    const outputPath = `${destinationPath}\\${relative}`;
    if (!outputPath.startsWith(`${destinationPath}\\`)) throw new Error(`ARCHIVE_OUTPUT_ESCAPE:${entry.name}`);
    return { outputPath, bytes: Buffer.from(entry.bytes ?? "") };
  });
}

export function validateArtifactDigest(source, { byteSize, sha256 }) {
  if (!source?.sourceId) throw new Error("SOURCE_MANIFEST_REQUIRED");
  if (!source.checksum || !Number.isSafeInteger(source.byteSize)) throw new Error(`SOURCE_EXPECTED_RECEIPT_MISSING:${source.sourceId}`);
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0) throw new Error(`SOURCE_BYTE_SIZE_INVALID:${source.sourceId}`);
  if (typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256)) throw new Error(`SOURCE_CHECKSUM_INVALID:${source.sourceId}`);
  if (byteSize !== source.byteSize) throw new Error(`SOURCE_BYTE_SIZE_MISMATCH:${source.sourceId}:expected=${source.byteSize}:actual=${byteSize}`);
  if (sha256 !== source.checksum) throw new Error(`SOURCE_CHECKSUM_MISMATCH:${source.sourceId}:expected=${source.checksum}:actual=${sha256}`);
  return true;
}

export function createReceipt({ sourceId, sourceVersion, licenseId, artifactUrl, bytes, retrievedAt }) {
  if (!bytes || retrievedAt == null) throw new Error("RECEIPT_REQUIRES_BYTES_AND_RETRIEVAL_TIME");
  const buffer = Buffer.from(bytes);
  return {
    sourceId,
    sourceVersion,
    licenseId,
    artifactUrl,
    retrievedAt,
    byteSize: buffer.byteLength,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    receiptVersion: "source-receipt@0.1",
  };
}

export function createReceiptFromDigest({ sourceId, sourceVersion, licenseId, artifactUrl, byteSize, sha256, retrievedAt }) {
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256) || retrievedAt == null) throw new Error("RECEIPT_REQUIRES_VALID_DIGEST_AND_RETRIEVAL_TIME");
  return { sourceId, sourceVersion, licenseId, artifactUrl, retrievedAt, byteSize, sha256, receiptVersion: "source-receipt@0.1" };
}

export function normalizeImportIdentity({ sourceId, sourceVersion, licenseId, sha256 }) {
  return [sourceId, sourceVersion, licenseId, sha256 ?? "NO_CHECKSUM"].join("|").toLowerCase();
}
