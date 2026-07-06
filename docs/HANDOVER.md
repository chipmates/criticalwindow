# Critical Window: the founding design document

_Drafted 2026-07-03 under the working title Race Conditions, before the name locked to Critical Window. An open source strategy game about the AI race, teaching the world's hardest coordination problem through play._

> **What this is:** the complete brief the first build worked from, kept as the design constitution and lightly edited for publication. Everything here was a plan on day one; the repo around it is what the plan became. Decision history lives in `docs/decisions/`; the §11 core source set grew into [`SOURCES.md`](../SOURCES.md).
> **Status:** v1.0 handover · License of this doc: CC BY-SA 4.0

---

## 1. Project Identity

- **Who:** A nonprofit education project. No revenue, no ads, no tracking, ever. Fully open source. Everyone, including AI researchers, is invited to contribute.
- **What:** A single-player (later hotseat/classroom) strategy simulation of the AI race. Player takes the seat of the **USA**, **China**, or (headline feature, Milestone 2) the **EU**, from the present day (2026) through the critical window (~2030+). Win, lose, or discover that "winning" was the wrong frame.
- **Why:** Give millions of people a _felt understanding_ of AI-race dynamics, risks, benefits, and levers, through a game good enough that they'd play it anyway. Inspiration gap: Intelligence Rising (facilitated, ~hundreds of players/year) proves the pedagogy; nobody has shipped the scalable public version. Plague Inc and AI 2027 prove the reach potential.
- **Audience:** Primary: curious internet public + light strategy gamers (Plague Inc / Wordle / AI-2027 crowd) via streamers, Reddit, HN. Secondary: classrooms 16–25 (their constraints, Chromebooks, 40-min sessions, no accounts, shape the tech). Tertiary: policy workshops.

## 2. The Five Takeaways (design pillars: every mechanic serves at least one)

1. **Race dynamics are a trap:** individually rational moves, collectively catastrophic outcomes, even when everyone is decent.
2. **Alignment can't be verified directly:** you govern under irreducible uncertainty; eval scores are not truth.
3. **AI has a physical body:** chips, fabs, energy. Chokepoints are leverage.
4. **Neither racing nor pausing is automatically "winning":** every path has costs; cooperation is hard but possible.
5. **Middle powers (Europe) have real leverage and a closing window**, and societal stability (jobs, trust) is a resource leaders can bankrupt.

## 3. Operating Principles (the constitution)

1. **Fun first, ~70/30.** The lesson lives in mechanics; explicit education (debrief, sources, teacher kit) surrounds the loop, never interrupts it.
2. **Transparency over neutrality.** Worldview presets set honest parameter ranges; hidden dice roll within them; every number cites a source.
3. **Zero recurring costs.** Static hosting, no backend, no accounts; all assets baked at build time.
4. **Everything is data.** Rules, events, parameters, strings in JSON, non-coders contribute content.
5. **Privacy by design.** No tracking, no accounts, localStorage only. School-safe by default.
6. **Deterministic, seeded simulation.** Shareable runs ("beat my seed"), reproducible bugs, testable balance.
7. **Open source:** code AGPL-3.0, content CC BY-SA 4.0, DCO not CLA, name trademarked (protects against propaganda forks).
8. **Iron rule:** every parameter change cites a source (`SOURCES.md` ID). This rule _is_ our credibility and our researcher-recruitment bait.

## 4. The 18 Founding Decisions (condensed; full rationale in `docs/decisions/ADR-001-founding-decisions.md`)

