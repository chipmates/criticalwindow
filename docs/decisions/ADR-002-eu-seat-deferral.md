# ADR-002: Defer the EU playable seat; keep Europe as a force

Status: **ACCEPTED 2026-07-04.** Decided under explicit project-lead delegation of this call
(2026-07-04); the project lead's stated lean matched. Veto remains open until v0.2 ships.
Supersedes parts of ADR-001 (#8 seats, #18 MVP path) and reframes how takeaway #5 is delivered.
Context: v0.2 direction set by the project lead after the first human playtest of v0.1.

## Context

v0.1 shipped a single US seat. The first play surfaced two things: the game needs more felt
tension, and the most-wanted variety is a second great seat, not a third partial one. The v0.2
direction pulls the US-versus-China hotseat forward as the headline and drops the EU playable
seat from the near roadmap, on two grounds: it is the biggest content lift of the three seats,
and a third asymmetric seat multiplies the balance surface (bot-vs-bot grids) at exactly the
moment we are trying to prove the two-seat loop is fun.

This collides with three founding commitments:

- ADR-001 #8: "US, China, EU playable."
- ADR-001 #18: 1.0 is the "Europe Update."
- Takeaway #5: middle powers (Europe) have real leverage and a closing window, and societal
  stability is a resource leaders can bankrupt.

We do not want to quietly break those. This ADR makes the change explicit and, crucially,
keeps takeaway #5 alive by another route.

## Decision

1. **The EU playable seat is deferred** from the near roadmap. Earliest reconsideration is v3,
   and it may never ship as a seat. The trigger for reconsidering is evidence, not a date
   (see Re-evaluation).

2. **Europe stays on the board as a FORCE, not a seat.** Both players (US and China) feel
   Europe through:
   - The EU AI Act as a real-dated fixed beat (bans Feb 2025, GPAI Aug 2025, bulk Aug 2026,
     high-risk Aug 2027; source SRC-EU-AI-ACT-TIMELINE).
   - An ASML / export-control wildcard that hits both players' compute (the chokepoint both
     giants must court).
   - Ticker presence and a debrief paragraph.
   - Classroom framing ("you are not playing Europe, but Europe is acting on you").

3. **ADR-001 is amended:**
   - #8 now reads: US and China playable; the EU is modeled as a force (beats, wildcards,
     ticker, debrief, classroom kit), not a playable seat, until re-evaluated.
   - #18 now reads: the 1.0 headline is the two-seat hotseat plus the incident system, not the
     "Europe Update." The "Europe Update" name is retired unless the EU seat is reinstated.

4. **Takeaway #5 is delivered via Europe-as-force plus the societal-stability half of the
   takeaway** (jobs, trust, unrest are already core mechanics and carry the "stability is a
   resource you can bankrupt" lesson regardless of seat).

## Consequences

Positive: a tractable balance surface (two seats, not three), the hotseat lands sooner, and the
event/wildcard layer that carries Europe-as-force is content we want anyway.

Negative: takeaway #5 loses its most visceral delivery, actually playing Europe with different
win conditions (sovereignty, prosperity, values, not "win the race"). Europe-as-force is a
weaker teacher of "middle powers have leverage" than a seat would be. We accept this risk
deliberately and measure it.

Neutral: the engine keeps `eu` in `SeatId` (ADR-001 left the field in place); deferral is a
content-and-roadmap decision, not an engine deletion. Reinstating the seat later is additive.

## Re-evaluation trigger

After v0.2 ships and playtests run, check the debriefs: do players name takeaway #5 (middle-power
leverage / closing window) without an EU seat? If a healthy share do, Europe-as-force is
sufficient and the seat stays deferred. If they do not, the EU seat returns to the roadmap as the
fix. This is the honest test of whether the seat was load-bearing for the lesson or just for
completeness.

## Sign-off

- [x] Accepted 2026-07-04 under the project lead's explicit delegation of this decision; his
      stated gut (postpone) matched the technical assessment. Grounds: two-seat balance surface
      is tractable where three is not; the wave-1 event/wildcard layer already carries
      Europe-as-force (AI Act beats, ASML wildcard); the re-evaluation trigger below measures
      what the deferral costs. ADR-001 #8/#18 read as amended above. Project-lead veto stays
      open until v0.2 ships.
