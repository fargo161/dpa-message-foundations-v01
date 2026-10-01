# Exact extra-charge follow-up migration

Compared with the committed e7aa831 R-17 fixture (SHA-256 6b2e7c1e7b68df054dd9f40517395f09f99f9859366928c50828f9cc31f2a186). The original historical fixture is unchanged (SHA-256 add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46). Every changed path, old/new value, governing rule and before/after snapshot hash is recorded in EXTRA_CHARGE_MIGRATION.json.

- **EXACT_EXTRA**: Follow-up A1/A3: normalize submitted extra to the exact resolved whole-dollar charge; actual exposure and settlement use that charge.
- **STANDARD_SCORE**: Follow-up A2: score and concession comparisons use standard 16%; repetition ignores the player-uneditable extra.
- **PROPOSAL_SPEECH**: Follow-up A6: DEAL names new credit at Marcus's extra charge; ACCEPT and Marcus's replies retain exact established amounts.
- **PUBLIC_DRAFT**: Follow-up A5: public rate context contains observed interest only; blind drafts have both possible charges and no private-interest oracle.
- **CHARGE_COPY**: Follow-up A1/A4/B: exact-charge wording replaces floor/minimum/bargaining-chip wording; comparisons use 16% on the same principal.
- **LIMIT_RESPONSE**: User addition: blind charge-dependent hard limits resolve with Marcus's ordinary counter/reject response, never a validation oracle.