| #   | Question           | Decision                                                                                                                                                                                 |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Audience           | Gamers/curious public first; classroom constraints respected; policy third                                                                                                               |
| 2   | Fun vs education   | Fun-first 70/30                                                                                                                                                                          |
| 3   | Takeaways          | The five pillars above, tested via pre/post surveys                                                                                                                                      |
| 4   | Neutrality         | Transparency architecture: presets + hidden dice + sources + advisory board                                                                                                              |
| 5   | Depth              | Plague-Inc tier: one clean system, progressive disclosure; grand strategy is v3                                                                                                          |
| 6   | Session length     | 20–40 min runs, many endings, "one more run" design                                                                                                                                      |
| 7   | SP/MP              | Single-player + local hotseat + classroom team mode; NO online MP until community maintains it                                                                                           |
| 8   | Seats              | US, China, EU playable; frontier labs = semi-autonomous NPCs inside your bloc (principal–agent friction); real countries, fictional-but-recognizable labs/leaders                        |
| 9   | Start year         | Present day (2026) + 3-turn interactive prologue replaying 2023→now as tutorial; world-state in data files so annual refresh = content patch                                             |
| 10  | Realism            | Realistic _dynamics_, abstracted numbers; 8 visible resources max; sourced not spreadsheet-precise                                                                                       |
| 11  | Tone               | Serious, humane, darkly witty (satirical news ticker); hopeful-but-hard, good endings reachable but rare on first run (doom fatigue produces fatalism, the opposite of our mission)      |
| 12  | Platform           | Web-first PWA, offline after first load, runs on school Chromebook; later itch.io + Steam wrappers + print-and-play                                                                      |
| 13  | Stack              | TypeScript + React + Vite, no backend, static hosting, seeded RNG, JSON data files, i18n from day one                                                                                    |
| 14  | LLM in-game        | NOT in core (cost, non-determinism, hallucination, school firewalls). Optional bring-your-own-key advisor layer post-1.0. ElevenLabs audio + AI-gen art are **build-time static assets** |
| 15  | License/governance | AGPL-3.0 / CC BY-SA 4.0 / trademark / DCO; small core team + advisory board arbitrates realism                                                                                           |
| 16  | Funding            | Fiscal sponsor + grants (NLnet, Prototype Fund, Erasmus+, SFF/LTFF, science-comm funds); all funders disclosed; 1 paid maintainer target                                                 |
| 17  | Distribution       | 3 doors: creators/streamers, teachers (kit + debrief guide), policy world (partner with Intelligence Rising)                                                                             |
| 18  | MVP                | Paper prototype → digital Prototype 1 (US seat) → alpha → 1.0 "Europe Update"                                                                                                            |

## 5. Game Design Specification

### 5.1 Core loop (one turn = one quarter)

1. **Briefing:** advisor summaries + satirical news ticker (world events, rival moves, society mood).
2. **Allocate research:** split R&D capacity between **Capability / Safety / Societal diffusion** (diffusion = converting capability into GDP, services, public goods).
3. **Play 1 policy card** from a rotating hand (export controls, compute-treaty feeler, UBI pilot, immigration reform, natsec merge, open-weights release, energy buildout, chip subsidies…). Cards have honest tradeoffs and delayed consequences.
4. **Resolve event card(s):** data-driven dilemmas (DeepSeek-style shock, model-weight theft, Taiwan crisis, lab whistleblower, viral job-loss story, eval breakthrough…).
5. **World updates:** rival acts (scripted postures), society layer updates (jobs, unrest, trust), eval report renders with uncertainty band, election clock ticks.

### 5.2 Resources (8 visible)

`Compute · Energy · Talent · Capital · Public Trust · Political Capital · Capability · Safety Insight`

- Compute is the master resource: gated by chips (fabs take years; export controls; ASML chokepoint) and Energy.
- Trust + Political Capital gate which policy cards are playable; elections judge you (US midterms every 8 turns).
- Capability is visible; **true alignment is NOT**, see 5.3.

### 5.3 Hidden information (the signature mechanic)

- Per-run hidden dice (seeded): **alignment difficulty** and **takeoff steepness**, rolled within the ranges set by the chosen worldview preset.
- Player sees only **eval reports with an uncertainty band**. Safety Insight (interpretability investment) narrows the band, never to zero. A deceptive model can pass evals (grounded in Sleeper Agents / alignment-faking research).
- Deployment/racing decisions must be made under this uncertainty, Takeaway #2 is _felt_, not stated.

### 5.4 Worldview presets (transparency over neutrality)

`Cautious World / Consensus World / Skeptic World`, each preset defines parameter ranges (alignment difficulty distribution, takeoff steepness, economic diffusion rates) with cited sources. Selected at run start; hidden dice roll inside the chosen ranges. Default: Consensus.

### 5.5 Rival AI (Prototype: scripted China)

Three postures, **Race / Mirror / Cautious**, switching based on player behavior, capability gap, and events. Mirror = tit-for-tat-ish (builds trust for treaty paths). Rival is _not_ evil; it has its own trust meter toward the player and its own domestic pressures.

### 5.6 Seats and asymmetry

