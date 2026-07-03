# Governance

Small and explicit, sized for the project we are, revisited when we outgrow it.

## Who decides what

**The core team decides.** Right now the core team is the founding maintainer. Decisions
about scope, design, releases, and moderation rest there. As regular contributors emerge,
core membership grows by invitation of the existing core, and this file records each change.

**The advisory board arbitrates realism.** Being formed during the public alpha: five to
eight researchers and practitioners across the worldview spectrum, named publicly in this
file when they join. When contributors disagree about what is realistic (a parameter range,
a rival behavior, an event's plausibility) and sources alone do not settle it, the board's
reading wins. The board advises on realism. It does not run the project.

**Players decide with their feet.** Gates in ROADMAP.md are measured against real behavior,
not against our opinions of our own work.

## The iron rule

Every value in `data/` cites a source in `data/sources.json`. `pnpm validate` enforces the
citation exists, in CI, on every change. Disputes about values are argued with sources, and
better sources win. The hierarchy, roughly: peer-reviewed work and primary datasets, then
institutional reports, then expert surveys and forecasts, then reasoned essays, each judged
on recency and relevance. Design constants with no empirical referent (turn counts, starting
defaults) cite the design documents and say so plainly.

## Worldview neutrality, by architecture instead of promise

The game does not claim neutrality. It offers three worldview presets (cautious, consensus,
skeptic), each with sourced parameter ranges, and hidden dice roll inside whichever you
choose. Attacks on the game's politics are answered by pointing at the presets and their
sources. If one side of the debate finds a preset misrepresents them, the fix is a better
sourced range, and we want that issue filed.

## Licensing and the name

Code is AGPL-3.0, content is CC BY-SA 4.0, contributions are certified by DCO sign-off,
and contributors keep their copyright. The project name and mark will be trademarked: the
code is free to fork and always will be, but a fork that rewrites the numbers to push a
narrative does not get to wear our name while doing it.

## Moderation

The Code of Conduct applies in every project space. The core team enforces it. Kind and
direct beats polite and vague.
