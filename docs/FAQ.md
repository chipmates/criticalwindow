# FAQ

The questions we expect, and the ones playtesting raised, answered plainly.

## Is it fun?

Sessions during development kept forcing rebalances, which is what fun pressure looks
like from the inside: a player loses in a way that feels wrong, argues, and the
mechanism has to answer (the alignment-earned model and the hard-crossing rebalance
both started that way; the commits are in [BALANCE.md](BALANCE.md)). Playtesting so
far is mostly bots plus a handful of humans, so treat this as a claim under test. Runs
take 20 to 40 minutes, losing is common, and the debrief is built to make losing worth
it. The public alpha exists to test that against people who did not build the game.

## Is this a game or advocacy?

A game. It does not tell you racing is wrong; it puts you in the seat and lets the
incentives do what they do. Three worldview presets (cautious, consensus, skeptic)
carry genuinely different assumptions with their own sources, and the game refuses to
say which one is true. If one side of the real debate thinks a preset misrepresents
them, that is a bug report we want.

## Why does the game cite its own design document?

Because the alternative is worse. A game has numbers no paper can back: turn counts,
hand sizes, thresholds. Those cite the design constitution and wear a design badge,
so no game-feel number ever hides behind a fake empirical citation. They are counted
separately from external sources everywhere counts appear.

## Does the machine prove the sources are right?

No, and we say so everywhere it matters. The machine proves every number carries a
citation, that citation tiers are honest both directions, and that every published
count agrees with the data. Whether a source truly supports a value is human
judgment; [EVIDENCE.md](EVIDENCE.md) shows worked examples of how figures became game
values, and the challenge-a-number issue template exists because we expect to be
wrong somewhere.

## Why did my run end in catastrophe?

Probably because racing blind loses, which is the thesis, not a difficulty bug. The
full outcome distributions are published in [BALANCE.md](BALANCE.md), counter-paths
included. If you think the corridor to a good ending is too narrow to be fun, that
is exactly the feedback the alpha is for.

## How was this built?

By a very small human core with heavy AI assistance, quickly, and the git history
shows it. The complete account is in [GOVERNANCE.md](../GOVERNANCE.md) under "How
this project is built." The trust architecture exists precisely so that nothing
rests on trusting the authors: run `pnpm validate`, read the map, file a challenge.

## How do you count players without tracking?

We mostly do not, and we accept that. No analytics ever ships. What we count is what
people give freely: debrief feedback, shared seeds, issues, emails, and the hosting
provider's ordinary aggregate request counts, which involve no code on your device.

## GitHub says issue creation is restricted?

That banner is what GitHub shows every logged-out visitor on every repository
(compare any large project while signed out). Signed in, the templates are open. No
account? Email criticalwindow@chipmates.ai; the debrief links it too.

## Where is the sixth ending?

Planned, not shipped. Its groundwork already accrues during play, and it ships after
the alpha, once it can land unspoiled.

## Why AGPL for a game with no server?

Because someday someone will host a modified fork, maybe with a backend bolted
on. AGPL means whoever plays that fork over a network is entitled to its source
too. The license protects the players of every future version, not our server,
of which there is none.
