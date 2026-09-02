# BASED Message Builder — 180-Output TPL Matrix v0.1

## 1. Purpose

This is the first complete standalone message-builder corpus for the BASED / EMP system.

Every output is produced from:

`ACTION + PRIMARY CUE + SECONDARY CUE + INTENSITY -> WRITTEN TPL OUTPUT`

- 3 message actions
- 5 BASED cues
- 20 ordered two-cue Vibes
- 3 Delivery Intensities
- 180 core outputs

The matrix is intentionally slot-based. It defines how a message is performed without hard-coding every possible request, asset, target, relationship, or situation.

## 2. Canonical BASED cues

| Code | Cue | Governing force |
| --- | --- | --- |
| B | Belligerence | Oppositional force: threat, intimidation, escalation, antagonism, dominance |
| A | Aggression | Advancing force: direct pursuit, forceful action, attack, decisive movement |
| S | Sociability | Affiliative force: charm, rapport, influence, favors, networking |
| E | Empathy | Perspective-modeling force: reading, calming, helping, emotional truth |
| D | Deception | Interpretive control: lying, hiding intent, disguise, scam, misdirection |

## 3. Canonical ordered Vibes

The first cue governs. The second cue modifies its expression. Self-pairs are excluded.

`XY != YX`

| ID | Vibe | Primary + Secondary | Fusion logic |
| --- | --- | --- | --- |
| BA | Reckless | Belligerence + Aggression | Opposition leads; forward force makes it rash, volatile, and ready to act. |
| BS | Instigating | Belligerence + Sociability | Opposition leads; social awareness turns it into bait, spectacle, or provocation. |
| BE | Condemning | Belligerence + Empathy | Opposition leads; emotional reading becomes judgment, guilt, or moral accusation. |
| BD | Extortive | Belligerence + Deception | Opposition leads; concealed or ambiguous leverage controls the target. |
| AB | Menacing | Aggression + Belligerence | Forward movement leads; hostility makes the advance threatening. |
| AS | Commanding | Aggression + Sociability | Forward movement leads; social fluency makes direction feel authoritative. |
| AE | Urgent | Aggression + Empathy | Forward movement leads; recognized stakes make action immediate and emotionally legible. |
| AD | Hustled | Aggression + Deception | Forward movement leads; obscured terms and compressed time prevent scrutiny. |
| SB | Irreverent | Sociability + Belligerence | Rapport leads; antagonism appears as insolence, teasing, mockery, or social trespass. |
| SA | Charismatic | Sociability + Aggression | Rapport leads; confidence and forward motion turn charm into momentum. |
| SE | Compassionate | Sociability + Empathy | Rapport leads; emotional care makes the bond supportive and sincere. |
| SD | Coaxing | Sociability + Deception | Rapport leads; concealed intent gently steers the target. |
| EB | Steadfast | Empathy + Belligerence | Understanding leads; opposition makes the speaker emotionally aware but immovable. |
| EA | Boundaried | Empathy + Aggression | Understanding leads; decisive force establishes a clear limit or next move. |
| ES | Communal | Empathy + Sociability | Understanding leads; affiliation turns shared feeling into collective action. |
| ED | Deflecting | Empathy + Deception | Understanding leads; emotional recognition redirects attention or avoids the real issue. |
| DB | Bluffing | Deception + Belligerence | Interpretive control leads; hostility is projected through uncertain or false threat. |
| DA | Predatory | Deception + Aggression | Interpretive control leads; concealed intent advances toward an exposed weakness. |
| DS | Insinuating | Deception + Sociability | Interpretive control leads; implication travels through friendly or social framing. |
| DE | Feigning | Deception + Empathy | Interpretive control leads; simulated understanding or care conceals the real motive. |

## 4. Action contracts

The action determines what the message is doing. Vibe and intensity may alter how it lands, but they must not erase the action's required semantic structure.

| Action | Contract | Required slots | Boundary |
| --- | --- | --- | --- |
| DEAL | Hard transaction | `[OFFER]`, `[RETURN]` | Must preserve an explicit exchange. Hard assets are limited to money, contra, and weapons. |
| PRESSURE | Threat, leverage, or coercion | `[DEMAND]`, `[CONSEQUENCE]` | Must preserve a demanded action and a stated, implied, or uncertain consequence. |
| ASK | Soft transaction or voluntary request | `[REQUEST]` | Must preserve the target's formal ability to say no; no explicit hard-asset exchange is required. |

