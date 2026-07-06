# Governance

Small and explicit, sized for the project we are, revisited when we outgrow it.

Critical Window is a project of ChipMates gemeinnuetzige GmbH, a German nonprofit.
No revenue, no ads, no investors. If the project ever takes grants, the funders will
be disclosed in this file. Contact: criticalwindow@chipmates.ai.

## Who decides what

**The core team decides.** Right now the core team is the founding maintainer. Decisions
about scope, design, releases, and moderation rest there. As regular contributors emerge,
core membership grows by invitation of the existing core, and this file records each change.

**Realism disputes resolve toward honesty, not authority.** Today that means the maintainer decides, in public issues, with the reasoning on the record. When contributors disagree
about what is realistic (a parameter range, a rival behavior, an event's plausibility),
the ladder is: a better source wins; failing that, the disagreement becomes a wider
uncertainty range or a worldview-preset difference, so the game carries the dispute
honestly instead of picking a victor; failing even that, the maintainers decide and
record the dissent in the decision log. If the project earns reviewers worth naming,
they will be named in this file, recruited from the people whose sources and arguments
already improved the game.

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
and contributors keep their copyright. The name is a common-law mark today, not a registered trademark; registration is intended. The point stands either way: the
code is free to fork and always will be, but a fork that rewrites the numbers to push a
narrative does not get to wear our name while doing it.

## How this project is built

Openly answered because an honest reader will ask: this project is built by a very
small human core using heavy AI assistance, at a speed the git history makes obvious.
Every design decision, every adjudication, and every number is owned by the human
maintainer, and the build method is exactly why the trust architecture exists: the
iron rule, the two-way registry enforcement, the published evidence map, and the
challenge-a-number loop are there so you never have to take the authors' word for
anything, human or machine. Judge the artifact, verify the claims, and when something
is wrong, file the issue; that is the failure mode we designed for.

## Moderation

The Code of Conduct applies in every project space. The core team enforces it. Kind and
direct beats polite and vague.
