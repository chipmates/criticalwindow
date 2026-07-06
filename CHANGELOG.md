# Changelog

All notable changes to Critical Window, in the format of
[Keep a Changelog](https://keepachangelog.com/). Newest first.

This file was written after the fact, reconstructed from the git history rather than kept
turn by turn. That is why the early entries bundle a lot into one release and the later
ones get more specific. It will stay current from here on.

## [0.3.5] · 2026-07-06

The launch version, and the first one with an outside name in it.

- First community contribution merged: remaining UI text moved onto the strings map, thanks to Aayush Tiwari picking up a good-first-issue within hours of the repo going public
- The in-game rulebook now matches the engine exactly: trust erosion under unrest was described with a threshold the code never had
- The deploy script is in the repo, so the last step between the code and the site is as inspectable as the rest, and a link checker backs the registry's verification claim
- The design constitution gained a constants appendix: the table those 85 design citations resolve to
- Balance documentation points at the CI invariants that guard the thesis, instead of claiming none exist
- Commit timestamps are batch-normalized before publishing; now the governance doc says so before anyone has to ask
- The maintainer has a name in GOVERNANCE.md, not just in the imprint
- security.txt, a wider landing-page count guard, METR's figure quoted as printed, and the founding decision record annotated where later decisions amended it

## [0.3.4] · 2026-07-06

The checkability release: everything a skeptic checks first now checks out.

- Every commit hash cited in the balance history resolves on the published branch, and the deploy script refuses hashes that do not
- The evidence map's worked example quotes the same METR figure as its table
- Pedagogy research reclassified from design to the class its claims deserve; two umbrella registry entries dissolved (162 entries now)
- The cautious preset says on its card that it is hard mode; the title screen says most terms end badly
- Roadmap gates restated in currency the project can actually count
- The sixth ending keeps its mystery: theme description removed from public docs
- House typography rule documents its own rationale in the validator
- Narration licensing scoped to what the terms actually grant

## [0.3.3] · 2026-07-06

Precision and provenance.

- Evidence vocabulary now claims exactly what is true: empirically anchored, game-calibrated, design constant
- The capability pacing note carries METR's published figures verbatim (196.5-day P50 all-time, 130.8 post-2023)
- Every build ships version.json; a deploy only counts once the live domain serves the deployed commit
- Anchor rung placements and eval-band constants co-cite the design constitution they always embodied
- Compute reads against a fixed 2026 baseline so grown shares stay arithmetically honest
- A public FAQ answers the questions people actually ask
- Interface icons move from emoji to inlined Phosphor SVGs
- Loading state, session-length promise, and a first-turn description before any JavaScript runs

## [0.3.2] · 2026-07-06

Refinement pass after the first public day.

- Sharper evidence language everywhere: the pitch now says plainly that numbers are source-backed or labeled design choices, tuned values wear the design-tuned badge, and the evidence map opens with worked examples from source figure to game value
- The capability pacing note now cites METR's Time Horizon 1.1 update directly
- Release identity checked in CI: package version, citation file, changelog and pinned links must agree
- Quick-start path on setup: one click into a recommended first run
- Build provenance: the Sources screen shows the commit and data hash of the running build
- Feedback without an account: the debrief offers email alongside the challenge loop
- Registry notes polished for outside readers

## [0.3.1] · 2026-07-06

Launch-review fixes: small, unglamorous, all correctness or performance, no new features.

### Fixed

- Corrected the source-registry counts quoted in the docs so they match the registry
  itself, and separated sources that back real-world numbers from citations of the
  project's own design constitution, so the two are never added together again.
- Added the live game link now that it is actually hosted somewhere, plus a mirror.
- Added a contact email so a reader has somewhere to send a report.
- Brought the roadmap and the decision records back in sync with each other, and trimmed
  internal-sounding language out of a decision record's sign-off.
- Hardened the evidence map against a couple of edge cases the review pass found.
- Fixed the news ticker running off the edge of the screen on narrow phones instead of
  wrapping.

### Changed

- Split the app bundle so the title screen, setup, and the game itself load first. The
  debrief, prologue, help, and source browser now load lazily instead of shipping on
  every visit.
- Put the generated voice files on a diet: dropped a redundant duplicate set, widened
  what the offline cache is allowed to hold so the files that remain actually get cached.

## [0.3.0] · 2026-07-06 · Public alpha

The first release meant for outside readers, not just us.

### Added

- Evidence map: every cited value in the game data listed with its source, what kind of
  claim it is (measured, forecast-based, or a design choice), and how the evidence turned
  into a number. Browsable in two clicks from the title screen.
- A second, opposite direction for the iron rule: a source that claims to back a value
  without actually being cited anywhere now fails the build too, not only the reverse.
- Debrief screen moved onto the strings map, so the closing report is ready for future languages and it is
  set to.
- A design constitution (`docs/DESIGN.md`) as the project's living public reference,
  replacing the original founding brief in that role.

### Changed

- Retired thirteen parameters the engine no longer reads, so the data files describe only
  what actually runs.
- Every cited source link re-verified, and added a capability-trend anchor from an AI
  safety institute's own published evaluations.
- The README's playthrough GIF now comes from a real seeded run instead of a staged one.
- Documentation now claims exactly what the worldview preset system does, and nothing
  more.
- Dark theme is the default now, matching the brand.

### Fixed

- A round of findings from an adversarial documentation review: places where the docs
  overclaimed, underclaimed, or just drifted from what the code does.

## [0.2.0] · 2026-07-04 · Two seats, events, and incidents

The biggest single day of work so far. Grouped here as one release because that is how it
shipped: dozens of commits, one continuous push.

### Added

- Second playable seat: China, with its own asymmetric resources, its own postures, and a
  chip chokepoint with a real substitution path instead of a dead stop.
- Hotseat mode: two people, one device, one shared world, two private screens of doubt.
- The full event layer: memos, incidents, and wildcards as three distinct kinds, plus a
  capability ladder with milestone accelerations at high capability.
- Incident overlays, progressive disclosure in the UI, and a forced-pause mechanic after a
  bad incident.
- Cabinet mandates and a prologue tutorial.
- Full voice narration (39 surfaces, two cast voices), generated at build time, off by
  default, nothing calling a server while you play.
- A music bed, credited where it plays.
- A real landing screen, a share card, dozens of new event and policy memos across both
  seats' desks, and a source registry you can browse in-game.
- Real-world anchors attached to the game's major numbers.
- A model-playtest harness: a scripted or LLM policy can play full runs through the real
  engine for balance discovery. Needs an API key at tooling time only, never shipped,
  never called while a person is playing.
- The project's public name locked to Critical Window, applied everywhere a working title
  had been a placeholder.

### Changed

- Crossing the capability threshold rebalanced to be dangerous again: random and even
  deliberately balanced play were reaching the best ending far too often. Two tuning
  changes fixed it, and incidental treaties stopped forming as a side effect of ordinary
  play.
- The negotiated-slowdown treaty rebalanced twice more on top of that: both seats now have
  to signal, the trust bar moved higher, and both governments have to spend real political
  capital to ratify, so the treaty can't be banked for free.
- The playtest harness now drives the non-model seat with the exact scripted policy that
  ships in the real game, after an earlier version of the harness measured a defect that
  turned out to be its own bug, not the game's.

See [`docs/BALANCE.md`](docs/BALANCE.md) for the full story behind these changes, commit
by commit.

### Fixed

- Four confirmed UI bugs from an internal review pass.
- The mobile landing page no longer scrolls sideways.
- Playtest result files now record whichever seat was actually played, not always the
  same one.

## [0.1.1] · 2026-07-03 · Help and previews

### Added

- An in-game help screen: every resource track explained in three short lines, and the
  conditions for all five endings stated plainly instead of left for players to guess.
- Live previews on the allocation screen, so a split shows its capability, safety, and
  income yield before you commit to it.

### Changed

- Alignment is now something a run earns rather than starts with. True alignment used to
  start high enough that an easy world could reach the best ending with no safety spending
  at all. It now starts low and only safety investment raises it, while heavy capability
  spending cuts it.
- The displacement curve now rises from turn one instead of dipping early, so job losses
  are felt from the start of a run as intended.

### Fixed

- The audio-generation tool reads its API key from the environment only, never from a
  file that could end up committed.

## [0.1.0] · 2026-07-03 · First playable

The first version anyone could sit down and finish a run of, start to end.

### Added

- A deterministic game engine (a pure step function, seeded RNG, exact math) that plays a
  full run from title screen to ending.
- Five endings: flourishing, misaligned catastrophe, outpaced, negotiated slowdown, and
  societal breakdown.
- The first full content set: an event deck, a policy deck, and the situation-room UI
  (allocation, policy cards, event memos, quarterly report).
- Saves, replays, and share codes, all built on the same action log the engine already
  keeps.
- An installable, offline-capable PWA build, about 150KB gzipped.
- A sound layer, off by default, and accessibility gates running in CI.
- A print-and-play paper kit generated from the same data files as the digital game.
- A headless balance harness (`pnpm simulate`) reporting ending distributions across
  worldview presets and scripted bots.
- The first pass of the source registry, plus governance, contributing, and roadmap
  documents.

### Changed

- Parameters calibrated against fetched real-world anchors, with the source-citation rule
  enforced strictly from day one.