- **USA:** compute lead; labs are semi-autonomous NPCs you influence but don't command (principal–agent friction); election cycles; open society (leaks, whistleblowers, press).
- **China:** state coordination, energy abundance, data access; chip chokepoint pain; legitimacy pressure; can substitute (Huawei/SMIC path) if squeezed.
- **EU (Milestone 2, headline):** different win conditions, sovereignty, prosperity, values, NOT "win the race." Strategy menu: Regulate / Build sovereign compute / Ally tightly / Free-ride. ASML = kingmaker card both giants must court. Brain drain as live mechanic. UK as separate minor actor (DeepMind, AISI).
- Time compression: later turns cover less calendar time as capability grows, players _feel_ takeoff.

### 5.7 Endings (5 + 1 hidden)

1. **Flourishing**, aligned transformative AI, benefits diffused (Machines-of-Loving-Grace world; genuinely reachable, hard).
2. **Misaligned Catastrophe**, raced past the uncertainty band and lost the gamble.
3. **Outpaced**, rival reaches decisive advantage; your choices shaped how that world looks.
4. **Negotiated Slowdown**, verified treaty; slower, safer, politically expensive.
5. **Societal Breakdown**, trust/jobs collapse ended the game before AI did.
6. _(Hidden)_ **Gradual Disempowerment**, every metric green, humans irrelevant (grounded in Kulveit et al. 2025). Unlocked achievement-style; the most talked-about ending if we do it right.

### 5.8 Debrief screen (where the education lands)

What happened · which takeaways surfaced this run · counterfactual hints ("the treaty window was open on turn 7") · sources link · seed share · **one-tap provocation: "What did this game get wrong?"** → feedback funnel → Discord → good-first-issues.

## 6. PROTOTYPE 1: Definition of Done (BUILD THIS FIRST)

- [ ] US seat vs scripted China (3 postures), 12–16 turns (2026→~2030), turn = quarter
- [ ] 8 resources; allocation (Capability/Safety/Diffusion) + 1 policy card/turn (10 cards minimum)
- [ ] Hidden dice (alignment difficulty, takeoff steepness), seeded RNG, seed shareable
- [ ] Eval reports with uncertainty band; Safety Insight narrows band
- [ ] Society layer: job displacement, unrest, trust; midterm election turn 8
- [ ] 18+ event cards as data; satirical one-line news ticker
- [ ] 5 endings + debrief screen (per 5.8) + feedback link
- [ ] Text/CSS/emoji only, NO art/audio yet (Phase 3); mobile + desktop responsive
- [ ] i18n keys from the start (`en.json` complete, no hardcoded strings)
- [ ] Deterministic engine w/ tests; all tunables in `/data/*.json`
- **Gate:** median session ≥15 min; ≥50% of testers start a second run unprompted; testers name ≥2 of 5 takeaways in exit survey.

## 7. Technical Architecture

### 7.1 Stack & constraints

- **Vite + TypeScript + React.** No backend. No accounts. No analytics/tracking. No runtime network calls (PWA offline after first load). localStorage for saves/settings only.
- **Engine = pure functions:** `step(state, action, rng) → state`. UI is a thin layer. Deterministic per seed (mulberry32 or xoshiro128).
- **Validation:** zod schemas for all data files; `npm run validate` in CI.
- **Perf budget:** first load <2s on school Wi-Fi, <5MB initial bundle, 60fps interactions.
- **A11y:** WCAG AA contrast, colorblind-safe palette, full keyboard play, reduced-motion mode, screen-reader-friendly menus.
- **Deploy:** GitHub Pages/Netlify, PWA manifest + service worker.
- UI direction: distinctive and non-templated over component-library sameness.

### 7.2 Repo structure (create exactly this)

