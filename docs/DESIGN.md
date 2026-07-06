# Critical Window: the design constitution

_What this game is trying to do, and the rules we hold ourselves to while building it. The project began as a complete written brief, drafted 2026-07-03 under the working title Race Conditions. This document is its living public form: the founding decisions are recorded in [`decisions/ADR-001-founding-decisions.md`](decisions/ADR-001-founding-decisions.md), the founding source list grew into [`SOURCES.md`](../SOURCES.md), and design constants in the game data cite this constitution as `SRC-DESIGN-HANDOVER`._

## 1. What this is

A nonprofit education project. No revenue, no ads, no tracking, ever. Fully open source, and you do not need to write code to contribute.

The game is a strategy simulation of the AI race. You take a seat, the United States or China, solo or hotseat on one device, from 2026 through the critical window around 2030. You win, lose, or discover that winning was the wrong frame.

Why it exists: most people meet the AI race through headlines, and headlines do not teach how traps work. Intelligence Rising, the facilitated academic wargame, proves the pedagogy at the scale of hundreds of players a year (SRC-AI-FUTURES-ROLEPLAY, SRC-SIM-GAMING-INSIGHTS); this project is the attempt to ship the scalable public version. Plague Inc and AI 2027 suggest the reach is there for the taking.

Audience, in order: the curious internet public and light strategy gamers; classrooms 16 to 25, whose constraints (Chromebooks, 40-minute sessions, no accounts) shape the tech; policy workshops.

## 2. The five takeaways

Every mechanic serves at least one of these. If a mechanic serves none, it gets cut. The takeaways are claims about the world, so each cites its evidence; the IDs resolve in [`SOURCES.md`](../SOURCES.md).

1. **Race dynamics are a trap.** Individually rational moves, collectively catastrophic outcomes, even when everyone is decent. (SRC-RACING-PRECIPICE, SRC-SIM-GAMING-INSIGHTS)
2. **Alignment cannot be verified directly.** You govern under irreducible uncertainty. Eval scores are not truth. (SRC-SLEEPER, SRC-SCHEMING, SRC-ALIGNMENT-FAKING)
3. **AI has a physical body.** Chips, fabs, energy. Chokepoints are leverage. (SRC-CHIP-WAR, SRC-CSIS-EXPORT, SRC-IEA-ENERGY-AI)
4. **Neither racing nor pausing is automatically winning.** Every path has costs. Cooperation is hard but possible. (SRC-MAIM, SRC-HO-INTL-INSTITUTIONS, SRC-PUTNAM-TWO-LEVEL)
5. **Middle powers have real leverage and a closing window,** and societal stability is a resource leaders can bankrupt. (SRC-DRAGHI-REPORT, SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT)

## 3. Operating principles

1. **Fun first, about 70/30.** The lesson lives in mechanics, because games persuade through their rules, not through lectures (SRC-BOGOST-PERSUASIVE-GAMES). Explicit education (debrief, sources, teacher kit) surrounds the loop and never interrupts it.
2. **Transparency over neutrality.** Worldview presets set honest parameter ranges, hidden dice roll within them, every number cites a source. We do not claim to know how hard alignment is; we make you pick a worldview and live with it.
3. **Zero recurring costs.** Static hosting, no backend, no accounts, all assets baked at build time.
4. **Everything is data.** Rules, events, parameters and strings live in JSON. Non-coders contribute content.
5. **Privacy by design.** No tracking, no accounts, localStorage only. School-safe by default, and the claim is inspectable in this repository.
6. **Deterministic, seeded simulation.** Same seed, same run, on every machine. Shareable runs, reproducible bugs, testable balance.
7. **Open source.** Code AGPL-3.0, content CC BY-SA 4.0, DCO not CLA, the name trademarked so forks stay honest.
8. **The iron rule.** Every parameter change cites a source ID, and the build fails otherwise. This rule is the project's credibility.

## 4. How a turn works

