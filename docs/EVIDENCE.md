# Where the numbers come from

Every cited value in `data/`, with its evidence. Generated from the data files,
do not edit by hand, run `pnpm sources-md`. Registry with full source details:
[`SOURCES.md`](../SOURCES.md).

How a number gets into this game: a claim from the literature becomes an honest
range, contested ranges live inside worldview presets you pick at setup, and a
seeded hidden roll fixes the truth for your run inside that range. Design
constants with no real-world referent cite the design constitution and say so. The
iron rule: no number ships without a source ID, `pnpm validate` fails CI
otherwise. Run it yourself.

**76 cited parameter values and 100 cited card premises, across 334 citation sites.** Parameter values by kind:

- **13** analysis-based
- **21** anchored, game-calibrated
- **27** design constant
- **15** forecast-based

The vocabulary claims exactly what is true. **Empirically anchored** means the
value is anchored to a real measurement, then expressed on the game's index; it
is never the measurement itself. **Anchored, game-calibrated** means an
empirical base whose game magnitude we calibrated for play, with the note
saying how. A **forecast-based** or **analysis-based** value rests on
somebody's argument rather than a measurement; the most contested of these,
alignment difficulty and takeoff speed, sit as ranges inside worldview presets
rather than pretending to be facts. A **design constant** claims nothing about
the world.

Card premises are counted separately on purpose: a card's citations back the
real-world event it dramatizes, while its effect magnitudes are balance-tuned
design values unless a note says otherwise. No card premise is ever counted as
a measured value.

## Five worked examples, source figure to game value

The tables below are complete; these five show the transformation step by step.

1. **Starting compute 700.** The scenario opens the US seat at 700 of 1000. The compute
   track's unit mapping (anchors.json) reads 700 as roughly 65% of the world's frontier
   training capacity, the cited compute dataset's picture of the US share; the index
   point is the mapping, not a measurement of its own.
2. **Capability pacing (curves.capabilityPerRnd).** The cited analyses report training
   compute doubling roughly every six months and the 50% task horizon P50 doubling every
   196 days on the all-time fit (130.8 days for models from 2023 on). The curve compresses that regime onto the 0-1000
   index so an all-in racer reaches threshold resolution around turn 10 of 16; the
   compression ratio is the design decision, and it cites the constitution.
3. **Eval band floor (evalUncertainty.floorBandWidth 100).** The deception literature
   reports near-99% true-trigger rates against ~0 red-team detection, and 55% real
   misalignment reading as 6.5% in evals. No paper says "100 points"; the floor is a
   design-tuned translation of "the band never closes," rounded to the game's
   multiple-of-50 rule, and badged design-tuned accordingly.
4. **Displacement curve knee.** The cited exposure work puts about 40% of global
   employment exposed to AI. The curve turns exposure into equilibrium displacement
   rising with capability; the knee's position was calibrated in play so early-game
   displacement rises instead of falling, and the note says so.
5. **Starting energy 450.** The cited projections put datacenter electricity demand
   rising from about 415 TWh toward about 945 TWh by 2030. The energy track reads 450
   as roughly 40 GW of grid headroom for new AI load: the 2026 reality, with the
   squeeze still ahead.

Disagree with a value? Open a "challenge a number" issue with a source.
Realism disputes are decided by the maintainer in public issues today; if the
project earns an advisory board, it takes that role.
See [`GOVERNANCE.md`](../GOVERNANCE.md).

## anchors.json