```
race-conditions/
├── README.md                  # mission, play link, "you don't need to code to contribute" in first paragraph
├── ROADMAP.md                 # already written, copy in
├── SOURCES.md                 # §11 core set + full research bibliography
├── GOVERNANCE.md              # core team decides; advisory board arbitrates realism; iron rule
├── CONTRIBUTING.md            # code + non-code paths (event cards, sources, translations, playtests)
├── CODE_OF_CONDUCT.md
├── LICENSE                    # AGPL-3.0 (code)
├── LICENSE-CONTENT            # CC BY-SA 4.0 (data, text, art)
├── docs/
│   ├── HANDOVER.md            # this file
│   └── decisions/ADR-001-founding-decisions.md
├── data/
│   ├── parameters.json        # all tunables incl. worldview preset ranges; every value has sourceId
│   ├── scenarios/scenario_2026.json   # start state (annual refresh target)
│   ├── events/*.json          # event cards
│   ├── policies/*.json        # policy cards
│   ├── strings/en.json        # all UI text
│   └── sources.json           # machine-readable SOURCES registry (id, title, url)
├── src/
│   ├── engine/                # pure sim: types.ts, rng.ts, step.ts, evals.ts, rival.ts, endings.ts
│   ├── ui/                    # React components
│   └── main.tsx
├── tests/                     # determinism + schema + ending-reachability tests
├── scripts/
│   ├── validate-data.ts
│   ├── generate-audio.ts      # ElevenLabs, build-time (Phase 3)
│   └── art-pipeline.md        # image-gen prompts + style guide (Phase 3)
└── public/                    # icons; later: audio/, art/
```

### 7.3 Data schema examples (implement with zod)

**Event card** (`data/events/deepseek_shock.json`):

```json
{
  "id": "open_weights_shock",
  "title": "strings:event.open_weights_shock.title",
  "body": "strings:event.open_weights_shock.body",
  "trigger": { "turnMin": 3, "turnMax": 8, "conditions": { "rivalPosture": "Race" }, "weight": 2 },
  "choices": [
    {
      "label": "strings:event.open_weights_shock.c1",
      "effects": { "publicTrust": -5, "capability": 0, "flags": ["openWeightsWorld"] },
      "delayedEffects": [{ "inTurns": 4, "effects": { "capital": -10 } }]
    },
    {
      "label": "strings:event.open_weights_shock.c2",
      "effects": { "politicalCapital": -8, "flags": ["exportCrackdown"] }
    }
  ],
  "sourceIds": ["SRC-DEEPSEEK-R1", "SRC-CSIS-EXPORT"],
  "tags": ["china", "open-weights", "shock"]
}
```

**Parameters with worldview presets** (`data/parameters.json`, excerpt):

```json
{
  "worldviewPresets": {
    "cautious": {
      "alignmentDifficulty": [0.55, 0.95],
      "takeoffSteepness": [0.5, 0.9],
      "sourceIds": ["SRC-AI2027", "SRC-CARLSMITH"]
    },
    "consensus": {
      "alignmentDifficulty": [0.3, 0.8],
      "takeoffSteepness": [0.3, 0.8],
      "sourceIds": ["SRC-IAISR", "SRC-GRACE-SURVEY"]
    },
    "skeptic": {
      "alignmentDifficulty": [0.05, 0.5],
      "takeoffSteepness": [0.1, 0.5],
      "sourceIds": ["SRC-NORMAL-TECH", "SRC-SNAKEOIL"]
    }
  },
  "evalUncertainty": {
    "baseBandWidth": 0.4,
    "safetyInsightNarrowing": 0.03,
    "floorBandWidth": 0.08,
    "sourceIds": ["SRC-SLEEPER", "SRC-SCHEMING"]
  }
}
```

## 8. Asset Pipeline (Phase 3: AFTER Prototype 1 gate passes)

- **Audio (ElevenLabs, build-time only):** `scripts/generate-audio.ts` reads `data/audio-script.json` → generates static mp3/ogg into `public/audio/`. Idempotent (hash-cached; only regenerates changed lines). API key via `ELEVENLABS_API_KEY` env var, **never** shipped or called at runtime. Script list: ~10 advisor briefing lines per seat, news-ticker stingers, 5 ending narrations, UI feedback sounds. Keep total audio <15MB, lazy-loaded.
- **Art (AI-generated, build-time):** one style guide, strictly enforced, recommendation: editorial-print / risograph-propaganda-poster hybrid, 5-color palette, consistent grain. Asset list: seat emblems, advisor portraits (fictional), 5 ending illustrations, ~20 event thumbnails, social/press images. Prompts + settings versioned in `scripts/art-pipeline.md` so art is reproducible and community-extendable.
- Everything static, everything CC BY-SA, generation costs are one-time.

## 9. Roadmap Summary (full version: `ROADMAP.md`: gates over dates)

