# Live source, license, and acquisition verification

Verified on 2026-09-02 against primary or project-maintainer sources. The acquisition receipt time below is the first successful local artifact acquisition time, preserved across normalization reruns. This register records research evidence and prior material; it does not approve records for mechanics, BASED mappings, TPL protocols, or runtime dialogue.

## Source-by-source acquisition register

Counts are `raw / accepted / rejected / duplicate / aggregated annotation rows / normalized / indexed`. `Accepted` is the number of importer records that passed field validation; repeated Social Chemistry `rot-id` rows with distinct worker annotations are aggregated evidence rather than discarded duplicates. The local policy for every external source is `REFERENCE_ONLY`, and raw artifacts plus normalized records remain in the Git-ignored `.cache/external-data/` tree.

| Source | Status | Version | Artifact and ignored cache path | Retrieved | Bytes | SHA-256 | Counts |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| ATOMIC 2020 | `ACQUIRED_AND_INDEXED` | `atomic2020_data-feb2021` | `atomic2020_data-feb2021.zip` — `.cache/external-data/atomic-2020/atomic2020_data-feb2021.zip` | 2026-09-02T14:22:09.220Z | 12,580,048 | `47c5f362ab4a3ea58c4962eebfdfd1c5420d3780e74cd3fe09efeef64f941c2b` | 1,331,113 / 1,243,208 / 87,905 / 0 / 1,243,208 / 1,243,208 |
| Social Chemistry 101 | `ACQUIRED_AND_INDEXED` | `v1.0` | `social-chem-101.zip` — `.cache/external-data/social-chemistry-101/social-chem-101.zip` | 2026-09-02T14:22:09.220Z | 27,610,699 | `ebaa524280c53aa3dbfb2b73502b120eeb71d03523a557c659275aebb2afd95a` | 355,922 / 348,769 / 7,153 / 223 / 63,032 / 285,514 / 285,514 |
| Moral Stories | `ACQUIRED_AND_INDEXED` | `main@329b83476b07d389ea035b98dddd876540519207` | `moral_stories_full.jsonl` — `.cache/external-data/moral-stories/moral_stories_full.jsonl` | 2026-09-02T14:22:09.220Z | 8,015,650 | `98a62d4a083e02ba234ca3d4f2312df6c337ef10cd3f12dcf917a2957ba59c10` | 12,000 / 12,000 / 0 / 0 / 12,000 / 12,000 |
| Stanford Politeness — Wikipedia | `ACQUIRED_AND_INDEXED` | `ConvoKit@1` | `wikipedia-politeness-corpus.zip` — `.cache/external-data/stanford-politeness-wikipedia/wikipedia-politeness-corpus.zip` | 2026-09-02T14:22:09.220Z | 1,737,651 | `90ec6c2c6e05d064a805d2e4be4a8d442f370b31f0025798e8eaf62d0014ba48` | 4,353 / 4,353 / 0 / 0 / 4,353 / 4,353 |
| Stanford Politeness — Stack Exchange | `ACQUIRED_AND_INDEXED` | `ConvoKit@1` | `stack-exchange-politeness-corpus.zip` — `.cache/external-data/stanford-politeness-stack-exchange/stack-exchange-politeness-corpus.zip` | 2026-09-02T14:22:09.220Z | 2,264,294 | `d5be7586c3f4224cffdb45cf87af17b5ad17c0ed4d2d5f6560bcb201703681a3` | 6,603 / 6,603 / 0 / 0 / 6,603 / 6,603 |
| CaSiNo | `ACQUIRED_AND_INDEXED` | `ConvoKit@1` | `casino-corpus.zip` — `.cache/external-data/casino/casino-corpus.zip` | 2026-09-02T14:22:09.220Z | 875,020 | `71448281f192ffcecfa05877e0aecb0b2f7c68db763b8cf8dc5f9d1010ece387` | 14,297 / 14,297 / 0 / 0 / 14,297 / 14,297 |
| PersuasionForGood | `ACQUIRED_AND_INDEXED` | `master@90a3fd7b` | `persuasionforgood-master.zip` — `.cache/external-data/persuasion-for-good/persuasionforgood-master.zip` | 2026-09-02T14:22:09.220Z | 324,414,067 | `0d9deadfb126564a8dbbd9b0c33df1c7986cccbf65e03fd60ef2eaec9ec7a41d` | 20,932 / 20,932 / 0 / 0 / 20,932 / 20,932 |
| Luangrath–Peck–Barger manuscript | `ACQUIRED_NOT_INDEXED` | `arXiv:1605.06799` | `1605.06799.pdf` — `.cache/external-data/tpl-ontology-luangrath-peck-barger/1605.06799.pdf` | 2026-09-02T14:28:33.491Z | 1,306,437 | `4174eb89805e2e4a4fa3409f2cdc45f5313bc538f1e561f8d21a103ef3904104` | 0 / 0 / 0 / 0 / 0 / 0 |
| Project role core | `FIXTURE_ONLY` | project v0.1 | no external artifact | — | — | — | not applicable |