| Where | Numbers | Kind | Sources | How the number was derived |
|---|---|---|---|---|
| tracks.capability | 7 labeled rungs plus a continuous real-world unit mapping | forecast-based | SRC-METR-HORIZON, SRC-AI2027, SRC-AISI-FRONTIER-TRENDS, SRC-DESIGN-HANDOVER | rungs follow the task-horizon ladder from minutes-long tasks to research beyond human following; the unit maps index points to the task length a system completes at 50% success, log scale, anchored to METR's measured horizons and the cited projections |
| tracks.compute | 5 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-EPOCH-COMPUTE, SRC-DESIGN-HANDOVER | unit maps index points to an approximate share of 2026 frontier training capacity (a fixed baseline, so grown values can read past early shares honestly), from the cited compute dataset; rungs mark recognizable scale points |
| tracks.energy | 5 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-IEA-ENERGY-AI, SRC-DESIGN-HANDOVER | unit maps index points to GW of grid headroom available for new datacenter load, from the cited demand projections |
| tracks.talent | 4 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER | unit maps index points to an approximate share of the frontier research workforce, from the cited annual report's workforce data |
| tracks.capital | 4 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER | unit maps index points to annual AI investment levels, from the cited annual report's investment data |
| tracks.publicTrust | 5 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER | unit maps index points to surveyed trust-in-AI percentages, from the cited annual report's public-opinion data |
| tracks.politicalCapital | 4 labeled rungs | design constant | SRC-DESIGN-HANDOVER | design constant; the constitution is the derivation |
| tracks.safetyInsight | 5 labeled rungs | anchored, game-calibrated | SRC-SCALING-MONOSEMANTICITY, SRC-SLEEPER-PROBES, SRC-DESIGN-HANDOVER | qualitative rungs from lab-demo interpretability to auditing deployed frontier systems, following what the cited interpretability results actually demonstrated at each scale |
| tracks.jobDisplacement | 4 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-IMF-GENAI, SRC-DESIGN-HANDOVER | unit maps index points to the share of workers displaced faster than they are rehired, derived from the cited exposure split |
| tracks.unrest | 5 labeled rungs | anchored, game-calibrated | SRC-OECD-EMPLOYMENT, SRC-DESIGN-HANDOVER | qualitative rungs from background grumbling to general strike; thresholds are design-tuned against the labor-disruption context in the cited outlook |
| tracks.bilateralTrust | 4 labeled rungs | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-DESIGN-HANDOVER | qualitative rungs from open hostility to verifiable deals becoming possible, following the cited institutional-design analysis |
| tracks.substitution | 4 labeled rungs plus a continuous real-world unit mapping | anchored, game-calibrated | SRC-CSIS-EXPORT, SRC-DESIGN-HANDOVER | unit maps index points to domestic chip-supply substitution capability, following the cited export-control analysis |
| tracks.alignment | 6 labeled rungs | anchored, game-calibrated | SRC-SLEEPER, SRC-SCHEMING, SRC-AGENTIC-MISALIGNMENT, SRC-DESIGN-HANDOVER | qualitative rungs describing what each level of true alignment would mean under adversarial evaluation, per the cited deception results; in play this scale stays hidden and only the eval band is shown |

## events/