| Phase                          | Output                                                 | Gate                                     |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------- |
| 0 Foundation (wk 1–2)          | Repo, licenses, community hub, paper kit               | Stranger understands + can join in 90s   |
| 1 Paper Proof (wk 2–4)         | 10 paper playtests                                     | ≥7/10 replay; race-trap named unprompted |
| 2 **Prototype 1** (wk 4–8)     | §6 spec, playable link                                 | ≥15min median; ≥50% replay; ≥2 takeaways |
| 3 Public Alpha (mo 2–4)        | Real repo, art+audio, China seat, 40+ events           | 1k organic plays; 5 outside contributors |
| 4 1.0 "Europe Update" (mo 4–8) | EU seat, classroom kit, 3+ languages, itch/Steam       | 50k plays/90d; 10 classrooms; press      |
| 5 Flywheel (mo 8+)             | Annual scenario refresh, mod editor, research partners | ≥30% community-authored content          |

**Contributor funnel:** debrief provocation ("What did this game get wrong?") → Discord → non-code good-first-issues (event cards, sources, translations, playtests) → 48h-SLA kind reviews → auto-generated in-game credits → lane ownership. **Distribution:** Show HN/Reddit (alpha) → 20 streamers + Steam + press kit (1.0) → EU media/teacher networks ("you are Europe" angle, uncontested space). **Funding:** fiscal sponsor; NLnet, Prototype Fund, Erasmus+, SFF/LTFF; all funders disclosed. **Risks:** volunteer burnout (paid maintainer), politicization (transparency architecture; attacked-from-both-sides = calibrated), news rot (annual refresh ritual), hostile forks (AGPL+trademark), scope creep (gates).

## 10. North-star Metric

**Completed debriefs** (finished run + read debrief = one plausible insight event). Supporting: plays, replay rate, median session, pre/post takeaway delta, classrooms, contributors merged, % community content, translations, seeds shared.

## 11. SOURCES: Core Anchor Set (~60)

> Full 180+ bibliography from the deep-research report goes into `SOURCES.md` / `data/sources.json`. Below is the load-bearing core. **[BOOK]** = obtain manually. For any broken URL, search the exact title. Verify all links on first fetch.

### Capabilities, scaling, forecasting

- Scaling Laws for Neural Language Models, Kaplan et al., 2020, https://arxiv.org/abs/2001.08361
- Training Compute-Optimal LLMs (Chinchilla), Hoffmann et al., 2022, https://arxiv.org/abs/2203.15556
- Epoch AI, data hub (compute trends, notable models, hardware), https://epoch.ai
- GATE: economic model of AI automation, Epoch AI, https://epoch.ai/gate
- AI 2027 scenario, Kokotajlo, Alexander et al., 2025, https://ai-2027.com
- Measuring AI Ability to Complete Long Tasks, METR, 2025, https://arxiv.org/abs/2503.14499
- AI Index Report, Stanford HAI, annual, https://hai.stanford.edu/ai-index
- Thousands of AI Authors on the Future of AI, Grace et al., 2024, https://arxiv.org/abs/2401.02843
- Situational Awareness, Aschenbrenner, 2024, https://situational-awareness.ai
- Forecasting TAI with Biological Anchors, Cotra/Open Philanthropy, 2020, search openphilanthropy.org
- Compute-centric takeoff model, Davidson/Open Philanthropy, 2023, https://takeoffspeeds.com
- Our World in Data: Artificial Intelligence, https://ourworldindata.org/artificial-intelligence

### Alignment, safety, evaluation

- Concrete Problems in AI Safety, Amodei et al., 2016, https://arxiv.org/abs/1606.06565
- Sleeper Agents, Hubinger et al. (Anthropic), 2024, https://arxiv.org/abs/2401.05566
- Alignment Faking in LLMs, Greenblatt et al. (Anthropic/Redwood), 2024, https://arxiv.org/abs/2412.14093
- Frontier Models are Capable of In-Context Scheming, Meinke et al. (Apollo), 2024, https://arxiv.org/abs/2412.04984
- Constitutional AI, Bai et al. (Anthropic), 2022, https://arxiv.org/abs/2212.08073
- Scaling Monosemanticity, Anthropic interpretability, 2024, https://transformer-circuits.pub/2024/scaling-monosemanticity/
- Weak-to-Strong Generalization, Burns et al. (OpenAI), 2023, https://arxiv.org/abs/2312.09390
- Optimal Policies Tend to Seek Power, Turner et al., 2021, https://arxiv.org/abs/1912.01683
- Goal Misgeneralization, Shah et al. (DeepMind), 2022, https://arxiv.org/abs/2210.01790
- Specification Gaming, DeepMind blog, 2020, search "specification gaming deepmind"
- AI Control: Improving Safety Despite Intentional Subversion, Greenblatt et al. (Redwood), 2023, https://arxiv.org/abs/2312.06942
- Gradual Disempowerment, Kulveit et al., 2025, https://arxiv.org/abs/2501.16946 _(grounds the hidden ending)_
- Anthropic Responsible Scaling Policy, https://www.anthropic.com/rsp (or search)
- OpenAI Preparedness Framework, search openai.com preparedness
- DeepMind Frontier Safety Framework, search deepmind frontier safety framework
- UK AI Security Institute, evaluations & reports, https://www.aisi.gov.uk
- International AI Safety Report, Bengio et al., 2025/26, https://internationalaisafetyreport.org

