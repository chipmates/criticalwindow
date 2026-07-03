# Race Conditions

_working title_

An open source strategy game about the AI race. You govern the United States from 2026 through the years where it all gets decided. You choose how hard to push AI capability, how much to invest in safety and in spreading the benefits, and how to handle a rival power doing the same math. You cannot verify whether your own systems are safe. That is not a gap in the game. It is the game. **You do not need to code to contribute:** every card, parameter, and line of text is a JSON file anyone can edit, every number cites a source anyone can check, and playtesting helps more than anything. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Play

Not playable yet. Prototype 1 is under construction, and this line becomes a link when it ships.

There is a print-and-play paper kit already. Run `pnpm print-kit` and you get a PDF: board, cards, rules, and one sealed envelope you are not allowed to open until the end.

## Why this game exists

Most people meet the AI race through headlines, and headlines do not teach how traps work. This game tries to give the felt version: what it is like to make deployment decisions you cannot verify, under competitive pressure you did not choose, with a society that has its own clock. Whether racing or slowing down is winning is a question the game refuses to answer for you.

It is a nonprofit education project. No ads, no accounts, no tracking, ever. Offline after first load. It runs on a school Chromebook.

## For developers

```
pnpm install
pnpm dev          # run the app
pnpm test         # engine and data tests
pnpm validate     # schema + source + string integrity for all game data
pnpm print-kit    # generate the paper prototype PDF
```

The simulation engine is pure and deterministic: same seed, same run, on every machine. Lint enforces it. See [CONTRIBUTING.md](CONTRIBUTING.md) before touching `src/engine/`.

## The iron rule

Every number in `data/` cites a source in `data/sources.json`, and `pnpm validate` fails when one does not. If you change a value, your commit names the source. If you think a number is wrong, bring a better source. That argument is the project working as designed.

## Sound

Off by default, everything works silent. Music by Scott Buckley (CC BY 4.0), see [CREDITS.md](CREDITS.md). Voice narration is generated at build time; nothing talks to a server while you play.

## License

Code: [AGPL-3.0](LICENSE). Game content (data, text, later art): [CC BY-SA 4.0](LICENSE-CONTENT). The privacy claims are verifiable in this repository: there is no tracking code to find.
