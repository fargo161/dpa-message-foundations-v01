# Marcus ASK/DEAL playtest

The first encounter is playable: structured ASK probes, configurable DEAL terms, contextual Marcus responses, revisions, exact-offer confirmation, withdrawal, seeded quirks, and an observational Play/Debug toggle. Full TPL, PRESSURE, persistence, resale, and later repayment are deferred.

## Verified delivery

- Local: http://127.0.0.1:4174/
- Temporary public link: https://analyses-graduates-rouge-geographical.trycloudflare.com/
- Verified on 2026-09-04, America/New_York: browser ASK, proposed DEAL, counteroffer, acceptance, resource changes, and matching Debug values locally. A complete counteroffer/acceptance also passed through the public HTTPS link after restarting the final server. The public page was reset for playtesting.
- The public agreement transferred 48 cash for 2 Contra units and added 72 principal plus 11 extra. Final public values: cash 32, debt 333, Marcus stock 6, player stock 2. Existing debt stayed 250.
- PC, Node server and tunnel must remain running. The URL stops working when the tunnel stops and changes on a new tunnel launch. It is a temporary public prototype, with no availability guarantee.

## Running processes and stopping this delivery

This delivery started two hidden background processes (no terminal window): Node PID **4968**, cloudflared PID **27120**. Logs are in `C:\Users\mcdon\Documents\Codex\2026-09-04\r\work\marcus-server.log`, `marcus-server-error.log`, `marcus-tunnel.log`, and `marcus-tunnel-error.log`.

Use this block from any fresh PowerShell session to stop these exact processes. It verifies their command lines first and refuses a mismatched PID. If the PC has restarted or these PIDs are gone, there is nothing to stop.

```powershell
$ErrorActionPreference = 'Stop'
$targets = @(
  @{ Id = 27120; Name = 'cloudflared.exe'; Needle = 'http://127.0.0.1:4174' },
  @{ Id = 4968; Name = 'node.exe'; Needle = 'scripts/encounter-server.mjs' }
)
foreach ($target in $targets) {
  $running = Get-CimInstance Win32_Process -Filter "ProcessId = $($target.Id)"
  if ($null -eq $running) { continue }
  if ($running.Name -ne $target.Name -or $running.CommandLine -notlike "*$($target.Needle)*") {
    throw "PID $($target.Id) no longer matches the prototype; no stop attempted."
  }
  Stop-Process -Id $target.Id -ErrorAction Stop
}
```

## Launch or restart from any directory

Stop the previous delivery first. Open PowerShell window A and run the complete block below. Dependencies are already installed; serving uses Node built-ins and the repository's canonical BASED module. The command stays in the foreground. Press **Ctrl+C in window A** to stop this new server. Server restart loses in-memory sessions.

```powershell
$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\mcdon\Documents\ChatGPT\dpa-message-foundations-v01-phase2-recovered'
$nodeExe = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path -LiteralPath "$repo\scripts\encounter-server.mjs")) { throw 'Prototype checkout missing.' }
if (-not (Test-Path -LiteralPath $nodeExe)) { throw 'Node executable missing.' }
Set-Location -LiteralPath $repo
$env:MARCUS_PORT = '4174'
& $nodeExe "$repo\scripts\encounter-server.mjs"
if ($LASTEXITCODE -ne 0) { throw "Server exited with code $LASTEXITCODE" }
```

Open PowerShell window B and run this complete block. It exposes only the restricted prototype server. Read the new `https://…trycloudflare.com` address printed in window B. Press **Ctrl+C in window B** to stop that tunnel. Leave both windows and the PC running while sharing.

```powershell
$ErrorActionPreference = 'Stop'
$tunnelExe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path -LiteralPath $tunnelExe)) { throw 'Cloudflare tunnel client missing.' }
& $tunnelExe tunnel --url 'http://127.0.0.1:4174' --no-autoupdate --protocol http2
if ($LASTEXITCODE -ne 0) { throw "Tunnel exited with code $LASTEXITCODE" }
```

The launch executables, working directory and tunnel arguments above were used for the verified background launch. No hosting account or extra client installation was needed. No filesystem permissions or global Git settings were changed.

