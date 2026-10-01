# Actual R-17 browser playtest

Tested the running source build at http://127.0.0.1:4175/ through real UI controls. All drafts used Boundaried / Balanced and, for matched comparison, two units, $70 cash, $50 new principal, $0 proposed extra, seven days.

| Seed | Actions actually performed | Observed result |
| --- | --- | --- |
| r17-proof-1 (GOOD / does not care) | Restart → counterfoil menu → Hint → Trade → submit | Category-only preview; approved “Depot already called me about the collection change” wording; Hinted/private; R-17 still in dropdown; counter extra $8 at 16%; no information exchange. |
| r17-proof-2 (BAD / does not care) | Restart → blind Trade → submit → Show → ordinary later offer | Guarded annoyed face; $11 / 22%; card Held and private with penalty note. Show supplied header/signature and six-vs-eight detail without accusing wrongdoing; Spent and physically held; 19%. Later offer retained 19%, extra $10; dropdown disabled R-17. |
| r17-proof-19 (BAD / cares) | Restart → blind Trade → submit → build next offer → remove information → submit | $4 / 8% with held private body and conditional transfer; removing R-17 returned to $8 / 16% while retaining ownership/privacy. |
| r17-proof-0 (GOOD / cares) | Restart → Hint → Trade → submit → review counter → confirm exact terms | Honest interest, Hinted/private and 16% after Hint. Valuable counter $4 / 8% without early transfer. Confirmation displayed Traded, exact detail delivered, cash $10, stock acquired two, $54 new repayment, total owed $304 and old debt $250. |

Both menu content versions exposed exactly Hint, Show and Trade. Source verification and the deferred disclosure ladder were absent. Browsing and draft construction did not spend information. Required results appeared in numeric offers, NPC feedback/face and Your Edge.

The initial percentage label was found under an existing hidden heading and moved beside Your Edge; reload verified it visible with the offer builder collapsed. Final renderer checks passed 17 tests.

## Saved evidence

![Blind failure at 22%, card physically retained](validation/r17-blind-failure-22.jpg)

![Failure then Show and later ordinary offer at 19%](validation/r17-failure-show-19.jpg)

![Completed exchange showing Traded and 8%](validation/r17-completed-trade-8.jpg)

The completed view's DOM snapshot is saved as `validation/r17-completed-trade-dom.txt`.

## Standalone verification limitation

The offline artifact was built and its actual embedded runtime passed six dedicated parity checks, including all historical routes/snapshots and all 20 new R-17 golden routes with network calls forbidden. Direct `file://` launch through the in-app browser was blocked by its HTTP/HTTPS-only URL policy. No workaround was attempted. These screenshots are of the running source build; they are not claimed as screenshots of a file-launched standalone build.

## Exact-charge follow-up — 2026-10-01

The preceding observations describe the first pass. The follow-up replaces floor/player-chosen-fee behavior with Marcus's exact charge. Tested through the running source UI at http://127.0.0.1:4175/, Boundaried / Balanced.

| Required check | Actually observed |
| --- | --- |
| Seed `88fdc2d7be9a`, Hint → Trade builder | Read-only $15 / 8% on $180 principal; standard $29 / 16%; no editable additional-repayment control. |
| Same seed, specified 4/$60/$180 → 3/$60/$120 → 3/$65/$115 sequence | First counter retained 3/$72/$108/$9. Final offer approved 3/$65/$115/$10, six days. Proposal wording names “at your extra charge,” with no dollar fee. |
| `r17-proof-2`, unsent blind Trade on $50 principal | $4 / 8% if he values it and $11 / 22% if he doesn't; conditional $54/$61 totals. Interest unasked and no single fee outcome. |
| `r17-proof-2`, failed blind Trade and later ordinary draft | Card retained with persistent penalty; read-only $11 / 22% and standard $8 / 16% comparison. |
| Completed `88fdc2d7be9a` agreement | 3 units, $15 cash retained, $125 new repayment, $375 total owed; R-17 Traded and “R-17 saved you $9 on the extra charge.” |

The engine regression additionally submits $20 on the final $115 principal and proves silent normalization to $10. Existing test-only profile/world interventions prove both charge-dependent hard-limit branches; these were not injected through the browser or exposed as runtime settings.

New screenshots: `validation/r17-locked-extra-pass/ui-known-8.jpg`, `ui-blind-two-outcomes.jpg`, `ui-failed-22.jpg`, `ui-completed-savings.jpg`. Three DOM snapshots accompany the blind, failed and completed observations. Full-page capture was unavailable on later screens; viewport captures were positioned and visually checked for the relevant fee/comparison/savings text.

![Completed exact-charge agreement and savings](validation/r17-locked-extra-pass/ui-completed-savings.jpg)

The rebuilt standalone passes seven dedicated checks, including the added exact-extra regression and blind-limit parity with network calls forbidden. The source-UI/file-protocol distinction recorded above still applies.

## Playtest logger — 2026-10-01

Run `npm run encounter:dev` and use `http://127.0.0.1:4175/`. Each created run automatically maintains `.events.jsonl`, `.json` and `.md` siblings in ignored `playtest-logs/`. Names use local start time with UTC offset, seed and run ID. Headers retain local and UTC time. Restarting an open run records REPLACED; terminal results survive later restarts.

Use Download run log during play or after the result, then choose JSON or Markdown. Downloads contain developer spoilers; the rendered Play/Observed Debug views contain no logger private block. Files save wherever the browser chooses. The offline HTML in `dist/marcus-information-exchange-v01/Marcus_Encounter.html` uses the same recorder/renderer with an in-process API and no network. Guarded localStorage preserves a previous partial log for export only.

The actual browser agreement proof used `r17-proof-0`: Hint, then Trade at 2 units/$70 cash/$50 principal/7 days, then confirm. Result: 2 Contra, $10 cash, $54 new repayment, $304 owed, R-17 Traded and $4 saved. The `playtest-walk-away` proof retained $80 cash, 0 player stock, $250 owed and undisclosed R-17. All six automatic sample files, three DOM snapshots, viewport images and gate receipts are under `validation/playtest-log-pass/`.

![Completed playtest agreement](validation/playtest-log-pass/browser-agreement.jpg)

![Walk-away playtest](validation/playtest-log-pass/browser-walk-away.jpg)

The end-screen button is outside the disabled terminal turn fieldset and was clicked successfully. The in-app browser did not surface a completed Blob download event; direct file navigation was blocked by its URL policy. Those browser save/file checks are recorded as limitations, while protected HTTP and actual embedded export tests passed. Logger errors remain console-only; interrupted runs honestly remain incomplete.

See [schema](PLAYTEST_LOG_SCHEMA.md), [full report](IMPLEMENTATION_REPORT.md) and [validation inventory](validation/playtest-log-pass/VALIDATION_INVENTORY.json). Evidence committed here contains repository-relative references or omitted local paths. Real ignored logs are never staged wholesale. Rates, scoring, settlement, Section 35 and frozen expectations remain unchanged.