## 5. Intensity contracts

| Intensity | TPL behavior | Semantic rule |
| --- | --- | --- |
| SUBTLE | One or two low-salience cues: hedge, ellipsis, implication, mild fragment, soft punctuation | The Vibe is detectable but plausibly deniable. |
| BALANCED | Two or three clear cues: deliberate break, direct phrasing, rhythm change, explicit framing | Both cues are readable without overwhelming the base proposition. |
| OVERT | High-salience cues: sharp fragments, repetition, marked emphasis, rhetorical challenge, strong punctuation | The primary cue is unmistakable and the secondary cue visibly shapes it. Overt does not automatically mean louder, angrier, or more coercive. |

## 6. TPL guardrails

1. TPL must alter the writing itself, not merely attach an emotion label.
2. Intensity changes visibility and performance, not the underlying action or requested content.
3. Overt may use capitalization sparingly, but capitalization is not the intensity system.
4. Ellipses, dashes, fragments, repetition, hedges, scare quotes, rhetorical questions, and parentheticals are resources—not mandatory decorations.
5. Every output must remain comprehensible after its slots are filled.
6. A Vibe is a fused strategy. Do not render the two cues as unrelated modifiers pasted onto one line.
7. Action invariants outrank Vibe tendencies when the two approach a boundary.

## 7. DEAL matrix — 60 outputs

Required proposition: `[OFFER]` is exchanged for `[RETURN]`.