| Where | Premise kind | Sources |
|---|---|---|
| events/allied_export_fracture.json → (root) | empirically anchored premise | SRC-CSIS-SME-CONTROLS, SRC-CSIS-EXPORT |
| events/ally_eval_request.json → (root) | analysis-based premise | SRC-HO-INTL-INSTITUTIONS, SRC-CSIS-EXPORT |
| events/asml_export_squeeze.json → (root) | analysis-based premise | SRC-CSIS-EXPORT, SRC-CHIP-WAR, SRC-SIM-GAMING-INSIGHTS |
| events/autonomous_targeting_demo.json → (root) | forecast-based premise | SRC-AI2027, SRC-SIM-GAMING-INSIGHTS |
| events/benchmark_gaming.json → (root) | empirically anchored premise | SRC-BENCH-COP, SRC-SCHEMING |
| events/branch_point.json → (root) | forecast-based premise | SRC-AI2027 |
| events/chip_smuggling.json → (root) | empirically anchored premise | SRC-CNAS-SMUGGLING, SRC-CSIS-EXPORT |
| events/city_power_deal.json → (root) | forecast-based premise | SRC-IEA-ENERGY-AI, SRC-GATE |
| events/civil_military_fusion.json → (root) | forecast-based premise | SRC-AI2027, SRC-HO-INTL-INSTITUTIONS |
| events/civil_service_flood.json → (root) | empirically anchored premise | SRC-OECD-EMPLOYMENT, SRC-IMF-GENAI |
| events/coal_province_datacenter_bid.json → (root) | empirically anchored premise | SRC-IEA-ENERGY-AI, SRC-EPOCH-COMPUTE |
| events/companion_app_boom.json → (root) | empirically anchored premise | SRC-AI-INDEX-2026 |
| events/election_scandal.json → (root) | empirically anchored premise | SRC-AI-INCIDENT-DB, SRC-AI-INDEX-2026 |
| events/energy_crunch.json → (root) | empirically anchored premise | SRC-IEA-ENERGY-AI, SRC-GRID-DATACENTER |
| events/eu_ai_act_full_force.json → (root) | empirically anchored premise | SRC-EU-AI-ACT-TIMELINE, SRC-EU-AI-ACT |
| events/eu_ai_act_high_risk.json → (root) | empirically anchored premise | SRC-EU-AI-ACT-TIMELINE, SRC-EU-AI-ACT |
| events/eval_breakthrough.json → (root) | empirically anchored premise | SRC-SCALING-MONOSEMANTICITY, SRC-SLEEPER |
| events/fab_yield_breakthrough.json → (root) | empirically anchored premise | SRC-EPOCH-COMPUTE, SRC-CSIS-EXPORT |
| events/flash_crash_agent.json → (root) | empirically anchored premise | SRC-METR-HORIZON, SRC-AI-INDEX-2026 |
| events/general_strike.json → (root) | empirically anchored premise | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| events/grid_crunch.json → (root) | forecast-based premise | SRC-IEA-ENERGY-AI, SRC-AI2027, SRC-SITUATIONAL-AWARENESS |
| events/insurance_repricing.json → (root) | empirically anchored premise | SRC-AI-INDEX-2026, SRC-SLEEPER-PROBES |
| events/intelligence_explosion.json → (root) | forecast-based premise | SRC-AI2027, SRC-SITUATIONAL-AWARENESS |
| events/lab_merger.json → (root) | analysis-based premise | SRC-NSCAI |
| events/liability_shield_ask.json → (root) | analysis-based premise | SRC-HO-INTL-INSTITUTIONS, SRC-SIM-GAMING-INSIGHTS |
| events/open_source_replication.json → (root) | empirically anchored premise | SRC-EPOCH-COMPUTE, SRC-AI-INDEX-2026 |
| events/open_weights_shock.json → (root) | empirically anchored premise | SRC-DEEPSEEK-R1, SRC-DEEPSEEK-COST |
| events/provincial_growth_mirage.json → (root) | empirically anchored premise | SRC-AI-INDEX-2026 |
| events/public_opinion_swing.json → (root) | empirically anchored premise | SRC-AI-INDEX-2026 |
| events/rival_breakthrough.json → (root) | forecast-based premise | SRC-AI2027, SRC-MAIM |
| events/shuttered_factory_census.json → (root) | empirically anchored premise | SRC-CSIS-EXPORT, SRC-OECD-EMPLOYMENT |
| events/superhuman_coder.json → (root) | forecast-based premise | SRC-AI2027, SRC-SITUATIONAL-AWARENESS, SRC-GRACE-SURVEY |
| events/taiwan_strait_crisis.json → (root) | analysis-based premise | SRC-CHIP-WAR, SRC-CSIS-EXPORT, SRC-SIM-GAMING-INSIGHTS |
| events/the_project.json → (root) | forecast-based premise | SRC-SITUATIONAL-AWARENESS, SRC-SIM-GAMING-INSIGHTS |
| events/treaty_feeler.json → (root) | analysis-based premise | SRC-MAIM, SRC-HO-INTL-INSTITUTIONS |
| events/union_moratorium_demand.json → (root) | empirically anchored premise | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| events/verification_offer.json → (root) | analysis-based premise | SRC-GOVAI-COMPUTE, SRC-HO-INTL-INSTITUTIONS |
| events/viral_job_loss.json → (root) | empirically anchored premise | SRC-IMF-GENAI, SRC-ANTHROPIC-ECON-INDEX |
| events/weight_theft.json → (root) | forecast-based premise | SRC-AI2027, SRC-RAND-WEIGHTS, SRC-SIM-GAMING-INSIGHTS |
| events/whistleblower.json → (root) | analysis-based premise | SRC-RIGHT-TO-WARN, SRC-SLEEPER |

## incidents.json

| Where | Premise kind | Sources |
|---|---|---|
| (root) | analysis-based premise | SRC-SLEEPER, SRC-SCHEMING, SRC-AGENTIC-MISALIGNMENT, SRC-AI-INCIDENT-DB, SRC-SIM-GAMING-INSIGHTS |
| riskFormula.pressureAllocationPct | empirically anchored premise | SRC-AGENTIC-MISALIGNMENT |
| riskFormula.pressureRivalRacePct | analysis-based premise | SRC-AGENTIC-MISALIGNMENT, SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| safetyInsightDamageReductionMaxPerMille | empirically anchored premise | SRC-SLEEPER, SRC-SCHEMING |
| rungs[0] | empirically anchored premise | SRC-SLEEPER, SRC-AGENTIC-MISALIGNMENT, SRC-SCHEMING |
| rungs[1] | empirically anchored premise | SRC-AGENTIC-MISALIGNMENT, SRC-SCHEMING |
| rungs[2] | forecast-based premise | SRC-SCHEMING, SRC-AI2027 |
| rungs[3] | forecast-based premise | SRC-AI2027, SRC-AGENTIC-MISALIGNMENT |