## Starting position and reproducible paths

Exactly seven gameplay metrics start at:

| Metric | Initial value | Rationale |
| --- | ---: | --- |
| Player cash | 80 | Insufficient to buy the default two Contra units outright |
| Outstanding debt | 250 | Existing obligation, never replaced by a new offer |
| Marcus Contra | 8 | Enough stock for several potential deal sizes |
| Player Contra | 0 | No stock until acceptance |
| Marcus confidence | 40 | Guarded, with room for credible discussion |
| Marcus tension | 20 | Not hostile at the opening |
| Marcus patience | 12 | Several turns, with rising costs for repetition |

Contra costs 60 per unit. Money and terms use whole numbers; new principal must equal units times 60 minus upfront cash. Extra repayment is separate. A large promise never creates cash. The policy separately limits new credit and exposure. Configuration lives in the state and personality modules; the server owns all transitions.

One quirk is fixed per seed: **Final say**, **Plain dealing**, or **Recognition**. Ask about priorities for a readable clue, or explore debt, risk, and who sets the terms. Debug reveals the exact quirk and policy configuration. Reusing a seed and choices reproduces gameplay; security/run IDs intentionally change.

Useful test paths (EA = Boundaried, BALANCED delivery):

1. Default two-unit proposal: 40 upfront, 80 principal, 10 extra, 7 days. Marcus can counter with 2 units, 48 upfront, 72 principal, 11 extra, 7 days. Confirm to complete the transfer.
2. A larger, longer proposal: 4 units, 80 upfront, 160 principal, 24 extra, 20 days. The tested opening counter is 3 units, 80 upfront, 100 principal, 15 extra, 10 days.
3. Ask repeatedly about the same topic: benefits stop, patience costs grow, and negotiations eventually end. High-risk offers and antagonistic delivery can also produce refusals.

These are demonstrated paths, not promises that later social state is irrelevant. A risk acknowledgment in a Recognition run changed an otherwise identical proposal from counteroffer to approval in the independent tests. Different delivery affects interpretation, never the submitted terms.

## Validation and independent review

- `npm ci` succeeded with committed dependencies; no upgrades.
- Integrated portable suite: **159 passed, 0 failed, 0 skipped**. Includes **25 encounter tests**: 4 engine, 1 API, 8 behavior, 12 independent adversarial tests.
- `npm run lint`, `npm run typecheck`, `npm run schema:validate`, `npm run build`, and `node scripts/check-generated.mjs` passed. Browser JS is included in ESLint and separately passed `node --check`.
- Reviewed actual malformed HTTP requests, stale/forged/cross-session offers, duplicate acceptance, simultaneous submissions, restart isolation, resource limits, seeded replay, semantic invariance, and bounded social benefits.
- Fixed the reviewer's presentation finding: accepted dialogue now names readable terms instead of internal offer IDs. The reviewer independently verified the fix.
- External cache-dependent `npm run test:real` was not run; no corpus was acquired. Portable test success does not claim verification of external corpus bytes.
- See `docs/architecture/MARCUS_REVIEW_V01.md` for independent evidence and `MARCUS_ENCOUNTER_V01.md` for the interface contract.

## Limits

State is in memory, expires after two hours of inactivity, and is lost on server restart. A browser profile shares its cookie between tabs; use another browser/profile/private session for an independent encounter. The prototype caps concurrent sessions at 256 and successful submissions at 512 per session. Debug intentionally reveals hidden state. There are no state-editing, filesystem, shell, repository, or general admin routes. Only the prototype's three static assets and three API endpoints are served.

This is authored deterministic dialogue with structured semantic events and BASED/intensity metadata. It neither invokes an LLM nor claims existing TPL runtime authorization for the new encounters. The future adapter must explicitly authenticate live obligations. No PRESSURE, full TPL encoding, save system, economy simulation, artwork, or later phase was added.

Four agents were used: lead, behavior, browser, and independent reviewer, without nested delegation. Exact aggregate token metering was unavailable; final handoff reports an estimate. Nothing was pushed or merged. Stop here for the user's ASK/DEAL playtest.