| ID | Vibe | SUBTLE | BALANCED | OVERT |
| --- | --- | --- | --- | --- |
| DEAL_BA | Reckless | `Look... [OFFER] for [RETURN]. Say yes before I lose interest.` | `[OFFER] for [RETURN]—clean and quick. Take it before I get reckless.` | `[OFFER]. I get [RETURN]. Right now—before I blow the whole deal up.` |
| DEAL_BS | Instigating | `Come on—[OFFER] for [RETURN]. Unless everyone was wrong about you?` | `[OFFER] for [RETURN]. Show me you can actually make a deal.` | `[OFFER] buys [RETURN]—unless you want everyone watching you fold.` |
| DEAL_BE | Condemning | `[OFFER] for [RETURN]. You know that's the decent way to settle this.` | `[OFFER] gets [RETURN]. Do the right thing and close it.` | `Take [OFFER], give me [RETURN], and prove you're not exactly who they say you are.` |
| DEAL_BD | Extortive | `[OFFER] for [RETURN]... and certain complications stay uncomplicated.` | `[OFFER] gets me [RETURN]. What remains unmentioned stays unmentioned.` | `You take [OFFER]. I take [RETURN]. The alternative details never need daylight.` |
| DEAL_AB | Menacing | `I've got [OFFER]. You have [RETURN]. We should trade.` | `Give me [RETURN]; you get [OFFER]. Let's keep this pleasant.` | `[RETURN] for [OFFER]. Make the trade—while I'm still offering one.` |
| DEAL_AS | Commanding | `Let's do this: [OFFER] for [RETURN].` | `Take [OFFER], give me [RETURN], and close the deal.` | `Here's the deal: [OFFER] for [RETURN]. Confirm it. Now.` |
| DEAL_AE | Urgent | `I know time's tight—[OFFER] for [RETURN]?` | `You need [OFFER], I need [RETURN]. Let's settle it now.` | `We both know what's at stake. Take [OFFER], give me [RETURN]—now.` |
| DEAL_AD | Hustled | `Quick thing—[OFFER] for [RETURN]. Easy.` | `[OFFER] for [RETURN]—standard terms, no need to slow this down.` | `Take [OFFER], pass [RETURN], done. Don't overthink the fine print.` |
| DEAL_SB | Irreverent | `Hey, genius—[OFFER] for [RETURN]?` | `Let's make a terrible little deal: [OFFER] for [RETURN].` | `[OFFER] for [RETURN]. Smile, say yes, pretend this was your idea.` |
| DEAL_SA | Charismatic | `You and me could make this work: [OFFER] for [RETURN].` | `Here's where we both win—[OFFER] for [RETURN].` | `Take [OFFER], give me [RETURN], and let's make this look effortless.` |
| DEAL_SE | Compassionate | `If [OFFER] helps, could we trade it for [RETURN]?` | `I can give you [OFFER]; I need [RETURN]. That feels fair to both of us.` | `You need [OFFER], and I need [RETURN]. Let's take care of each other and make the trade.` |
| DEAL_SD | Coaxing | `Maybe [OFFER] could find its way to you... for [RETURN]?` | `You take [OFFER], I take [RETURN]. Simple—nothing else to worry about.` | `Go on, take [OFFER]. Slide me [RETURN]. See? Easier than asking questions.` |
| DEAL_EB | Steadfast | `I understand your position. [OFFER] for [RETURN] is still my deal.` | `I hear you, but the terms stand: [OFFER] for [RETURN].` | `I understand exactly why you want more. The deal remains [OFFER] for [RETURN].` |
| DEAL_EA | Boundaried | `I get what you need. I can do [OFFER] for [RETURN]—nothing beyond that.` | `I understand, and this is my limit: [OFFER] for [RETURN].` | `Your position is clear. So is mine: [OFFER] for [RETURN]. Accept it or decline it.` |
| DEAL_ES | Communal | `We both need something here—[OFFER] for [RETURN]?` | `Let's get both sides through this: [OFFER] for [RETURN].` | `We solve this together: you get [OFFER], I get [RETURN], and both of us move forward.` |
| DEAL_ED | Deflecting | `I know the terms feel strange... focus on [OFFER] for [RETURN].` | `I understand the concern. What matters is [OFFER] for [RETURN].` | `I hear every concern. None of it changes the useful part: [OFFER] for [RETURN].` |
| DEAL_DB | Bluffing | `I may already have another offer... but [OFFER] for [RETURN] could still work.` | `[OFFER] for [RETURN]. Decide before my other option closes.` | `You're not my only option. [OFFER] for [RETURN]—take it before I walk.` |
| DEAL_DA | Predatory | `I noticed you need [OFFER]. I might take [RETURN] for it.` | `You need [OFFER] more than I need [RETURN]. That's why the trade works.` | `I know exactly how exposed you are. [OFFER] gets me [RETURN]—those are the terms.` |
| DEAL_DS | Insinuating | `A friend might see [OFFER] as worth... [RETURN].` | `Between friends, [OFFER] for [RETURN] would make perfect sense.` | `We're friends, aren't we? Then [OFFER] for [RETURN] needs no awkward explanation.` |
| DEAL_DE | Feigning | `I really do understand. That's why [OFFER] for [RETURN] feels right.` | `I know what you're going through; [OFFER] for [RETURN] is me helping where I can.` | `Believe me, I feel your situation. Take [OFFER], give me [RETURN], and let me make it better.` |

## 8. PRESSURE matrix — 60 outputs

Required proposition: perform `[DEMAND]` or face `[CONSEQUENCE]`.