One turn is one quarter. You read the briefing (advisor summaries plus a satirical news ticker), split the quarter's research capacity between capability, safety and diffusion, play policy cards from a rotating hand, and answer the memos the world sends you: dilemmas with no clean option, where at least one cost arrives later than the benefit. Then the world moves: the rival acts, society updates, your eval report renders with its uncertainty band, and the election clock ticks.

## 5. The signature mechanic: governing under uncertainty

Two dice are sealed per run before turn one: how hard alignment actually is, and how fast capability compounds once it starts feeding itself. Both are rolled inside the ranges set by the worldview preset you chose (cautious, consensus, skeptic), each range cited to the sources that argue for it. The presets exist because expert estimates genuinely diverge and stay diverged (SRC-XPT, SRC-GRACE-SURVEY); pretending otherwise would be a worldview smuggled in as a fact.

You never see the dice. You see eval reports with an uncertainty band. Investing in safety insight narrows the band, never to zero, and a deceptively aligned system can read better than it is; that behavior is grounded in the deception literature the parameters cite (SRC-SLEEPER, SRC-AGENTIC-MISALIGNMENT). Every deployment and racing decision is made under that uncertainty. Takeaway 2 is felt, not stated.

## 6. Seats and the rival

The United States and China are both playable, solo or hotseat. The seats are asymmetric where reality is: compute lead and open-society leaks on one side, state coordination, energy abundance and chokepoint pain with a substitution path on the other. When you play solo, the other seat runs on recorded scripted behavior with three postures (race, mirror, cautious) that respond to how you play. The rival is not evil. It has its own trust meter and its own domestic pressures.

Europe appears as a force in the world (regulatory beats, the ASML chokepoint) but is not yet a playable seat; that decision and its reasoning are recorded in [`decisions/ADR-002-eu-seat-deferral.md`](decisions/ADR-002-eu-seat-deferral.md).

## 7. Endings

Five endings, plus a sixth planned. Flourishing, where aligned transformative AI arrives and the benefits actually diffuse, is genuinely reachable and deliberately rare on a first run. Misaligned catastrophe, where somebody raced past the uncertainty band and lost the gamble. Outpaced. Negotiated slowdown, a verified treaty, slower and politically expensive. Societal breakdown, where trust and jobs collapsed before AI resolved anything. The sixth is a hidden ending about losing without noticing; its groundwork already accrues quietly during play, its evidence base is cited in the registry, and it ships once it can be discovered properly rather than announced.

Doom fatigue produces fatalism, which is the opposite of the mission. The good endings are earned, not promised.

## 8. The debrief

The education lands after the run ends, which is where the learning-science evidence says it works (SRC-WOUTERS-2013): what happened, which takeaways surfaced, counterfactual hints ("the treaty window was open on turn 12"), the truth chart showing what your evals said each quarter against what was actually true, every final number translated back to its real-world anchor, and the sources one click away. It closes with a provocation: what did this game get wrong? That question is the contributor funnel, and the project's north-star metric is completed debriefs.

## 9. Where the numbers come from

Every number in the game data cites a source, the rule is machine-enforced in both directions, and [`EVIDENCE.md`](EVIDENCE.md) lists every cited value with its evidence and derivation. Numbers come in three kinds, labeled: measured (empirical evidence), forecast-based or analysis-based (somebody's argument, with the most contested dials living as preset ranges), and design choices, which cite this constitution and claim nothing about the world. Disagree with a value? Open a challenge-a-number issue with a source; that is the invitation, not a nuisance.

## 10. How decisions get made

The core team decides; realism disputes are decided by the maintainer in public issues today, with reviewers to be named in GOVERNANCE.md if the project earns them; every significant decision lands in [`decisions/`](decisions/) as a numbered record. See [`GOVERNANCE.md`](../GOVERNANCE.md). The roadmap runs on gates, not dates: [`ROADMAP.md`](../ROADMAP.md).