### Compute, chips, energy

- AI Chips: What They Are and Why They Matter, Khan & Mann (CSET), 2020, https://cset.georgetown.edu
- Choking Off China's Access to the Future of AI, Allen (CSIS), 2022 (+ updates), https://www.csis.org
- Computing Power and the Governance of AI, Sastry, Heim et al. (GovAI), 2024, https://arxiv.org/abs/2402.08797
- Securing AI Model Weights, Nevo et al. (RAND), 2024, https://www.rand.org
- Energy and AI, IEA, 2025, https://www.iea.org/reports/energy-and-ai
- Preventing AI Chip Smuggling, Fist et al. (CNAS), https://www.cnas.org
- Hardware-Enabled Governance Mechanisms (flexHEG), search "flexHEG report"
- SemiAnalysis (industry blog: fabs, accelerators, datacenters), https://semianalysis.com
- Chip War, Chris Miller, 2022, **[BOOK]**

### US–China & geopolitics

- Superintelligence Strategy (MAIM), Hendrycks, Schmidt, Wang, 2025, https://www.nationalsecurity.ai
- DeepSeek-V3 Technical Report, 2024, https://arxiv.org/abs/2412.19437
- DeepSeek-R1, 2025, https://arxiv.org/abs/2501.12948
- China's AI Regulations and How They Get Made, Sheehan (Carnegie), 2023, https://carnegieendowment.org
- MERICS China AI/tech analyses, https://merics.org
- NSCAI Final Report, 2021, https://www.nscai.gov
- US AI Action Plan / EOs, https://www.whitehouse.gov (search current)
- CSET reports library, https://cset.georgetown.edu

### Europe / EU

- EU AI Act, Regulation (EU) 2024/1689, https://eur-lex.europa.eu (explorer: https://artificialintelligenceact.eu)
- The Future of European Competitiveness (Draghi report), European Commission, 2024, https://commission.europa.eu
- InvestAI / AI gigafactories & AI Action Summit outcomes (Feb 2025), search commission.europa.eu "InvestAI"
- The Brussels Effect, Bradford, 2020, **[BOOK]**
- Bletchley Declaration, UK Gov, 2023, https://www.gov.uk
- ASML / EUV chokepoint analyses, via CSET/CSIS/SemiAnalysis above

### Economy & labor

- Gen-AI: AI and the Future of Work, IMF SDN, 2024, https://www.imf.org
- GPTs are GPTs, Eloundou et al., 2023, https://arxiv.org/abs/2303.10130
- The Simple Macroeconomics of AI, Acemoglu, 2024, search NBER
- Generative AI at Work, Brynjolfsson et al., 2023, search NBER
- Experimental Evidence on Productivity Effects of GenAI, Noy & Zhang, Science 2023, search title
- Navigating the Jagged Technological Frontier, Dell'Acqua et al. (HBS), 2023, search title
- Anthropic Economic Index, https://www.anthropic.com/economic-index
- OpenResearch Unconditional Income Study, 2024, https://www.openresearchlab.org
- OECD Employment Outlook (AI chapters), https://www.oecd.org
- Goldman Sachs: 300M jobs exposure note, 2023, search title
- Power and Progress, Acemoglu & Johnson, 2023, **[BOOK]**

### Risk & benefit scenarios (both flanks: feeds worldview presets)

