# Roadmap

## What we are building

Critical Window is an open source strategy game about the AI race. You lead the United States or China through the critical years, starting in 2026. You decide how fast to push, how much to spend on safety you cannot verify, and what to tell the public. Your rival decides too. Nobody can see the whole truth, and that is the point.

The project is nonprofit. No ads, no tracking, no accounts, ever. Code is AGPL-3.0, content is CC BY-SA 4.0, and every number in the game cites a source you can check.

## How we work

Gates, not dates. A phase ships when its gate passes, not when a calendar says it should. Fun comes first: the lesson lives in the mechanics, and the education around the game (debrief, sources, teacher kit) never interrupts play.

## Phases

### Phase 0: Foundation. Done

The repo you are looking at. Licenses, governance, the source registry, contribution paths for coders and non-coders.

### Phase 1: Paper Proof. Done

A print-and-play kit generated from the same data files the digital game uses. It still regenerates with every content change: `pnpm print-kit`.

### Phase 2: Prototype. Built, gate in measurement

The game in your browser: both the US and China seats, hotseat on one device, hidden alignment dice, eval reports that flatter you exactly when it matters, a society with its own clock, five endings, voice narration, and a debrief that opens the sealed envelope and shows what your run argued. Balance was tuned by an adversarial campaign of several hundred model-played games; its methods, its ending distributions, and the three times it caught its own instruments lying are documented in [docs/BALANCE.md](docs/BALANCE.md). But this phase's gate is human by definition (15-minute median sessions, unprompted replays, takeaways named unaided), models cannot feel whether losing is fun, and we do not mark our own gates passed. It gets measured with real players during the alpha, and this line changes when it does.

### Phase 3: Public Alpha. You are here

The first real launch. In rough order: the hosted game at criticalwindow.org, real players through the Phase 2 human gate, balance shaped by people instead of proxies, more events for replay depth, art beyond the stamp glyphs (with every prompt and decision published), and an itch.io satellite page that points home.
**Gate:** a thousand organic plays and five outside contributors.

### Phase 4: 1.0

Classroom kit with hotseat tournaments and printable debrief worksheets, at least three languages, a proper teacher's guide, captions and a screen-reader narrative mode (the voice files already ship with word timestamps, so this is finishing, not starting).

A playable EU seat is deferred, not promised: [ADR-002](docs/decisions/ADR-002-eu-seat-deferral.md) records the decision and what would reverse it. Europe stays in the game as a force (the AI Act beats, the ASML chokepoint) either way.

Because the engine is a deterministic fold and every save is a tiny action log, three features cost us almost nothing that would cost other games a server: what-if forking from the debrief (replay from turn 9, choose differently), a replay theater (any run shareable as a link, stepped through with the truth chart growing), and async two-player by link, correspondence-chess style, no server ever. These land across Phases 3 and 4 as they mature.
**Gate:** steady play, ten classrooms using it, press coverage.

### Phase 5: Flywheel

Annual scenario refresh so the game stays current. Mod support, since everything is already data. Research partnerships. Ideas we are watching, promised to nobody: a seeded temperament for the rival so no recipe survives contact, a worldview sandbox where players set the dice ranges themselves with cited sources, and a three-seat coalition mode, because the real coordination problem was never bilateral.
**Gate:** at least 30% of new content comes from the community.

## How to help

You do not need to code. Cards, parameters, and all game text live in JSON files anyone can edit, and every change needs a source, which means researchers and careful readers are as valuable as programmers. Sources need checking. Playtesting matters most of all. Translations open at Phase 4, when the text stops moving. See [CONTRIBUTING.md](CONTRIBUTING.md) for both paths.

## How we measure success

We do not track players. No analytics, no beacons, nothing, and you can verify that in the code. So we only count what people give us freely: debrief feedback (the challenge loop and email), shared seeds, issues and pull requests, and aggregate request counts from our hosting provider, which involve no code running on your device. Our north star is completed debriefs, reported voluntarily. If those numbers look small, they are at least real.