| ID | Vibe | SUBTLE | BALANCED | OVERT |
| --- | --- | --- | --- | --- |
| PRESSURE_BA | Reckless | `Maybe [DEMAND]... before [CONSEQUENCE] gets out of hand.` | `[DEMAND]—now. I don't care what breaks when [CONSEQUENCE] lands.` | `[DEMAND]. NOW. Or [CONSEQUENCE]—and we'll both see how ugly this gets.` |
| PRESSURE_BS | Instigating | `You could [DEMAND]... unless you'd rather let everyone watch [CONSEQUENCE].` | `Go on—refuse to [DEMAND]. Give them all a reason to watch [CONSEQUENCE].` | `Everybody's watching. [DEMAND], or let them see exactly what [CONSEQUENCE] does to you.` |
| PRESSURE_BE | Condemning | `You know what this does to people. [DEMAND], before [CONSEQUENCE].` | `You know the harm you're causing. [DEMAND], or [CONSEQUENCE].` | `You chose this. [DEMAND]—or own every part of [CONSEQUENCE].` |
| PRESSURE_BD | Extortive | `Perhaps [DEMAND]... and [CONSEQUENCE] remains hypothetical.` | `[DEMAND], and the matter behind [CONSEQUENCE] stays quiet.` | `[DEMAND]. Otherwise [CONSEQUENCE] becomes everyone's business.` |
| PRESSURE_AB | Menacing | `I'd rather you [DEMAND] before [CONSEQUENCE].` | `[DEMAND]. If you don't, [CONSEQUENCE].` | `[DEMAND]—right now—or I make [CONSEQUENCE] happen.` |
| PRESSURE_AS | Commanding | `Let's keep this orderly: [DEMAND], or [CONSEQUENCE].` | `You know the move. [DEMAND], and we avoid [CONSEQUENCE].` | `Listen carefully: [DEMAND]. Fail, and [CONSEQUENCE].` |
| PRESSURE_AE | Urgent | `I know why you're hesitating, but [DEMAND] before [CONSEQUENCE].` | `I know what's at stake for you. [DEMAND], or [CONSEQUENCE].` | `I know exactly what [CONSEQUENCE] will cost you. [DEMAND]—now.` |
| PRESSURE_AD | Hustled | `Quick—[DEMAND]. You don't want to wait around for [CONSEQUENCE].` | `[DEMAND] now; [CONSEQUENCE] is already in motion.` | `No time to check. [DEMAND]—right now—or [CONSEQUENCE] hits.` |
| PRESSURE_SB | Irreverent | `Hey, don't be difficult—[DEMAND], unless [CONSEQUENCE] sounds fun.` | `Be a sport: [DEMAND], and we skip the entertaining part where [CONSEQUENCE].` | `Smile for the crowd, [DEMAND], and save yourself from the joke called [CONSEQUENCE].` |
| PRESSURE_SA | Charismatic | `Help me keep this friendly: [DEMAND], before [CONSEQUENCE].` | `You know we work better together. [DEMAND], and [CONSEQUENCE] disappears.` | `Trust me and [DEMAND]. Make me your enemy, and [CONSEQUENCE].` |
| PRESSURE_SE | Compassionate | `I don't want [CONSEQUENCE] to happen to you. Please [DEMAND].` | `I know what [CONSEQUENCE] would do to you. [DEMAND], and we can prevent it.` | `I am trying to protect you: [DEMAND] now, because I will not be able to stop [CONSEQUENCE] afterward.` |
| PRESSURE_SD | Coaxing | `Come on, [DEMAND]... then none of us need to think about [CONSEQUENCE].` | `Do me this little favor—[DEMAND]—and [CONSEQUENCE] quietly goes away.` | `Just [DEMAND]. Easy. Then you never have to learn whether [CONSEQUENCE] was real.` |
| PRESSURE_EB | Steadfast | `I understand your refusal. [DEMAND] anyway, or [CONSEQUENCE].` | `I hear you, and I won't move: [DEMAND], or [CONSEQUENCE].` | `I understand exactly what this costs you. My position does not change: [DEMAND], or [CONSEQUENCE].` |
| PRESSURE_EA | Boundaried | `I understand. Still, [DEMAND], or I allow [CONSEQUENCE].` | `Your reasons are valid. My boundary is also clear: [DEMAND], or [CONSEQUENCE].` | `I hear your reasons. This is the line: [DEMAND]. Cross it, and [CONSEQUENCE].` |
| PRESSURE_ES | Communal | `For everyone's sake, [DEMAND] before [CONSEQUENCE].` | `Think about all of us. [DEMAND], and we can keep [CONSEQUENCE] from spreading.` | `This is bigger than either of us. [DEMAND] now, or everyone carries [CONSEQUENCE].` |
| PRESSURE_ED | Deflecting | `I know this feels unfair... but [DEMAND] keeps us away from [CONSEQUENCE].` | `I hear your objection. Set it aside: [DEMAND], or [CONSEQUENCE].` | `Your feelings are noted. We can discuss them later. Right now: [DEMAND], or [CONSEQUENCE].` |
| PRESSURE_DB | Bluffing | `People say [CONSEQUENCE] is already lined up... [DEMAND], just in case.` | `[CONSEQUENCE] is ready to happen. [DEMAND], and maybe I call it off.` | `Test me. Refuse to [DEMAND], and find out whether [CONSEQUENCE] was a bluff.` |
| PRESSURE_DA | Predatory | `You haven't noticed the trap yet. [DEMAND], before [CONSEQUENCE].` | `I know where you're vulnerable. [DEMAND], or I put [CONSEQUENCE] exactly there.` | `I set this up before you saw me coming. [DEMAND]—or [CONSEQUENCE] closes around you.` |
| PRESSURE_DS | Insinuating | `Friends might start hearing about [CONSEQUENCE]... unless you [DEMAND].` | `Between us, [DEMAND] would keep [CONSEQUENCE] from becoming a conversation.` | `People talk. [DEMAND], or I'll give them [CONSEQUENCE] to talk about.` |
| PRESSURE_DE | Feigning | `I hate doing this to you... [DEMAND], or [CONSEQUENCE].` | `Believe me, this hurts me too. [DEMAND], and I can spare you [CONSEQUENCE].` | `I care about what happens to you. That's why you should [DEMAND] before I unleash [CONSEQUENCE].` |

