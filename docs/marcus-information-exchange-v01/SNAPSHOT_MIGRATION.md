# R-17 frozen snapshot migration

The historical fixture is preserved byte-for-byte (SHA-256 add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46). Snapshot 0 is opening state; later indices are turn numbers. This table lists every historical snapshot; SNAPSHOT_MIGRATION.json contains every changed path, old/new value and applicable locked rule.

- **SURFACE**: Brief 6, 16, 17: replace the six-stage surface with Hint / Show / Trade, availability by held leverage, and truthful lifecycle status.
- **RATE**: Brief 14, locked A/B and Section 35: R-17 changes only extra (zero proof score bonus); centralized 16/13/8/22/19 rate, ceiling rounding, approval floor and current-offer-only trade value.
- **INTEREST**: Brief 5/7 and locked C: independently seeded interest, honestly observed responses, no initial R-17 body disclosure.
- **TRANSFER**: Brief 20/21 and locked D/E: coherent source/body reads and real atomic document transfer; history retains Traded visibility.
- **FEEDBACK**: Brief 18 and Section 35.H: resolved information feedback and existing face presets; presentation cannot change the proof mechanics.

| Historical run | Snapshot / turn | Rules changing its expectation | Changed paths |
| --- | ---: | --- | ---: |
| positiveWithoutExchange | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| positiveWithoutExchange | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| positiveWithoutExchange | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| positiveWithoutExchange | 3 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 29 |
| positiveWithExchange | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| positiveWithExchange | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| positiveWithExchange | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| positiveWithExchange | 3 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 94 |
| positiveWithExchange | 4 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 91 |
| positiveWithExchange | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 132 |
| positiveEarlyGiveaway | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| positiveEarlyGiveaway | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 19 |
| positiveEarlyGiveaway | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 20 |
| positiveEarlyGiveaway | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 18 |
| negativeWithOpening | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| negativeWithOpening | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| negativeWithOpening | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| negativeWithOpening | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| negativeWithOpening | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeWithOpening | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| negativeWithOpening | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
| negativeWithoutOpening | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| negativeWithoutOpening | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| negativeWithoutOpening | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| negativeWithoutOpening | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| negativeWithoutOpening | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeWithoutOpening | 5 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 30 |
| negativeBacklash | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| negativeBacklash | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeExpired | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| negativeExpired | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| negativeExpired | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| negativeExpired | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| negativeExpired | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeExpired | 5 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeExpired | 6 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeExpired | 7 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| negativeExpired | 8 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 30 |
| sixExchangeLateConcession | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| sixExchangeLateConcession | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| sixExchangeLateConcession | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| sixExchangeLateConcession | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| sixExchangeLateConcession | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| sixExchangeLateConcession | 5 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 29 |
| sixExchangeLateConcession | 6 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 26 |
| sixExchangeLateConcession | 7 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 21 |
| directCredit | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| directCredit | 1 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 25 |
| directCredit | 2 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 18 |
| limitedCashPurchase | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| limitedCashPurchase | 1 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 25 |
| limitedCashPurchase | 2 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 18 |
| worsenedRiskRegression | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| worsenedRiskRegression | 1 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 25 |
| worsenedRiskRegression | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-POSITIVE-final_say-EA | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| combination-POSITIVE-final_say-EA | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| combination-POSITIVE-final_say-EA | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-POSITIVE-final_say-EA | 3 | SURFACE, RATE, FEEDBACK, INTEREST, TRANSFER | 70 |
| combination-POSITIVE-final_say-EA | 4 | FEEDBACK, RATE, INTEREST, SURFACE, TRANSFER | 66 |
| combination-POSITIVE-final_say-SE | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| combination-POSITIVE-final_say-SE | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| combination-POSITIVE-final_say-SE | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-POSITIVE-final_say-SE | 3 | SURFACE, RATE, FEEDBACK, INTEREST, TRANSFER | 70 |
| combination-POSITIVE-final_say-SE | 4 | FEEDBACK, RATE, INTEREST, SURFACE, TRANSFER | 66 |
| combination-POSITIVE-plain_dealing-EA | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| combination-POSITIVE-plain_dealing-EA | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| combination-POSITIVE-plain_dealing-EA | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-POSITIVE-plain_dealing-EA | 3 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 69 |
| combination-POSITIVE-plain_dealing-EA | 4 | FEEDBACK, RATE, INTEREST, SURFACE, TRANSFER | 65 |
| combination-POSITIVE-plain_dealing-SE | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| combination-POSITIVE-plain_dealing-SE | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| combination-POSITIVE-plain_dealing-SE | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-POSITIVE-plain_dealing-SE | 3 | SURFACE, RATE, INTEREST, TRANSFER, FEEDBACK | 69 |
| combination-POSITIVE-plain_dealing-SE | 4 | FEEDBACK, RATE, INTEREST, SURFACE, TRANSFER | 65 |
| combination-POSITIVE-recognition-EA | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| combination-POSITIVE-recognition-EA | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| combination-POSITIVE-recognition-EA | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-POSITIVE-recognition-EA | 3 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 90 |
| combination-POSITIVE-recognition-EA | 4 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 101 |
| combination-POSITIVE-recognition-SE | 0 | SURFACE, INTEREST, TRANSFER, RATE | 21 |
| combination-POSITIVE-recognition-SE | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 23 |
| combination-POSITIVE-recognition-SE | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-POSITIVE-recognition-SE | 3 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 90 |
| combination-POSITIVE-recognition-SE | 4 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 101 |
| combination-NEGATIVE-final_say-EA | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| combination-NEGATIVE-final_say-EA | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-NEGATIVE-final_say-EA | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-final_say-EA | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-final_say-EA | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-NEGATIVE-final_say-EA | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| combination-NEGATIVE-final_say-EA | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
| combination-NEGATIVE-final_say-SE | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| combination-NEGATIVE-final_say-SE | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-NEGATIVE-final_say-SE | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-final_say-SE | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-final_say-SE | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-NEGATIVE-final_say-SE | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| combination-NEGATIVE-final_say-SE | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
| combination-NEGATIVE-plain_dealing-EA | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| combination-NEGATIVE-plain_dealing-EA | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-NEGATIVE-plain_dealing-EA | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-plain_dealing-EA | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-plain_dealing-EA | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-NEGATIVE-plain_dealing-EA | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| combination-NEGATIVE-plain_dealing-EA | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
| combination-NEGATIVE-plain_dealing-SE | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| combination-NEGATIVE-plain_dealing-SE | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-NEGATIVE-plain_dealing-SE | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-plain_dealing-SE | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-plain_dealing-SE | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-NEGATIVE-plain_dealing-SE | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| combination-NEGATIVE-plain_dealing-SE | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
| combination-NEGATIVE-recognition-EA | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| combination-NEGATIVE-recognition-EA | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-NEGATIVE-recognition-EA | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-recognition-EA | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-recognition-EA | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-NEGATIVE-recognition-EA | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| combination-NEGATIVE-recognition-EA | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
| combination-NEGATIVE-recognition-SE | 0 | SURFACE, INTEREST, TRANSFER, RATE | 23 |
| combination-NEGATIVE-recognition-SE | 1 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 24 |
| combination-NEGATIVE-recognition-SE | 2 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-recognition-SE | 3 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 25 |
| combination-NEGATIVE-recognition-SE | 4 | SURFACE, INTEREST, TRANSFER, RATE, FEEDBACK | 22 |
| combination-NEGATIVE-recognition-SE | 5 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 63 |
| combination-NEGATIVE-recognition-SE | 6 | SURFACE, FEEDBACK, RATE, INTEREST, TRANSFER | 71 |
