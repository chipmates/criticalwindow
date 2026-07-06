# Contributing

There are two ways in, and the one without code matters at least as much.

## The non-code path

**Check a source.** Every number in the game cites an entry in `data/sources.json`. Sources rot, papers get revised, better data appears. Open an issue titled `source: ...` with what you found. This is the single most useful small contribution.

**Challenge a number.** [docs/EVIDENCE.md](docs/EVIDENCE.md) lists every cited value and its evidence. If you think one is wrong, open a "challenge a number" issue with a better source and your proposed value. Disagreement with evidence attached is the project working as designed.

**Wire a source to a mechanic.** SOURCES.md keeps an honest ledger: some sources back numbers, some shaped the design, some are just the shelf. Promoting a shelf source into one that backs an actual value, with the figure quoted, is a small PR with real weight.

**Propose an event card.** Events are JSON files in `data/events/`. Copy an existing one, keep its shape (your editor gets autocomplete from the `$schema` line), and follow the house dilemma rule: no obviously right choice, every option should hurt someone credible, and at least one cost should arrive later than the benefit. Real events with real sources make the best cards. You do not need to get the JSON perfect. A clearly written issue describing the event, the choices, and the sources is a fine contribution on its own.

**Playtest.** Print the kit (`pnpm print-kit` or grab the PDF from a release), play it with people, and file what happened. What confused them, what they argued about, whether they wanted to go again. An issue labeled `playtest` with honest notes is gold.

**Later: translations.** The game is built for it (all text lives in `data/strings/`), but translation opens at Phase 4 when the text stabilizes. Do not translate yet, it would churn.

**Writing style for anything players read:** short sentences, plain words, no em dashes. Serious about the stakes, dry about the absurdity. If it sounds like a press release, rewrite it.

## The code path

```
pnpm install
pnpm dev
pnpm test && pnpm validate && pnpm lint && pnpm typecheck
```

All four must pass. CI runs the same chain.

**The engine is pure.** `src/engine/` is a deterministic fold: `step(state, action, rng)`. No `Math.random`, no `Date`, no fetch, no storage, no transcendental `Math` functions (their results differ across JS engines and would break replays). Lint enforces every one of these. If your change fights the lint, the design needs to change, not the lint.

**Everything is data.** If you are hardcoding a number or a string in the engine or UI, stop: numbers belong in `data/` with a source, text belongs in `data/strings/`.

**Determinism is a feature with tests.** Same seed means the same run on every machine. If your change breaks a golden fixture, that is a real regression, not a flaky test.

## The iron rule (applies to everyone)

A change to any value in `data/` names its source ID in the commit body or the PR description. `pnpm validate` enforces the reference exists. Values without sources do not ship, and "it felt right" is not a source. Balance changes count: cite the playtest report.

## Sign your commits (DCO, not CLA)

Every commit needs a sign-off line:

```
git commit -s
```

That adds `Signed-off-by: you <your@email>`, which certifies you have the right to contribute the change ([Developer Certificate of Origin](https://developercertificate.org/)). There is no CLA. You keep your copyright. We will never relicense your work out from under you: code stays AGPL-3.0, content stays CC BY-SA 4.0.

## What happens to your contribution

Small fixes: quick review, merge. Cards and content: a maintainer checks sources and the dilemma rule, then it enters playtest rotation. Realism disputes go to the advisory board once it exists (see GOVERNANCE.md). We aim to respond within two days, kindly. Contributors land in the in-game credits.
