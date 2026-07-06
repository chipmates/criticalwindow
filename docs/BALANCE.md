# How the balance was tuned

We say elsewhere that balance came from "an adversarial campaign of several hundred
model-played games." That sentence is not something you can check unless we show our
work. This file shows it: the actual harness, the actual current numbers, and the real
commits where the numbers changed and why.

## What we claim, and do not claim

We claim the scripted-bot grid below is real, reproducible, and not cherry-picked. Run
the command yourself and you will get the same table. It shows the engine doing what the
design says it should: racing blind loses almost every time, cooperation is hard to reach
and costs something real, and the corridor between "too slow" and "too reckless" is
narrow but genuinely there.

We claim the model-played campaign (several hundred runs across a series of iterations,
using Claude models as the exploring policy) found real exploits that the scripted bots
were too simple to find, and that finding them forced real rebalances. The commits are
cited below so you can read the story yourself instead of taking our word for it.

We do not claim that any of this means the game is fun. A scripted heuristic and an LLM
playing off a system prompt are a floor on strategy quality, not a ceiling. Both play more
literally, and less cleverly, than a curious teenager or a policy wonk who reads the news.
Neither one gets bored, distracted, or attached to a losing plan out of stubbornness the
way a person does.

Human play already shaped this game in ways the bots never managed: the
alignment-earned model, the displacement curve's early knee, and the hard-crossing
rebalance all came from a person playing, losing wrong, and demanding the mechanism
answer for it (commits 7dae4cb and 433e1db carry two of those stories). What the bots
prove is the trap and the corridor; how it feels is judged at the table, and the public
alpha exists to grow that table beyond the people who built it.

## How the harness works

Two scripts, two different jobs.

**`pnpm simulate`** drives full games through the real engine using five small scripted
bots. No network, no API key, free to run. Each bot repeats one allocation shape every
turn, plus a fixed policy-card preference order:

| Bot       | Capability       | Safety | Diffusion | Idea                                 |
| --------- | ---------------- | ------ | --------- | ------------------------------------ |
| `racer`   | 80%              | 10%    | 10%       | push the frontier, worry later       |
| `steward` | 65%              | 25%    | 10%       | the strategy the game tries to teach |
| `dove`    | 20%              | 50%    | 30%       | safety-first, chases the treaty      |
| `hedger`  | 50%              | 25%    | 25%       | split the difference                 |
| `chaos`   | random each turn |        |           | a legal-but-unplanned baseline       |

Every run gets a seed like `sim-consensus-racer-7`. Same seed, same data, same run,
always, because the engine is a deterministic fold and bots are drivers outside it, never
part of it. CI runs `pnpm simulate -- --runs 100` on every change as a smoke test and a
reachability guard: if any of the five endings never shows up in a 100-run batch, the
build fails. The table below is that same command, widened to every worldview and every
bot, run against this repository as it stands right now.

**`pnpm model-playtest`** is the other half. It lets an LLM play instead of a fixed
heuristic, one seat at a time, under the same fog a human plays under: the view the model
sees never includes hidden state (true alignment, alignment difficulty, takeoff
steepness). It sees an eval band, not a number, same as you do. It needs
`ANTHROPIC_API_KEY` in the environment, read at tooling time only, never committed, never
shipped, never called while anyone is actually playing the game. This is a balance
instrument, not a game feature. When the model isn't driving a seat, that seat runs on
`scriptedSeatDecide`, the exact function the shipped solo game uses for the computer
opponent, not a stand-in (more on why that distinction earned its own bug fix below).

The harness also supports a "clean rulebook" mode that strips every strategy sentence out
of what the model is told, and a "learning series" mode where the model plays several
games in a row carrying forward only its own revised notes between them, the same
information a human carries forward as a debrief. Both exist because of mistakes we made
and had to fix. See "the three times the instruments lied" below.

## Current distribution

Reproduce this yourself:

```
pnpm simulate -- --preset all --bot all --runs 100
```

100 runs per (worldview, bot) pair, so each number below is directly a percentage.
Endings: **MC** misaligned catastrophe, **FL** flourishing, **OP** outpaced, **NS**
negotiated slowdown, **SB** societal breakdown. A blank cell means zero in that batch.

| Worldview | Bot     | Median turns | MC  | FL  | OP  | NS  | SB  |
| --------- | ------- | ------------ | --- | --- | --- | --- | --- |
| cautious  | racer   | 6            | 100 |     |     |     |     |
| cautious  | steward | 10           | 100 |     |     |     |     |
| cautious  | dove    | 11           | 33  | 1   |     | 66  |     |
| cautious  | hedger  | 10           | 70  |     |     | 1   | 29  |
| cautious  | chaos   | 12           | 88  | 3   | 1   | 5   | 3   |
| consensus | racer   | 7            | 100 |     |     |     |     |
| consensus | steward | 10           | 83  | 16  | 1   |     |     |
| consensus | dove    | 11           | 26  |     | 4   | 70  |     |
| consensus | hedger  | 10           | 60  | 12  | 2   | 2   | 24  |
| consensus | chaos   | 12           | 84  | 5   | 1   | 2   | 8   |
| skeptic   | racer   | 8            | 98  |     |     |     | 2   |
| skeptic   | steward | 10           | 51  | 43  | 6   |     |     |
| skeptic   | dove    | 11           | 7   | 1   | 20  | 72  |     |
| skeptic   | hedger  | 11           | 32  | 35  |     | 4   | 29  |
| skeptic   | chaos   | 13           | 53  | 29  | 4   | 10  | 4   |

