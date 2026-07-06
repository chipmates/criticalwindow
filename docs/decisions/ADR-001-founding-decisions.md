# ADR-001: The 18 Founding Decisions

Status: accepted, 2026-07. These were settled before the first line of code and they are
the frame everything else hangs on. Changing one is a new ADR with a real argument, not a
drive-by refactor. Condensed from the founding brief of 2026-07-03; its living public form is docs/DESIGN.md.

| #   | Question               | Decision                                                                                                   | Why (one line)                                                                               |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Audience               | Gamers and the curious public first, classrooms second, policy world third                                 | Reach requires being wanted; classrooms follow a game that is actually fun, not the reverse  |
| 2   | Fun vs education       | Fun first, roughly 70/30                                                                                   | A lesson nobody voluntarily finishes teaches nobody anything                                 |
| 3   | Takeaways              | Five fixed pillars, tested through the alpha debrief feedback until a proper pre/post survey ships         | If we cannot say what players should feel, we cannot design mechanics that make them feel it |
| 4   | Neutrality             | Transparency instead of neutrality: worldview presets, sourced ranges, hidden dice, advisory board         | Claimed neutrality is unfalsifiable; inspectable assumptions are                             |
| 5   | Depth                  | Plague-Inc tier, one clean system, progressive disclosure                                                  | Grand strategy depth kills the audience in #1; depth can come later, reach cannot            |
| 6   | Session length         | 20 to 40 minutes, many endings, built for one more run                                                     | Replay is how a possibility space teaches; a 3-hour epic gets played once                    |
| 7   | Single or multiplayer  | Single-player plus local hotseat and classroom teams; no online multiplayer until a community maintains it | Online MP is an operational cost machine and we run at zero recurring costs                  |
| 8   | Seats                  | US, China, EU playable; frontier labs as semi-autonomous NPCs inside your bloc                             | The principal-agent friction between governments and labs is a lesson, not an inconvenience  |
| 9   | Start year             | Present day 2026, world state in data files, annual refresh as a content patch                             | A game about now must start now, and must be cheap to keep starting now                      |
| 10  | Realism                | Realistic dynamics, abstracted numbers, 8 visible resources max                                            | We simulate the shape of the trap, not a spreadsheet of the world                            |
| 11  | Tone                   | Serious, humane, darkly witty; hopeful but hard                                                            | Doom fatigue produces fatalism, which is the opposite of the mission                         |
| 12  | Platform               | Web-first PWA, offline after first load, runs on a school Chromebook                                       | The classroom constraint is a design gift: it forces lightness and privacy                   |
| 13  | Stack                  | TypeScript, React, Vite, no backend, static hosting, seeded RNG, JSON data, i18n from day one              | Boring tech maximizes the contributor pool and minimizes the bus factor                      |
| 14  | LLM in the game        | Not in the core game; audio and art are build-time assets only                                             | Cost, non-determinism, hallucination, and school firewalls all say no                        |
| 15  | License and governance | AGPL-3.0 code, CC BY-SA 4.0 content, DCO not CLA, trademark on the name, advisory board for realism        | Free to fork, hard to quietly corrupt                                                        |
| 16  | Funding                | Fiscal sponsorship and grants, all funders disclosed, one paid maintainer as target                        | Volunteer burnout is the death mode of projects like this                                    |
| 17  | Distribution           | Three doors: streamers, teachers, policy workshops                                                         | Each door has its own kit; none of them is an afterthought                                   |
| 18  | MVP path               | Paper prototype, then digital Prototype 1 (US seat), then alpha, then 1.0 with the EU seat                 | Paper proves the loop before code hardens it                                                 |