Totals across the seven indexed datasets are 1,745,220 raw, 1,650,162 accepted, 95,058 rejected, 223 exact duplicate annotations, 63,032 aggregated annotation rows, 1,586,907 normalized, and 1,586,907 indexed records. The manuscript is authority metadata only and intentionally contributes no corpus records.

No source is `MANIFEST_ONLY`, `BLOCKED`, or `EXCLUDED` in this pass. Excluded materials—GLUCOSE, EmpatheticDialogues, unlicensed community lorebooks, scraped dialogue, copyrighted franchise material, and other excluded/noncommercial sources—were not acquired or ingested.

## Official source, license, citation, and policy verification

| Source | Official repository/artifact verification | License and redistribution treatment | Citation / authority boundary |
| --- | --- | --- | --- |
| ATOMIC 2020 | [AllenAI COMET-ATOMIC 2020 repository](https://github.com/allenai/comet-atomic-2020); artifact URL in the manifest is the repository’s Google Drive data link. | Repository distinguishes Apache-2.0 code from the CC-BY dataset. The acquired archive is retained under this project’s `REFERENCE_ONLY` policy. | Hwang et al. (2021), *Comet-Atomic 2020*, AAAI. Event-intent, need, effect, reaction, order, obstacle, and affordance priors only. |
| Social Chemistry 101 | [Official repository](https://github.com/mbforbes/social-chemistry-101) and its linked [official ZIP](https://storage.googleapis.com/ai2-mosaic-public/projects/social-chemistry/data/social-chem-101.zip). | Repository states CC BY-SA 4.0. `rot-bad=1` records are rejected from the default normalized/indexed set and retained only in the bounded rejection audit. Upstream user-generated material remains subject to separate rights review. | Forbes et al. (2020), *Social Chemistry 101*, EMNLP. Norm/rule-of-thumb priors only. |
| Moral Stories | [Maintainer repository](https://github.com/demelin/moral_stories), [MIT license](https://raw.githubusercontent.com/demelin/moral_stories/master/LICENSE), and current [Hugging Face dataset file](https://huggingface.co/datasets/demelin/moral_stories/resolve/main/data/moral_stories_full.jsonl?download=true). | MIT source license; acquired file is retained under `REFERENCE_ONLY`. Moral and immoral branches are paired evidence, not automatic outcomes. | Emelin et al. (2021), *Moral Stories*, EMNLP. Situation, intention, action, norm, and consequence priors only. |
| Luangrath–Peck–Barger TPL authority | [arXiv manuscript record](https://arxiv.org/abs/1605.06799), [PDF artifact](https://arxiv.org/pdf/1605.06799), and [DOI record](https://doi.org/10.1016/j.jcps.2016.05.002). | Registered as `PAPER_CONCEPTUAL_REFERENCE` and `REFERENCE_ONLY`; only the manuscript and metadata were acquired. The underlying social-media corpus is not claimed available or reusable. | Luangrath, Peck, and Barger (2017), *Textual Paralanguage and its Implications for Marketing Communications*, Journal of Consumer Psychology. Conceptual five-family TPL boundary only. |
| Stanford Politeness — Wikipedia | [ConvoKit documentation](https://convokit.cornell.edu/documentation/wiki_politeness.html) documents 4,353 utterances, JSONL structure, and CC BY 4.0; the documented HTTP route redirects to the verified [HTTPS artifact](https://zissou.infosci.cornell.edu/convokit/datasets/wikipedia-politeness-corpus/wikipedia-politeness-corpus.zip). | CC BY 4.0. The normalized set is `REQUEST_OR_PERSUASION_DIALOGUE`, evidence/prior only. | Danescu-Niculescu-Mizil et al. (2013), ACL P13-1025. Request-construction evidence only. |
| Stanford Politeness — Stack Exchange | [ConvoKit documentation](https://convokit.cornell.edu/documentation/stack_politeness.html) documents 6,603 utterances and CC BY 4.0; the documented HTTP route redirects to the verified [HTTPS artifact](https://zissou.infosci.cornell.edu/convokit/datasets/stack-exchange-politeness-corpus/stack-exchange-politeness-corpus.zip). | CC BY 4.0. The normalized set is request-construction evidence/prior only. | Danescu-Niculescu-Mizil et al. (2013), ACL P13-1025. Request-construction evidence only. |
| CaSiNo | [Official repository](https://github.com/kushalchawla/CaSiNo), [CC BY 4.0 license](https://raw.githubusercontent.com/kushalchawla/CaSiNo/master/LICENSE), and verified [ConvoKit HTTPS artifact](https://zissou.infosci.cornell.edu/convokit/datasets/casino-corpus/casino-corpus.zip). | CC BY 4.0. Demographics, personality, preferences, and outcomes are not normalized into runtime semantics. | Chawla et al. (2021), *CaSiNo*, NAACL. Negotiation-move and sequencing priors only. |
| PersuasionForGood | [Maintainer GitLab repository](https://gitlab.com/ucdavisnlp/persuasionforgood), [repository archive artifact](https://gitlab.com/ucdavisnlp/persuasionforgood/-/archive/master/persuasionforgood-master.zip), and [ConvoKit documentation](https://convokit.cornell.edu/documentation/persuasionforgood.html). | Official documentation/repository identifies Apache 2.0. The `FullData/full_dialog.csv` dialogue rows were normalized; survey/demographic/personality fields in companion files were deliberately excluded. | Wang et al. (2019), *Persuasion for Good*, ACL. Persuasion-strategy evidence only. |
| Project role core | Project-authored source in this repository; connected legacy repository is recorded in `handoff/REPOSITORY_CONNECTIONS.local.json`. | Project-authored and allowed with attribution; fixture-only. The connected legacy repository remained read-only. | Reviewed authoring suggestions only; not a universal behavior source. |

## Observed schemas and processing

The schema was read from the acquired data files and recorded in each ignored `data/indexes/<sourceId>.json` payload:

- ATOMIC: headerless TSV with exact fields `head`, `relation`, `tail`, processed from `train.tsv`, `dev.tsv`, and `test.tsv`.
- Social Chemistry: 25-column TSV with exact header `area`, `m`, `split`, `rot-agree`, `rot-categorization`, `rot-moral-foundations`, `rot-char-targeting`, `rot-bad`, `rot-judgment`, `action`, `action-agency`, `action-moral-judgment`, `action-agree`, `action-legal`, `action-pressure`, `action-char-involved`, `action-hypothetical`, `situation`, `situation-short-id`, `rot`, `rot-id`, `rot-worker-id`, `breakdown-worker-id`, `n-characters`, `characters`.
- Moral Stories: JSONL keys `ID`, `norm`, `situation`, `intention`, `moral_action`, `moral_consequence`, `immoral_action`, `immoral_consequence`.
- Stanford Politeness and CaSiNo: JSONL schemas were read from the actual `utterances.jsonl` files, including `id`, text, speaker/user, conversation/root, reply-to, timestamp, vectors where present, and observed metadata keys.
- PersuasionForGood: exact dialogue CSV header `,Unit,Turn,B4,B2`; `B2` is the dialogue identifier, `B4` is the role, `Turn` is the turn field, and `Unit` is the utterance text. Companion participant/survey files were excluded from the normalized dialogue evidence.

All indexed records carry `sourceId`, `sourceRecordId`, source version, license ID, `transformVersion: normalizer@0.1`, `approvalStatus: EVIDENCE_PRIOR`, `defaultOnly: true`, and `runtimeEligible: false`. Search probes return the same record-level provenance. The index snapshots and normalized paths are local reproducibility artifacts, not runtime corpus approval.

## Retrieval probes

Every indexed source passed three non-empty retrieval probes, with three results per probe and provenance attached to every result:

| Source | Probe 1 | Probe 2 | Probe 3 |
| --- | --- | --- | --- |
| ATOMIC 2020 | `xIntent` — 3 | `xNeed` — 3 | `HinderedBy` — 3 |
| Social Chemistry 101 | `losing trust` — 3 | `thanks` — 3 | `legal` — 3 |
| Moral Stories | `moral_action` — 3 | `immoral_action` — 3 | `responsible` — 3 |
| Stanford Politeness — Wikipedia | `thanks` — 3 | `please` — 3 | `would you` — 3 |
| Stanford Politeness — Stack Exchange | `explain` — 3 | `question` — 3 | `please` — 3 |
| CaSiNo | `firewood` — 3 | `food` — 3 | `water` — 3 |
| PersuasionForGood | `donate` — 3 | `charity` — 3 | `good` — 3 |

## Reproduction and tests

`npm run ingest:real` revalidates the cached artifact receipts, safely extracts each archive, normalizes the real rows, writes ignored normalized JSONL, builds the compact search indexes, and rewrites `data/acquisition-manifest.json`. The rerun produced identical artifact checksums and counts. The complete test suite includes receipt/hash/cache checks, importer/provenance checks, real retrieval checks, synthetic idempotent reimport/reset checks, keyword/mechanics checks, TPL semantic invariance checks, lint, typecheck, and build.