Twenty of the 1,500 runs above (about 1%) ended with the negotiation channel still open
and unused at turn 16, a flag the harness tracks (`windowStillOpen`) but this document
will not spoil. Play it.

### Why racer is 98 to 100 percent catastrophe, and why that's the point

An external zero-context review pass read an earlier draft of our numbers and said, correctly, that 60 to 100
percent of bot runs ending in misaligned catastrophe looks like the design is broken.
Read the table again with the allocations attached. `racer` spends 10% on safety, ever.
The central mechanic is that crossing the capability threshold resolves your true
alignment (which safety spending slowly builds and the frontier itself slowly erodes)
against a difficulty nobody sees. Ten percent safety, kept up for sixteen turns, into a
zone that erodes what little you built: almost nobody banks enough alignment to survive
the crossing. That is not a bug. Racing blind is supposed to lose. It is takeaway one and
takeaway two of the whole project, made mechanical.

The counter-path is in the same table. `dove` turns the same setup toward the treaty:
minimal capability spend, half the turn on safety, and it picks `compute_treaty_feeler`
whenever it's playable. Negotiated slowdown becomes the dominant outcome, 66 to 72 percent
depending on worldview, with catastrophe falling to 7 to 33 percent. `steward`, the
allocation the game explicitly tries to teach players (push the frontier and pay for
alignment both), shows the corridor is narrow rather than nonexistent: it reaches
flourishing 16 to 43 percent of the time in consensus and skeptic worlds, and still zero
percent of the time in the cautious worldview, where the hidden difficulty band is
weighted hard against you no matter how well you play. That gap between worldviews is
also intentional: the preset you pick is supposed to change how hard the game is willing
to be, honestly, not just cosmetically.

## What the campaign changed

Four rebalances, with the commits that made them. Hashes are short SHAs into this
repository's history. `git show <hash>` gets you the full patch and message.

