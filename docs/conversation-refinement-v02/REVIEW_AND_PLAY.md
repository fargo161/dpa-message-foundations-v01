# Conversation refinement v02 — review and play

This local review build starts at commit `702d38fc2fc4750b93e826f733c16cb57354225a` and uses branch `codex/conversation-refinement-v02`. No commit or push has been made by the implementation team.

## Player-visible changes

| Experience | Implementation |
| --- | --- |
| Your edge stays useful when you change the subject | Pinned player-known information, source/relevance/disclosure status, observations, preparation reminders and an existing contextual action. No hidden scores or quirk names. |
| A brief negotiating opening remains visible | Public next-turn countdown, including the after-turn-seven expiry boundary. Used does not mean a bonus or concession was earned. Pending information exchanges are labeled and link to current-offer clarification. |
| Repeated questions and late preparation are explained truthfully | Completed-action labels; late source/probe/record speech acknowledges information already received; repeat feedback says no new progress. Ordinary negotiation remains available when private information is spent. |
| Delivery is understandable beside your exact words | Selected manner/intensity, per-line neutral fallback status and action applicability are projected without predicting the reply. The full chart now shows its description and intensity controls inside the separate menu. |
| Offer building requires less arithmetic | New principal calculates from quantity and cash. The opening introduces the suggested credit goal; draft/current-offer summaries show cash retained and new repayment. Counteroffers can be compared with the last actual spoken proposal. |
| Both facial reactions can be inspected | A saved pair can be opened after a turn or from the transcript. Inspection does not submit, rerun policy or count delivery use. Actual reply text is included in an accessible announcement. |

The approved main layout, full forward-looking face, separate keyword/BASED menu, 20 ordered vibes, three intensities and seven Marcus metrics remain. Avery's non-commercial fixture remains available with attributed explanation and neutral placeholder art.

## Separately reviewable economic changes

1. A new financial concession must retain the existing security improvements and fresh-record requirements **and** avoid reducing the existing financial valuation of the offer. That valuation includes capped extra repayment and excludes social/information effects. A lower fee can still be compatible with a genuine lower-principal improvement. The reproduced $1 cash increase combined with a $24 fee cut no longer receives unqualified progress credit.
2. If a generated counter keeps quantity, cash, principal and days unchanged, it cannot reduce the offered extra repayment. When the resulting counter equals the proposal, the existing rejection gate applies. The documented hostile-delivery fee discount now produces rejection instead of a cheaper otherwise-identical offer. Other counter formulas, thresholds, starting resources and credit limits are unchanged.

General rejection language now acknowledges the proposal and conversation rather than blaming financial risk in every case. These policy changes are bounded fixes, not a complete balance redesign or a guarantee that all possible counteroffers are optimal.

## Language boundary

Thirty-one NPC base families and two alternatives per family are retained. Selected preview alternatives are shorter; shared-information conditions use truthful contextual wording. Existing deterministic two-variant scheduling remains. This does not claim 60 unique player utterances or a deep new personality database. New stylistic wording remains AUTHORING_PREVIEW; production protocols and runtime corpus records have not been promoted. Canonical wording changes are limited to semantic truth repairs.

## Verification

The lead ran dependency installation, the portable suite, lint, typecheck, schema validation, build and generated-file freshness. All passed. **265 tests passed, zero failed or skipped** (237 existing plus28 added tests). Independent acceptance includes 120 Marcus/Avery preview-to-commit coordinate comparisons, edge privacy/lifecycle, conditional information transfer and both policy reproductions. The UI DOM test used the real HTTP server and confirmed zero additional POST requests and identical server state across repeated facial inspection. Avery restart and hidden commercial fields were also checked.

DOM emulation does not certify native dialog/focus/form-validation behavior, screen-reader output, responsive appearance or animation feel. Those remain a native-browser playtest. See `VALIDATION.md` and the six agent handoffs in this directory for exact scope and evidence.

## Apply and play on Windows

Download `CONVERSATION_REFINEMENT_V02.patch` to Downloads. Stop your currently running server with Ctrl+C. Paste this entire block in PowerShell. It checks the exact starting commit and clean working tree, lets you select the patch, then starts the updated server on an automatically assigned free local port. It does not commit, push or terminate other servers.

```powershell
& {
    $ErrorActionPreference = 'Stop'
    Set-Location "$env:USERPROFILE\Documents\Codex\2026-09-04\r\work\marcus-lore"

    function Invoke-CheckedGit {
        & git @args
        if ($LASTEXITCODE -ne 0) { throw "Git failed: $args" }
    }

    $baseSha = '702d38fc2fc4750b93e826f733c16cb57354225a'
    $newBranch = 'codex/conversation-refinement-v02'
    if ((Invoke-CheckedGit rev-parse HEAD) -ne $baseSha) {
        throw 'This checkout is not at the expected starting commit. Send me the output before applying.'
    }
    if (Invoke-CheckedGit status --porcelain) {
        throw 'There are local changes. Send me git status before applying this patch.'
    }

    Add-Type -AssemblyName System.Windows.Forms
    $picker = New-Object System.Windows.Forms.OpenFileDialog
    $picker.Title = 'Select CONVERSATION_REFINEMENT_V02.patch'
    $picker.Filter = 'All files (*.*)|*.*'
    $picker.InitialDirectory = "$env:USERPROFILE\Downloads"
    if ($picker.ShowDialog() -ne 'OK') { throw 'No patch selected.' }
    $selectedPatch = $picker.FileName
    Invoke-CheckedGit apply --check "$selectedPatch"

    git show-ref --verify --quiet "refs/heads/$newBranch"
    if ($LASTEXITCODE -eq 0) {
        if ((Invoke-CheckedGit rev-parse "$newBranch") -ne $baseSha) {
            throw 'The refinement branch already contains other work. Nothing was applied.'
        }
        Invoke-CheckedGit switch $newBranch
    } else {
        Invoke-CheckedGit switch -c $newBranch
    }
    Invoke-CheckedGit apply "$selectedPatch"

    Write-Host 'Applied. Open the PLAY HERE address printed below; leave this window running.' -ForegroundColor Green
    @'
import { createEncounterServer } from "./scripts/encounter-server.mjs";
const server = createEncounterServer();
server.on("error", error => { console.error(error.message); process.exitCode = 1; });
server.listen(0, "127.0.0.1", () => {
  console.log("PLAY HERE: http://127.0.0.1:" + server.address().port + "/");
});
'@ | node --input-type=module
    if ($LASTEXITCODE -ne 0) { throw 'The preview server could not start.' }
}
```

Do not apply the patch a second time. For later launches from the patched repo, `npm run encounter:dev` remains available; set `MARCUS_PORT` to a free port if using that original command. The launcher block above uses the same server factory with an OS-assigned port to avoid the earlier address-in-use problem.