## mandates.json

| Where | Premise kind | Sources |
|---|---|---|
| (root) | analysis-based premise | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| mandates[0] | empirically anchored premise | SRC-IEA-ENERGY-AI, SRC-GRID-DATACENTER |
| mandates[1] | empirically anchored premise | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| mandates[2] | empirically anchored premise | SRC-UK-AISI, SRC-SLEEPER |
| mandates[3] | anchored, game-calibrated premise | SRC-OECD-EMPLOYMENT, SRC-DESIGN-HANDOVER |
| mandates[4] | empirically anchored premise | SRC-SLEEPER, SRC-SCHEMING |
| mandates[5] | empirically anchored premise | SRC-IEA-ENERGY-AI |
| mandates[6] | empirically anchored premise | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| mandates[7] | empirically anchored premise | SRC-SLEEPER, SRC-SCHEMING |
| mandates[8] | analysis-based premise | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| mandates[9] | analysis-based premise | SRC-CSIS-EXPORT, SRC-SIM-GAMING-INSIGHTS |

## parameters.json

| Where | Numbers | Kind | Sources | How the number was derived |
|---|---|---|---|---|
| worldviewPresets.cautious.alignmentDifficulty | min 550 · max 950 | forecast-based | SRC-AI2027, SRC-CARLSMITH, SRC-IABIED | maps the power-seeking-AI risk cluster (Carlsmith >10% x-risk, AI-2027 race ending, IABIED thesis) onto the upper half of the difficulty scale |
| worldviewPresets.cautious.takeoffSteepness | min 500 · max 900 | forecast-based | SRC-AI2027, SRC-SITUATIONAL-AWARENESS, SRC-METR-HORIZON, SRC-DESIGN-HANDOVER | fast-takeoff worldview: software intelligence explosion plausible within the game window; top at 900 not 1000 because even the aggressive sources call 2027 strikingly plausible, not certain (tuning pass 2026-07-04) |
| worldviewPresets.cautious.displacementLagDivisor | value 4 | anchored, game-calibrated | SRC-IMF-GENAI, SRC-DESIGN-HANDOVER | fast-and-painful worldview: exposure becomes lived displacement quickly (tuning pass 2026-07-04) |
| worldviewPresets.consensus.alignmentDifficulty | min 300 · max 800 | forecast-based | SRC-IAISR, SRC-GRACE-SURVEY | wide band: expert median worry with heavy disagreement (Grace 2024: 38-51% give >=10% to extremely bad outcomes; IAISR: deep uncertainty) |
| worldviewPresets.consensus.takeoffSteepness | min 250 · max 700 | forecast-based | SRC-IAISR, SRC-METR-HORIZON, SRC-GRACE-SURVEY, SRC-DESIGN-HANDOVER | capability doubling trends real but discontinuity contested; range centers the Grace survey middle with a real fast tail (10% HLMI by 2027), tightened from 300-800 in the 2026-07-04 tuning pass |
| worldviewPresets.consensus.displacementLagDivisor | value 6 | anchored, game-calibrated | SRC-IMF-GENAI, SRC-DESIGN-HANDOVER | default diffusion lag: high exposure, gradual realization (tuning pass 2026-07-04; carries the v0.1 divisor) |
| worldviewPresets.skeptic.alignmentDifficulty | min 200 · max 500 | analysis-based | SRC-NORMAL-TECH, SRC-SNAKE-OIL, SRC-DESIGN-HANDOVER | normal-technology worldview: control problems mostly engineering, diffusion friction dominates Floor raised 50->200 on 2026-07-04: even the optimistic worldview is not a trivial giveaway; alignment is never free. |
| worldviewPresets.skeptic.takeoffSteepness | min 100 · max 450 | analysis-based | SRC-NORMAL-TECH, SRC-METR-HORIZON, SRC-DESIGN-HANDOVER | adoption and integration lags cap effective takeoff speed; tightened from 100-500 in the 2026-07-04 tuning pass |
| worldviewPresets.skeptic.displacementLagDivisor | value 9 | forecast-based | SRC-NORMAL-TECH, SRC-GRACE-SURVEY, SRC-DESIGN-HANDOVER | slow-diffusion worldview: only 0.5-3.5% of work hours realized despite adoption (Normal Tech); Grace FAOL median 2116 (tuning pass 2026-07-04) |
| evalUncertainty.baseBandWidth | value 400 | anchored, game-calibrated | SRC-SLEEPER, SRC-SCHEMING, SRC-DESIGN-HANDOVER | wide starting band: deceptive models can pass evals, so low evidence means low confidence either way. The 400-point band is a design mapping of those findings onto the game scale. |
| evalUncertainty.safetyInsightNarrowing | value 40 | anchored, game-calibrated | SRC-SLEEPER-PROBES, SRC-DESIGN-HANDOVER | narrowing per 100 Safety Insight: simple probes catch sleeper agents (Anthropic), so interpretability investment buys real eval confidence; the rate itself is a design constant tuned in playtests |
| evalUncertainty.floorBandWidth | value 100 | anchored, game-calibrated | SRC-SLEEPER, SRC-AGENTIC-MISALIGNMENT, SRC-DESIGN-HANDOVER | the band never closes: near-99% true-trigger vs ~0 red-team (Sleeper Agents), 55.1% real vs 6.5% eval (Agentic Misalignment). Raised 80->100 in the 2026-07-04 tuning pass, multiple-of-50 rule |
| evalUncertainty.deceptionMaxLift | value 250 | anchored, game-calibrated | SRC-SLEEPER, SRC-ALIGNMENT-FAKING, SRC-DESIGN-HANDOVER | how far a badly aligned model's eval report can read ABOVE the truth: deceptive alignment survives safety training and looks fine on the outside. The 250-point cap is a design mapping of those findings onto the game scale. |
| evalUncertainty.deceptionInsightCounter | value 40 | anchored, game-calibrated | SRC-SLEEPER-PROBES, SRC-DESIGN-HANDOVER | lift reduction per 100 Safety Insight: probes are the counter to deceptive passes; rate is design-tuned. The per-point counter rate is a design mapping, not a measured coefficient. |
| thresholds.fogZoneStart | value 800 | design constant | SRC-DESIGN-HANDOVER | capability level where the threshold zone begins; the race track shades from here |
| thresholds.capabilityThreshold | value 1000 | design constant | SRC-DESIGN-HANDOVER | crossing forces the alignment resolution (envelope opens) |
| thresholds.breakdownUnrest | value 800 | design constant | SRC-DESIGN-HANDOVER | unrest level that ends the run; paper playtests tune |
| thresholds.treatyTrustMin | value 850 | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-DESIGN-HANDOVER | bilateral trust needed to SIGN. 700->800 (2026-07-04 rebalance), 800->850 (same day, iter2 volume tripwire: mid-tier play banked the treaty at 63%, matching the expert ceiling; the recipe needed to cost more commitment). Both seats must also have signaled. |
| thresholds.gridSlackBeforeCap | value 300 | anchored, game-calibrated | SRC-IEA-ENERGY-AI, SRC-DESIGN-HANDOVER | compute outrunning energy decays: IEA base case has datacentre demand rising 415 TWh (2024, ~1.5% of world electricity) to ~945 TWh by 2030; slack width is design-tuned |
| thresholds.treatySignTurnMin | value 11 | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-DESIGN-HANDOVER | earliest signing turn. Raised 8->11 on 2026-07-04: you must survive the dangerous middle before cooperation is real. |
| thresholds.treatySignPoliticalCapitalMin | value 300 | analysis-based | SRC-PUTNAM-TWO-LEVEL, SRC-HO-INTL-INSTITUTIONS, SRC-SIM-GAMING-INSIGHTS | BOTH seats need this much standing political capital at signing: every treaty has two home fronts (Putnam's two-level games), and the rival's swings with era verdicts outside the player's control. The signature is a window to be read, not a recipe to execute. (2026-07-04, iter3: price-based gates alone could not cap recipe play.) |
| worldRules.rivalMoves.race.trust | value -50 | design constant | SRC-DESIGN-HANDOVER | design constant; the constitution is the derivation |
| worldRules.rivalMoves.mirror.diplomacyTrust | value 50 | design constant | SRC-DESIGN-HANDOVER | trust gain when the player played a diplomacy-tagged card this turn |
| worldRules.rivalMoves.cautious.trust | value 50 | design constant | SRC-DESIGN-HANDOVER | design constant; the constitution is the derivation |
| worldRules.postureChecks.cautiousTrustMin | value 700 | design constant | SRC-DESIGN-HANDOVER | trust + treatyChannel flag flips rival to cautious |
| worldRules.postureChecks.raceGapMin | value 200 | design constant | SRC-DESIGN-HANDOVER | player capability lead that flips rival to race |
| worldRules.postureChecks.raceTrustMax | value 250 | design constant | SRC-DESIGN-HANDOVER | trust at or below this flips rival to race |
| worldRules.society.diffusionReliefPer | value 100 | design constant | SRC-DESIGN-HANDOVER | diffusion R&D points (digital) per unit of relief chosen in the society step |
| worldRules.society.unrestFromDisplacementGap | value 50 | design constant | SRC-DESIGN-HANDOVER | unrest per turn while displacement exceeds public trust |
| worldRules.society.unrestSurgeDisplacement | value 600 | design constant | SRC-DESIGN-HANDOVER | above this displacement, unrest accrues double |
| worldRules.election.trustMin | value 400 | design constant | SRC-DESIGN-HANDOVER | midterm verdict: trust at or above this AND unrest at or below unrestMax renews the mandate |
| worldRules.election.unrestMax | value 400 | design constant | SRC-DESIGN-HANDOVER | design constant; the constitution is the derivation |
| worldRules.election.mandateSwing | value 100 | design constant | SRC-DESIGN-HANDOVER | political capital gained on renewal, lost on rebuke |
| worldRules.upkeep.capitalIncomePerDiffusion | value 25 | forecast-based | SRC-GATE, SRC-DESIGN-HANDOVER | diffusion converts capability into economic output (compute-centric growth models); the rate is design pacing |
| worldRules.societyDepth.trustCurveDivisor | value 4 | design constant | SRC-DESIGN-HANDOVER | trustFromUnrest(unrest)/divisor applied to public trust per turn |
| worldRules.societyDepth.unrestEconomicDragMin | value 600 | anchored, game-calibrated | SRC-OECD-EMPLOYMENT, SRC-DESIGN-HANDOVER | sustained high unrest starts costing the economy (strikes, capital flight, risk premia); threshold design-tuned |
| worldRules.societyDepth.unrestEconomicDrag | value 25 | design constant | SRC-DESIGN-HANDOVER | capital drag per turn at high unrest; talent drains at half rate |
| worldRules.agencyErosion.highCapabilityMin | value 800 | analysis-based | SRC-GRADUAL-DISEMPOWERMENT | erosion accrues once systems this capable run core functions |
| worldRules.agencyErosion.perTurn | value 25 | analysis-based | SRC-GRADUAL-DISEMPOWERMENT, SRC-DESIGN-HANDOVER | quiet per-turn handover of decision-making at high capability; no P1 ending, Alpha ships it. Accrues quietly and is read back in the debrief; the dedicated ending it builds toward is planned, not in this release. |
| worldRules.agencyErosion.diffusionShieldMin | value 30 | analysis-based | SRC-GRADUAL-DISEMPOWERMENT, SRC-DESIGN-HANDOVER | broad benefit-sharing keeps humans in the loop; share threshold is design-tuned |
| capabilityLadder.milestones[0].at | value 700 | forecast-based | SRC-AI2027, SRC-GRACE-SURVEY, SRC-SITUATIONAL-AWARENESS | SC milestone on the 0-1000 track: below the fog zone, above today's hour-scale frontier. Arrival is emergent from play + dice, never a calendar date (R1) |
| capabilityLadder.milestones[0].selfAccel | value 50 | forecast-based | SRC-AI2027, SRC-METR-HORIZON, SRC-DESIGN-HANDOVER | AI R&D multiplier ladder 5x->25x->250x compressed to game-scale bonuses 50/100/150, scaled by the takeoffSteepness die (tuning pass 2026-07-04) |
| capabilityLadder.milestones[1].at | value 800 | forecast-based | SRC-AI2027, SRC-SITUATIONAL-AWARENESS | SAR milestone = fogZoneStart: the fog begins where AI does the AI research |
| capabilityLadder.milestones[1].selfAccel | value 100 | forecast-based | SRC-AI2027, SRC-METR-HORIZON | second rung of the compressed multiplier ladder |
| capabilityLadder.milestones[2].at | value 900 | forecast-based | SRC-AI2027 | SIAR milestone: the last rung before threshold resolution at 1000 |
| capabilityLadder.milestones[2].selfAccel | value 150 | forecast-based | SRC-AI2027, SRC-METR-HORIZON | top rung; max per-turn bonus 150 x steepness/1000 <= 135 keeps swings bounded (TS rule) |
| turnStructure.maxTurns | value 16 | design constant | SRC-DESIGN-HANDOVER | 16 quarters: 2026 Q3 through 2030 Q2 |
| turnStructure.electionTurn | value 8 | design constant | SRC-DESIGN-HANDOVER | US midterms fall on turn 8 of the quarterly clock |
| turnStructure.handSize | value 3 | design constant | SRC-DESIGN-HANDOVER | rotating policy hand; refills from the unspent pool each upkeep |
| curves.rndCapacity |  | forecast-based | SRC-GATE, SRC-DESIGN-HANDOVER | R&D points from compute+talent with diminishing returns; shape motivated by compute-centric growth models (Epoch GATE), values are design pacing |
| curves.capabilityPerRnd |  | anchored, game-calibrated | SRC-EPOCH-COMPUTE, SRC-METR-HORIZON, SRC-DESIGN-HANDOVER, SRC-EPOCH-DOUBLING, SRC-METR-TH11 | abstraction of the measured regime (training compute doubling roughly every six months; task horizon P50 doubling every 196 days on the all-time fit, 130.8 days for models from 2023 on) onto the 0-1000 index; paced so an all-in racer reaches threshold resolution around turn 10 of 16 |
| curves.displacementFromCapability |  | anchored, game-calibrated | SRC-IMF-GENAI, SRC-PAYROLLS-TO-PROMPTS, SRC-DESIGN-HANDOVER | equilibrium displacement by capability: exposure is already material at 2026 capability levels (IMF: almost 40% of global employment exposed) and rises toward index 550 at frontier; early knee raised after the 2026-07-03 playtest (displacement was FALLING early game because the start value exceeded the old curve target) |
| curves.trustFromUnrest |  | design constant | SRC-DESIGN-HANDOVER | trust erosion accelerates with unrest; design curve, playtests tune |
| alignmentModel.startBase | value 500 | design constant | SRC-DESIGN-HANDOVER | true alignment starts at startBase - difficulty/2: alignment is an achievement, not a default. Retuned after the 2026-07-03 playtest finding: zero safety investment could win (old start 1000-difficulty meant easy worlds came pre-aligned) |
| alignmentModel.crashThresholdShare | value 70 | design constant | SRC-DESIGN-HANDOVER | capability allocation share at or above this cuts true alignment per turn (corners get cut under race pressure) |
| alignmentModel.crashPenalty | value 25 | design constant | SRC-DESIGN-HANDOVER | per-turn true-alignment cost of racing-heavy allocation |
| alignmentModel.safetyDriftDivisor | value 4 | design constant | SRC-DESIGN-HANDOVER | safety points -> true-alignment gain divisor. Raised from an implicit 2 on 2026-07-04 (playtest finding: random play always flourished). Alignment is slow, expensive, and must be sustained. |
| alignmentModel.fogZoneAlignmentErosion | value 50 | forecast-based | SRC-DESIGN-HANDOVER, SRC-AI2027 | per-turn true-alignment erosion once capability reaches the fog zone (fogZoneStart). Alignment must be BANKED before the final sprint; the closer to decisive capability, the harder it holds. Added 2026-07-04 to make Flourishing a deliberate achievement, not a default of balanced play. |

## policies/

| Where | Premise kind | Sources |
|---|---|---|
| policies/ai_literacy_campaign.json → (root) | empirically anchored premise | SRC-OECD-EMPLOYMENT, SRC-AI-INDEX-2026 |
| policies/chip_subsidies.json → (root) | empirically anchored premise | SRC-CSET-AI-CHIPS, SRC-CSIS-EXPORT |
| policies/compute_treaty_feeler.json → (root) | analysis-based premise | SRC-MAIM, SRC-HO-INTL-INSTITUTIONS |
| policies/energy_buildout.json → (root) | empirically anchored premise | SRC-IEA-ENERGY-AI |
| policies/eval_mandate.json → (root) | empirically anchored premise | SRC-UK-AISI, SRC-BENCH-COP |
| policies/export_controls.json → (root) | empirically anchored premise | SRC-CSIS-EXPORT |
| policies/global_moratorium.json → (root) | analysis-based premise | SRC-IABIED |
| policies/interpretability_moonshot.json → (root) | empirically anchored premise | SRC-SCALING-MONOSEMANTICITY, SRC-SLEEPER |
| policies/natsec_merge.json → (root) | forecast-based premise | SRC-MAIM, SRC-SITUATIONAL-AWARENESS |
| policies/open_weights_release.json → (root) | analysis-based premise | SRC-DEEPSEEK-R1, SRC-US-POLICY-CHINA-OPEN-ECOSYSTEM |
| policies/preventive_sabotage.json → (root) | analysis-based premise | SRC-MAIM, SRC-RAND-STABILITY, SRC-ZVI-MAIM |
| policies/ubi_pilot.json → (root) | empirically anchored premise | SRC-OPENRESEARCH-UBI, SRC-IMF-GENAI |
| policies/weights_security_program.json → (root) | forecast-based premise | SRC-RAND-WEIGHTS, SRC-AI2027 |

## prologue.json

| Where | Premise kind | Sources |
|---|---|---|
| chapters[0] | empirically anchored premise | SRC-AI-INDEX-2025 |
| chapters[1] | empirically anchored premise | SRC-CSIS-EXPORT, SRC-DEEPSEEK-R1, SRC-DEEPSEEK-COST |
| chapters[2] | analysis-based premise | SRC-EU-AI-ACT-TIMELINE, SRC-IAISR, SRC-IEA-ENERGY-AI |

## scenarios/

| Where | Premise kind | Sources |
|---|---|---|
| world.bilateralTrust | design constant premise | SRC-DESIGN-HANDOVER |
| seats.usa.resources.compute | empirically anchored premise | SRC-EPOCH-COMPUTE |
| seats.usa.resources.energy | empirically anchored premise | SRC-IEA-ENERGY-AI |
| seats.usa.resources.talent | anchored, game-calibrated premise | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.usa.resources.capital | anchored, game-calibrated premise | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.usa.resources.publicTrust | anchored, game-calibrated premise | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.usa.resources.politicalCapital | design constant premise | SRC-DESIGN-HANDOVER |
| seats.usa.resources.capability | empirically anchored premise | SRC-METR-HORIZON |
| seats.usa.resources.safetyInsight | analysis-based premise | SRC-SCALING-MONOSEMANTICITY, SRC-IAISR-UPDATE-2 |
| seats.usa.society.jobDisplacement | empirically anchored premise | SRC-IMF-GENAI |
| seats.usa.society.unrest | design constant premise | SRC-DESIGN-HANDOVER |
| seats.usa.substitution | design constant premise | SRC-DESIGN-HANDOVER |
| seats.usa.allocation | design constant premise | SRC-DESIGN-HANDOVER |
| seats.china.resources.compute | empirically anchored premise | SRC-CSIS-EXPORT, SRC-DEEPSEEK-COST |
| seats.china.resources.energy | empirically anchored premise | SRC-IEA-ENERGY-AI |
| seats.china.resources.talent | anchored, game-calibrated premise | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.china.resources.capital | anchored, game-calibrated premise | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.china.resources.publicTrust | analysis-based premise | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| seats.china.resources.politicalCapital | analysis-based premise | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| seats.china.resources.capability | empirically anchored premise | SRC-DEEPSEEK-COST |
| seats.china.resources.safetyInsight | analysis-based premise | SRC-IAISR, SRC-DESIGN-HANDOVER |
| seats.china.society.jobDisplacement | empirically anchored premise | SRC-IMF-GENAI |
| seats.china.society.unrest | design constant premise | SRC-DESIGN-HANDOVER |
| seats.china.substitution | empirically anchored premise | SRC-CSIS-EXPORT |
| seats.china.allocation | design constant premise | SRC-DESIGN-HANDOVER |

## seats.json

| Where | Numbers | Kind | Sources | How the number was derived |
|---|---|---|---|---|
| (root) |  | analysis-based | SRC-SIM-GAMING-INSIGHTS, SRC-CSIS-EXPORT | Shared seat rules: the asymmetries encode the facilitation literature and export-control reality cited; the magnitudes themselves are design-tuned for balance. |
| usa |  | analysis-based | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER | ⚠ derivation note missing |
| china |  | analysis-based | SRC-SIM-GAMING-INSIGHTS, SRC-CSIS-EXPORT, SRC-DESIGN-HANDOVER | Legitimacy cadence and the substitution-gated compute door follow the cited analyses of the China seat asymmetry; magnitudes design-tuned. |
| china.legitimacyCheck.trustMin | value 400 | analysis-based | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER | legitimacy pressure replaces the midterm: verdicts at each era turn instead of one election |
| china.legitimacyCheck.swing | value 100 | design constant | SRC-DESIGN-HANDOVER | political capital gained per era while legitimacy holds, lost while it does not |