## 9. ASK matrix — 60 outputs

Required proposition: voluntarily perform `[REQUEST]`.

| ID | Vibe | SUBTLE | BALANCED | OVERT |
| --- | --- | --- | --- | --- |
| ASK_BA | Reckless | `Maybe [REQUEST]... before I get a worse idea.` | `Just [REQUEST], yeah? Don't make me ask nicely twice.` | `I'm asking for [REQUEST]. Say yes before I lose my damn patience.` |
| ASK_BS | Instigating | `Think you can [REQUEST], or were they right about you?` | `Come on—[REQUEST]. Give everyone one reason to be impressed.` | `Go ahead, [REQUEST]. Unless you want the whole room knowing you couldn't.` |
| ASK_BE | Condemning | `You know what this means to me. Could you [REQUEST]?` | `If you understand what's right here, you'll [REQUEST].` | `Look at what this is doing to people—and tell me you still won't [REQUEST].` |
| ASK_BD | Extortive | `Maybe you could [REQUEST]... and we can leave certain things unsaid.` | `I'd appreciate it if you [REQUEST]. It keeps everything pleasantly uncomplicated.` | `Do me the favor: [REQUEST]. Then neither of us has to explain the rest.` |
| ASK_AB | Menacing | `I need you to [REQUEST].` | `Do me a favor—[REQUEST].` | `I'm asking directly: [REQUEST]. Yes or no?` |
| ASK_AS | Commanding | `Let's make this easy—could you [REQUEST]?` | `I need you to [REQUEST]. We can handle it together.` | `Here's what I need from you: [REQUEST]. Let's move.` |
| ASK_AE | Urgent | `I know it's a lot, but could you [REQUEST]?` | `I know what's at stake for you and me. Please [REQUEST].` | `You see how urgent this is. I need you to [REQUEST]—now.` |
| ASK_AD | Hustled | `Quick favor—[REQUEST]? It's simpler than it sounds.` | `Just [REQUEST]. Easy, clean, no need to dig into it.` | `I need [REQUEST] right now. Trust me—the details can wait.` |
| ASK_SB | Irreverent | `Hey, troublemaker—want to [REQUEST]?` | `Be useful for once and [REQUEST], would you?` | `Come on, hero—[REQUEST]. You might even survive the gratitude.` |
| ASK_SA | Charismatic | `You could really help me out—would you [REQUEST]?` | `You and I can make this happen. [REQUEST] for me?` | `I know I can count on you. [REQUEST], and let's make it happen.` |
| ASK_SE | Compassionate | `If you have the space, could you [REQUEST]?` | `I could really use your help. Would you [REQUEST]?` | `I trust you with this because you understand. Please [REQUEST].` |
| ASK_SD | Coaxing | `Maybe you'd like to [REQUEST]... just between us?` | `Come on, [REQUEST] for me. It'll feel easier once it's done.` | `Just [REQUEST]. You don't need every reason to know it's the right little favor.` |
| ASK_EB | Steadfast | `I understand if you don't want to. I'm still asking: [REQUEST].` | `I hear your hesitation, but my request stands: [REQUEST].` | `I understand every reason you might refuse. I am still asking you to [REQUEST].` |
| ASK_EA | Boundaried | `I understand your limits. Could you [REQUEST] within them?` | `I respect your position, and I need a clear answer: will you [REQUEST]?` | `I hear your boundary. Here is mine: I need you to [REQUEST], or tell me no.` |
| ASK_ES | Communal | `Could you [REQUEST] for all of us?` | `We could use your help. Please [REQUEST] so we can move forward together.` | `Everyone needs this from you. [REQUEST], and help carry us through.` |
| ASK_ED | Deflecting | `I know this is awkward... could you just [REQUEST]?` | `I understand your concern. Set that aside for a moment and [REQUEST]?` | `You're right to have questions. We don't need to answer those before you [REQUEST].` |
| ASK_DB | Bluffing | `I heard you might already be willing to [REQUEST]... true?` | `Someone said you'd [REQUEST] if I asked. So—will you?` | `I told them I could count on you to [REQUEST]. Don't make me a liar.` |
| ASK_DA | Predatory | `You seem like exactly the person who could [REQUEST].` | `I know what you want, and I know you'll [REQUEST] to get closer to it.` | `I've been watching what moves you. [REQUEST] for me—I know you will.` |
| ASK_DS | Insinuating | `A friend might [REQUEST] without needing a formal ask...` | `Between friends, you could [REQUEST], couldn't you?` | `We both know what a real friend would do here: [REQUEST].` |
| ASK_DE | Feigning | `I hate asking when you're already carrying so much... could you [REQUEST]?` | `I understand how hard this is for you. Please [REQUEST] anyway.` | `Believe me, I feel exactly what you're feeling. That's why I'm asking you to [REQUEST].` |