| Run | Snapshot / turn | Rules changing the expectation | Changed paths |
| --- | ---: | --- | ---: |
| positiveWithoutExchange | 0 | PUBLIC_DRAFT | 1 |
| positiveWithoutExchange | 1 | PUBLIC_DRAFT | 1 |
| positiveWithoutExchange | 2 | PUBLIC_DRAFT | 1 |
| positiveWithoutExchange | 3 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, PUBLIC_DRAFT, CHARGE_COPY | 13 |
| positiveWithExchange | 0 | PUBLIC_DRAFT | 1 |
| positiveWithExchange | 1 | PUBLIC_DRAFT | 1 |
| positiveWithExchange | 2 | PUBLIC_DRAFT | 1 |
| positiveWithExchange | 3 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 15 |
| positiveWithExchange | 4 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 5 |
| positiveWithExchange | 5 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 5 |
| positiveEarlyGiveaway | 0 | PUBLIC_DRAFT | 1 |
| positiveEarlyGiveaway | 1 | PUBLIC_DRAFT | 1 |
| positiveEarlyGiveaway | 2 | PUBLIC_DRAFT | 1 |
| positiveEarlyGiveaway | 3 | PUBLIC_DRAFT | 1 |
| negativeWithOpening | 0 | PUBLIC_DRAFT | 1 |
| negativeWithOpening | 1 | PUBLIC_DRAFT | 1 |
| negativeWithOpening | 2 | PUBLIC_DRAFT | 1 |
| negativeWithOpening | 3 | PUBLIC_DRAFT | 1 |
| negativeWithOpening | 4 | PUBLIC_DRAFT | 1 |
| negativeWithOpening | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| negativeWithOpening | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
| negativeWithoutOpening | 0 | PUBLIC_DRAFT | 1 |
| negativeWithoutOpening | 1 | PUBLIC_DRAFT | 1 |
| negativeWithoutOpening | 2 | PUBLIC_DRAFT | 1 |
| negativeWithoutOpening | 3 | PUBLIC_DRAFT | 1 |
| negativeWithoutOpening | 4 | PUBLIC_DRAFT | 1 |
| negativeWithoutOpening | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| negativeBacklash | 0 | PUBLIC_DRAFT | 1 |
| negativeBacklash | 1 | PUBLIC_DRAFT | 1 |
| negativeExpired | 0 | PUBLIC_DRAFT | 1 |
| negativeExpired | 1 | PUBLIC_DRAFT | 1 |
| negativeExpired | 2 | PUBLIC_DRAFT | 1 |
| negativeExpired | 3 | PUBLIC_DRAFT | 1 |
| negativeExpired | 4 | PUBLIC_DRAFT | 1 |
| negativeExpired | 5 | PUBLIC_DRAFT | 1 |
| negativeExpired | 6 | PUBLIC_DRAFT | 1 |
| negativeExpired | 7 | PUBLIC_DRAFT | 1 |
| negativeExpired | 8 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 54 |
| sixExchangeLateConcession | 0 | PUBLIC_DRAFT | 1 |
| sixExchangeLateConcession | 1 | PUBLIC_DRAFT | 1 |
| sixExchangeLateConcession | 2 | PUBLIC_DRAFT | 1 |
| sixExchangeLateConcession | 3 | PUBLIC_DRAFT | 1 |
| sixExchangeLateConcession | 4 | PUBLIC_DRAFT | 1 |
| sixExchangeLateConcession | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 56 |
| sixExchangeLateConcession | 6 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 37 |
| sixExchangeLateConcession | 7 | STANDARD_SCORE, EXACT_EXTRA, CHARGE_COPY, PROPOSAL_SPEECH, PUBLIC_DRAFT | 34 |
| directCredit | 0 | PUBLIC_DRAFT | 1 |
| directCredit | 1 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 17 |
| directCredit | 2 | STANDARD_SCORE, EXACT_EXTRA, CHARGE_COPY, PROPOSAL_SPEECH, PUBLIC_DRAFT | 19 |
| limitedCashPurchase | 0 | PUBLIC_DRAFT | 1 |
| limitedCashPurchase | 1 | PROPOSAL_SPEECH, PUBLIC_DRAFT, CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA | 5 |
| limitedCashPurchase | 2 | PROPOSAL_SPEECH, PUBLIC_DRAFT | 2 |
| worsenedRiskRegression | 0 | PUBLIC_DRAFT | 1 |
| worsenedRiskRegression | 1 | PROPOSAL_SPEECH, PUBLIC_DRAFT, CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA | 5 |
| worsenedRiskRegression | 2 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, PUBLIC_DRAFT, CHARGE_COPY | 14 |
| combination-POSITIVE-final_say-EA | 0 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-final_say-EA | 1 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-final_say-EA | 2 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-final_say-EA | 3 | EXACT_EXTRA, STANDARD_SCORE, CHARGE_COPY, PROPOSAL_SPEECH, PUBLIC_DRAFT | 30 |
| combination-POSITIVE-final_say-EA | 4 | EXACT_EXTRA, STANDARD_SCORE, CHARGE_COPY, PROPOSAL_SPEECH, PUBLIC_DRAFT | 10 |
| combination-POSITIVE-final_say-SE | 0 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-final_say-SE | 1 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-final_say-SE | 2 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-final_say-SE | 3 | EXACT_EXTRA, STANDARD_SCORE, CHARGE_COPY, PROPOSAL_SPEECH, PUBLIC_DRAFT | 30 |
| combination-POSITIVE-final_say-SE | 4 | EXACT_EXTRA, STANDARD_SCORE, CHARGE_COPY, PROPOSAL_SPEECH, PUBLIC_DRAFT | 10 |
| combination-POSITIVE-plain_dealing-EA | 0 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-plain_dealing-EA | 1 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-plain_dealing-EA | 2 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-plain_dealing-EA | 3 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 29 |
| combination-POSITIVE-plain_dealing-EA | 4 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 9 |
| combination-POSITIVE-plain_dealing-SE | 0 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-plain_dealing-SE | 1 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-plain_dealing-SE | 2 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-plain_dealing-SE | 3 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 29 |
| combination-POSITIVE-plain_dealing-SE | 4 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 9 |
| combination-POSITIVE-recognition-EA | 0 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-recognition-EA | 1 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-recognition-EA | 2 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-recognition-EA | 3 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 26 |
| combination-POSITIVE-recognition-EA | 4 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 8 |
| combination-POSITIVE-recognition-SE | 0 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-recognition-SE | 1 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-recognition-SE | 2 | PUBLIC_DRAFT | 1 |
| combination-POSITIVE-recognition-SE | 3 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 26 |
| combination-POSITIVE-recognition-SE | 4 | EXACT_EXTRA, STANDARD_SCORE, PROPOSAL_SPEECH, CHARGE_COPY, PUBLIC_DRAFT | 8 |
| combination-NEGATIVE-final_say-EA | 0 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-EA | 1 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-EA | 2 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-EA | 3 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-EA | 4 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-EA | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| combination-NEGATIVE-final_say-EA | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
| combination-NEGATIVE-final_say-SE | 0 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-SE | 1 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-SE | 2 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-SE | 3 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-SE | 4 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-final_say-SE | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| combination-NEGATIVE-final_say-SE | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
| combination-NEGATIVE-plain_dealing-EA | 0 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-EA | 1 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-EA | 2 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-EA | 3 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-EA | 4 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-EA | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| combination-NEGATIVE-plain_dealing-EA | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
| combination-NEGATIVE-plain_dealing-SE | 0 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-SE | 1 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-SE | 2 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-SE | 3 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-SE | 4 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-plain_dealing-SE | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| combination-NEGATIVE-plain_dealing-SE | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
| combination-NEGATIVE-recognition-EA | 0 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-EA | 1 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-EA | 2 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-EA | 3 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-EA | 4 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-EA | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| combination-NEGATIVE-recognition-EA | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
| combination-NEGATIVE-recognition-SE | 0 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-SE | 1 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-SE | 2 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-SE | 3 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-SE | 4 | PUBLIC_DRAFT | 1 |
| combination-NEGATIVE-recognition-SE | 5 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 48 |
| combination-NEGATIVE-recognition-SE | 6 | CHARGE_COPY, STANDARD_SCORE, EXACT_EXTRA, PROPOSAL_SPEECH, PUBLIC_DRAFT | 40 |