- Statement on AI Risk, CAIS, 2023, https://safe.ai
- Is Power-Seeking AI an Existential Risk?, Carlsmith, 2022, https://arxiv.org/abs/2206.13353
- Machines of Loving Grace, Amodei, 2024, https://darioamodei.com
- The Compendium, Leahy et al., https://www.thecompendium.ai
- If Anyone Builds It, Everyone Dies, Yudkowsky & Soares, 2025, **[BOOK]**
- The Precipice, Ord, 2020, **[BOOK]**
- Superintelligence, Bostrom, 2014, **[BOOK]**
- Human Compatible, Russell, 2019, **[BOOK]**
- AI as Normal Technology, Narayanan & Kapoor, 2025, search Knight First Amendment Institute
- AI Snake Oil, Narayanan & Kapoor, https://www.aisnakeoil.com + **[BOOK]**
- Pause Giant AI Experiments letter, FLI, 2023, https://futureoflife.org
- Existential Risk Persuasion Tournament (XPT), Tetlock et al., https://forecastingresearch.org

### Governance & coordination

- International Institutions for Advanced AI, Ho et al., 2023, https://arxiv.org/abs/2307.04699
- Racing to the Precipice, Armstrong, Bostrom, Shulman, 2016, search title (AI & Society)
- GovAI research library, https://www.governance.ai
- The Windfall Clause, O'Keefe et al. (GovAI), search title
- AI summit series outcomes (Bletchley → Seoul → Paris), search gov.uk / elysee.fr

### Serious games & learning science (our pedagogy)

- Exploring AI Futures Through Role Play, Avin et al., AIES 2020, https://dl.acm.org/doi/10.1145/3375627.3375817
- Intelligence Rising, https://www.intelligencerising.org (+ CSER page: https://www.cser.ac.uk/work/intelligence-rising/)
- Strategic Insights from Simulation Gaming of AI Race Dynamics, Gruetzemacher, Avin et al., 2024/25, search arXiv title
- Meta-analysis of serious-games learning outcomes, Wouters et al., 2013, search title
- Digital Games for Learning meta-analysis, Clark et al., 2016, search title
- Persuasive Games, Bogost, 2007, **[BOOK]**
- RAND wargaming methodology series, https://www.rand.org (search "wargaming")

### Live data & community

- MIT AI Risk Repository, https://airisk.mit.edu
- AI Incident Database, https://incidentdatabase.ai
- OECD.AI Policy Observatory, https://oecd.ai
- LMArena leaderboard, https://lmarena.ai
- Alignment Forum, https://www.alignmentforum.org
- 80,000 Hours AI problem profile, https://80000hours.org/problem-profiles/artificial-intelligence/
- BlueDot / AI Safety Fundamentals curricula, https://bluedot.org

## 12. The First Build, as ordered on day one

This was the build order the project started from. All six milestones shipped; the section stays as the historical record.

1. **Milestone A, Scaffold:** create repo per §7.2; commit this file to `docs/HANDOVER.md`; copy in `ROADMAP.md`; write README, CONTRIBUTING, GOVERNANCE, CoC, licenses; port §4 to ADR-001; create `data/sources.json` from §11 (verify URLs on fetch; fix or flag broken ones).
2. **Milestone B, Engine:** types, seeded RNG, pure `step()`, rival postures, eval-band logic, ending conditions; determinism tests (same seed ⇒ identical run) + schema validation in CI.
3. **Milestone C, Content:** 18 event cards, 10 policy cards, `parameters.json` with worldview presets, `scenario_2026.json`, complete `en.json`, every parameter carries `sourceIds`.
4. **Milestone D, UI:** Prototype 1 per §6 (text/CSS/emoji aesthetic); debrief screen; seed sharing; feedback link.
5. **Milestone E, Ship:** GitHub Pages deploy + PWA; exit-survey link; tag `v0.1.0-prototype`; open 20 good-first-issues (majority non-code).
6. **HOLD until Prototype gate passes:** asset pipeline (§8), China seat, event deck expansion.

**Working norms:** conventional commits · engine stays pure & tested · no hardcoded strings · no runtime network calls · every parameter change cites a source ID · keep bundle <5MB.

## 13. Open Questions (human decisions pending: don't block on these)

- Final name + domain + trademark search (candidates: Race Conditions / Takeoff / Critical Window)
- Discord vs Matrix for community hub
- Fiscal sponsor selection; grant application order
- Advisory board candidates (5–8 outreach targets)
- Steam page timing (wishlist campaign at alpha or 1.0)

---

_This document, the roadmap and the research bibliography were the complete project base. The build followed. Make it fun first._