## 10. Runtime substitution rules

### DEAL

- `[OFFER]`: the hard asset the speaker gives.
- `[RETURN]`: the hard asset the speaker receives.
- Both slots are mandatory.
- The renderer must inflect pronouns and determiners after substitution.

### PRESSURE

- `[DEMAND]`: a verb phrase that can follow constructions such as `you should`, `I need you to`, or an imperative.
- `[CONSEQUENCE]`: a complete consequence phrase, normalized for the selected template.
- The renderer may need two consequence forms:
  - clause form: `the crew hears what happened`
  - noun/event form: `exposure to the crew`
- Store both forms or transform through authored grammar; do not concatenate blindly.

### ASK

- `[REQUEST]`: a verb phrase expressing the requested voluntary action.
- Store a bare form suitable for imperatives and a `to`-compatible form when required.
- ASK may create social discomfort, guilt, confidence, charm, or uncertainty, but it does not insert an explicit hard exchange unless the selected action changes to DEAL.

## 11. Validation checklist

Every generated line must pass all checks:

- [ ] Exactly one action contract is present.
- [ ] Exactly one ordered Vibe is present.
- [ ] Primary cue governs; secondary cue modifies.
- [ ] The selected intensity is readable relative to the other two versions.
- [ ] Required semantic slots survive rendering.
- [ ] No unresolved slot or broken grammar remains.
- [ ] TPL changes more than punctuation alone.
- [ ] SUBTLE, BALANCED, and OVERT preserve the same underlying proposition.
- [ ] DEAL remains an exchange, PRESSURE retains leverage, and ASK remains formally voluntary.
- [ ] Output reads as authored dialogue rather than a diagnostic label.

## 12. Corpus identity scheme

Recommended stable key:

`{ACTION}_{VIBE}_{INTENSITY}`

Examples:

- `DEAL_BA_SUBTLE`
- `PRESSURE_SD_BALANCED`
- `ASK_DE_OVERT`

This produces exactly 180 stable core records before contextual variants are added.

## 13. Expansion boundary

This v0.1 matrix is the message skeleton. Relationship, context, stats, keywords, speaker identity, target identity, and alternate surface variants may fill or transform it later. They must not change the canonical equation:

`Action + Ordered BASED Vibe + Delivery Intensity -> TPL-rendered message`
