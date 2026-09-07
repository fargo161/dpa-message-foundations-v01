# Conversation language: actual review material

Status: implemented for local authoring preview; owner language approval remains PENDING. No production protocols or corpus records were added. The full actual samples are in `src/conversation/language/review-manifest.json`.

## What the player experiences

The player chooses a subject and action, then sees the exact authored speech before sending. BASED and intensity add written pacing, discourse openings and emphasis. The core selected meaning stays intact. The preview and committed speech use the same turn seed; browsing does not spend a line or consume an alternate. Marcus answers from a family selected by the resolved response, with alternating compatible phrasings. He does not copy the player's chosen vibe.

This first safe language pass deliberately has modest player variation. It covers all 60 delivery coordinates, but does not pretend that 60 inputs produce 60 semantically distinct utterances. Several vibes share presentation recipes. Threatening/deceptive coordinates use an explicitly marked context-neutral realization: selecting Extortive or Bluffing does not manufacture a threat, lie, audience, deadline or leverage. Deeper character-specific language still requires authored review of those exact claims. The existing mechanics can interpret delivery independently.

## Player samples: one unchanged debt question

The exact core remains: “I still owe you money, and future profits are uncertain. How does that affect another deal?”

| Delivery | Actual preview sample, variant 0 |
| --- | --- |
| EA Boundaried / Subtle | I still owe you money, and future profits are uncertain. How does that affect another deal? |
| EA Boundaried / Balanced | Okay—I still owe you money, and future profits are uncertain. How does that affect another deal? |
| EA Boundaried / Overt | OKAY… followed by a line break, then the unchanged core. |
| SA Charismatic / Balanced | All right—I still owe you money, and future profits are uncertain. How does that affect another deal? |
| BD Extortive / Balanced | Well—I still owe you money, and future profits are uncertain. How does that affect another deal? |

The BD sample is intentionally a context-neutral delivery fallback, not a successfully authored extortion. No Pressure mechanics are enabled.

## Marcus samples: same response, alternate wording

The catalog contains 31 reply families with two distinct phrasings each: 62 review lines. This includes defensive/general/context-removal branches; it is not a claim that all 31 appear in an ordinary seeded playthrough. The complete pair table and 60 actual player coordinate samples are in the manifest.

| Resolved family | Existing authored line | New preview alternative |
| --- | --- | --- |
| Debt | The $250 already on your account stays there. Another deal adds its own principal and any agreed extra; it does not replace what you owe. | You still owe the $250 on your account. New principal and any agreed extra go on top of that. Another deal does not replace the existing debt. |
| Counteroffer | Not on those terms. Here is what I will put my name to: 2 Contra unit(s), $50 upfront, $70 new principal plus $4 extra due in 7 day(s). Your existing debt is separate. Take a look before you decide. | I will not agree to your proposal. My counteroffer is 2 Contra unit(s), $50 upfront, $70 new principal plus $4 extra due in 7 day(s). The existing debt is separate. Review that before deciding. |
| Useful collection information | Checked collection instructions could save a wasted journey. That is a reason to listen, not a promise of a concession. | Verified collection instructions might save a wasted trip. I have reason to hear you out; I have not promised better terms. |
| Full disclosure spent | I have the collection detail now. That was your choice to share; it was not an agreement for stock. | You chose to give me the collection detail. I have it now. We did not agree to exchange stock for it. |
| Partial disclosure | I hear what kind of information you say you have. You have not given me the exact detail yet. | You have told me the kind of information you hold. The exact detail has not been shared with me. |
| Final say | You can propose. I can counter. Neither of us owes the other a yes. | Make a proposal; I can make a counteroffer. Either of us can say no. |

Numeric terms are inserted once using the same formatter in both variants. Optional information-exchange and social-approach suffixes remain unchanged and arise only from existing resolved conditions.

## Disclosure and semantic repair

Source verification speaks only about the header/signature. A hint communicates the category. An information offer stays conditional and retains explicit refusal space. None of these speech frames contain the covered operative detail. Full disclosure contains the exact player-known proposition.

On confirmed ACCEPT of an information exchange, the player now actually says the known proposition instead of repeating the old category-summary promise. This is a canonical semantic repair explicitly accepted by the integration lead: the information is delivered in the same confirmed transition already authorized by policy. It adds no facts or new stylistic protocol. Existing debt remains separate; the accepted units, upfront cash, principal, extra and days remain exact. This correction also appears in PRODUCTION fallback. All other new stylistic phrasing remains preview-only.

## Boundaries for review

- `PRODUCTION` returns authored canonical speech and existing NPC phrase 0. It does not enable the new preview pack.
- `AUTHORING_PREVIEW` produces the local draft recipes and NPC alternatives with explicit readiness metadata.
- Frame validation checks schema, closed fields, actor/target identity, action shape, exact terms and agreement identity. It is not gameplay authority; the integration lead binds validated current drafts using a private trusted bridge. A cloned frame does not acquire action authority.
- The renderer never resolves a social outcome or information policy, changes state, selects faces, or loads an external language corpus.
- Avery's portability fixture uses the same presentation transformer with only three registered exact lines. Its character-specific response policy remains fixture-owned.

## Requested owner review, after integration

Review the actual sample language for voice, naturalness and pacing; decide whether to approve a production pack or request another authored pass. Approval of team execution did not approve this pack. Mechanical invariance tests establish semantic preservation, not human-rated naturalness. The manifest remains `productionEligible: false` until a separate explicit decision and follow-up implementation.