**Alignment had to become something you earn.**
[`7dae4cb`](https://github.com/chipmates/criticalwindow/commit/7dae4cb) closed a finding
from an early human playtest: a run with zero safety investment could still reach the
best ending. The cause was arithmetic, not tuning: true alignment started at
`1000 - difficulty`, so easy and middle worldviews began the game already aligned before
a single turn was played. The fix rewrote the model so alignment starts low and only
safety spending raises it, while heavy capability spending actively cuts it. The same
commit also fixed the displacement curve: job displacement was falling for the first few
turns of every run because its starting value sat above the curve's own early target,
which is why playtesters weren't feeling job losses early on even though the mechanic
existed. The curve now rises from turn one.

**Crossing the threshold had to become dangerous again.**
[`433e1db`](https://github.com/chipmates/criticalwindow/commit/433e1db) is the
hard-crossing rebalance. Random play, and even deliberately balanced play, were reaching
flourishing far too often, which defeats the entire premise that racing to the frontier
is a gamble. Two sourced knobs fixed it: alignment got more expensive to earn
(`safetyDriftDivisor`), and the frontier itself started eroding alignment the longer you
sit in it (`fogZoneAlignmentErosion`), which means alignment has to be banked before the
final sprint, not topped up during it. Random play's catastrophe rate went from a
near-guaranteed win to roughly 80 percent in the default worldview at the time of that
commit. The same commit made the treaty bilateral (both seats must signal, not one) and
raised its trust bar, because incidental treaties were forming as a side effect of
ordinary play far too easily.

**The treaty had to cost something at home.**
Bilateral signaling alone wasn't enough. A later sweep found mid-tier, unremarkable play
was still banking the treaty 63 percent of the time, statistically indistinguishable from
expert play, with zero flourishing attempts in the same batch
([`4adf4f8`](https://github.com/chipmates/criticalwindow/commit/4adf4f8)). The actual fix
was political, not mechanical: ratifying the treaty now costs the signing government 300
political capital, so it has to compete against every other tempting card in the budget
instead of being free
([`c772df2`](https://github.com/chipmates/criticalwindow/commit/c772df2)). That still
wasn't the whole story: a price alone doesn't teach anything if the price is knowable in
advance. The next commit made ratification require **both** governments to be holding 300
political capital at the moment of signing, and the rival's own capital swings with
events the player does not control
([`954ff81`](https://github.com/chipmates/criticalwindow/commit/954ff81)). That turns the
signature from a recipe you can execute into a window you have to read, which is the
actual design intent behind takeaway four.

**China needed a door through its own chokepoint.**
Replaying a model campaign turn-for-turn found the China seat capped at capability 783 in
expert play, unable to reach the fog zone at all, no matter how well it was played. The
cause: China had no lever of its own to raise substitution once export controls bit, so
the chokepoint wasn't a strategic pressure, it was a wall
([`2d56366`](https://github.com/chipmates/criticalwindow/commit/2d56366)). The fix gave
chip subsidies a delayed effect on domestic substitution, cited to the same sources that
argue China's response to export controls is a race against its own supply chain, not a
dead stop. A committed China can now walk through the gate late. The chokepoint keeps its
teeth. It stops being unbeatable by construction.

## The three times the instruments lied

Three separate times, a finding that looked like a game-balance problem turned out to be
a measurement bug. Same root cause every time: the harness was not measuring the game
that actually ships. We are listing all three because a project that only tells you about
its balance fixes and not its measurement bugs is not being straight with you about how
much of "several hundred model-played games" was signal versus noise along the way.

**The opponent that was accidentally passive.**
The same replay that found China's chokepoint problem above also found the playtest
harness had been driving the model's opponent with a generic scripted bot instead of the
real seat policy the shipped game uses. That generic bot never relieved unrest on its own
society and burned it down in nine of twenty runs. For a while, that read as a China-seat
balance defect. It was a harness defect: the opponent it drove has never existed in the
shipped game. Fixed in the same commit
([`2d56366`](https://github.com/chipmates/criticalwindow/commit/2d56366)) by wiring the
harness to call `scriptedSeatDecide` directly, the exact function production uses.

**The strategy guide that leaked into the model's own prompt.**
For a while, the rulebook the model was given before each game spelled out the winning
strategy directly: bank alignment before the sprint, read the incidents as alignment
data, time the treaty signature to the window. A model told the answer and then graded on
whether it repeated the answer is not being tested on discovery, it's being tested on
obedience, and obedience is not what balance needs to know. The fix
([`14b08c3`](https://github.com/chipmates/criticalwindow/commit/14b08c3)) added a second,
mechanics-only rulebook with every strategy sentence stripped out, plus a mode where the
model plays a series of games carrying forward nothing but its own notes, revised after
each debrief, which is exactly what a human carries between runs.

**The debrief that was skeleton text.**
Once the harness could run a learning series, the notes a model revised between games
were built from a single bare stat line: an ending name and a turn count. A human player
gets far more than that: a chart of what the evals said against what was actually true
each quarter, whether the treaty window was open and when, which incidents fired and
whether they were raced past. Grading a model on what it learned from a debrief it was
never actually shown is the same mistake as the other two, worn differently. Fixed in
[`d3f15da`](https://github.com/chipmates/criticalwindow/commit/d3f15da) by replaying every
finished run through the same probes that generate the debrief screen itself, so the
model's between-game notes are built from the same information a human closes a run with.

Once the model could actually see what a human sees, the campaign's clearest skill signal
showed up: bots that could not see the rival's ratification status (added to the model's
view alongside the fix above, [`a53c06c`](https://github.com/chipmates/criticalwindow/commit/a53c06c))
succeeded at reaching a good ending about 26 percent of the time. Bots given that same
"diplomatic weather" line the human UI already shows succeeded around 60 percent of the
time. The treaty was never really about knowing the mechanic exists. It was about reading
a signal at the right moment, and that turns out to be learnable, by a model and
presumably by a person.

## Known limitations and open questions

- **Single-digit human playtests so far.** Everything above is scripted bots and an LLM
  under a prompt. Both are proxies for "does the mechanic work as designed," not for "is
  this fun to sit down and play." The real gate is human, and it hasn't happened at scale
  yet.
- **Distribution guards in CI are floors, not the full grid.** Since v0.3.2,
  `tests/subsystems.test.ts` asserts the thesis as invariants: racing pressure
  dominates, the treaty path stays alive, flourishing stays reachable, all five
  endings appear, and the planned sixth stays unreachable. Per-worldview,
  per-strategy cell bounds are still open work; the grid above is reproducible
  but not yet armed.
- **The cautious worldview may be tuned too hard, or may be honest.** `steward`, the
  taught strategy, reaches flourishing zero times out of 100 in the cautious preset. We
  read that as the preset doing its job (some worldviews should be genuinely brutal), but
  we haven't ruled out over-tuning, and only real playtests will tell the difference.
- **The model campaign is one model family, at modest scale per condition.** It is
  evidence the trap is discoverable and that specific exploits existed and got fixed. It
  is not a claim about how every possible clever adversary would play, human or
  otherwise.
- **Balance will keep moving**, especially once the human alpha gate starts producing
  real data. Saves and shared seeds are not compatible across data changes by design: the
  build hashes every data file into a version stamp, and a save made against a different
  data version gets refused honestly instead of quietly replaying under rules it never
  ran under. If you come back to this document in a month and the table above looks
  different, that's the system working, not the system breaking.
