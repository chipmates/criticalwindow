# Where the numbers come from

Every cited value in `data/`, with its evidence. Generated from the data files,
do not edit by hand, run `pnpm sources-md`. Registry with full source details:
[`SOURCES.md`](../SOURCES.md).

How a number gets into this game: a claim from the literature becomes an honest
range, contested ranges live inside worldview presets you pick at setup, and a
seeded hidden roll fixes the truth for your run inside that range. Design
constants with no real-world referent cite the design handover and say so. The
iron rule: no number ships without a source ID, `pnpm validate` fails CI
otherwise. Run it yourself.

**188 cited values across 324 citation sites.** By kind:

- **22** analysis-based
- **50** design choice
- **29** forecast-based
- **87** measured

A **measured** value cites only empirical evidence. A **forecast-based** or
**analysis-based** value rests on somebody's argument about the future, which is
why it lives in a preset range instead of pretending to be a fact. A **design
choice** claims nothing about the world.

Disagree with a value? Open a "challenge a number" issue with a source. The
advisory board arbitrates realism disputes, see [`GOVERNANCE.md`](../GOVERNANCE.md).

## anchors.json

| Where | Numbers | Kind | Sources | How the number was derived |
|---|---|---|---|---|
| tracks.capability |  | forecast-based | SRC-METR-HORIZON, SRC-AI2027 |  |
| tracks.compute |  | measured | SRC-EPOCH-COMPUTE |  |
| tracks.energy |  | measured | SRC-IEA-ENERGY-AI |  |
| tracks.talent |  | measured | SRC-AI-INDEX-2026 |  |
| tracks.capital |  | measured | SRC-AI-INDEX-2026 |  |
| tracks.publicTrust |  | measured | SRC-AI-INDEX-2026 |  |
| tracks.politicalCapital |  | design choice | SRC-DESIGN-HANDOVER |  |
| tracks.safetyInsight |  | measured | SRC-SCALING-MONOSEMANTICITY, SRC-SLEEPER-PROBES |  |
| tracks.jobDisplacement |  | measured | SRC-IMF-GENAI |  |
| tracks.unrest |  | measured | SRC-OECD-EMPLOYMENT, SRC-DESIGN-HANDOVER |  |
| tracks.bilateralTrust |  | analysis-based | SRC-HO-INTL-INSTITUTIONS |  |
| tracks.substitution |  | measured | SRC-CSIS-EXPORT |  |

## events/

| Where | Kind | Sources |
|---|---|---|
| events/allied_export_fracture.json → (root) | measured | SRC-CSIS-SME-CONTROLS, SRC-CSIS-EXPORT |
| events/ally_eval_request.json → (root) | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-CSIS-EXPORT |
| events/asml_export_squeeze.json → (root) | measured | SRC-CSIS-EXPORT, SRC-CHIP-WAR, SRC-SIM-GAMING-INSIGHTS |
| events/autonomous_targeting_demo.json → (root) | forecast-based | SRC-AI2027, SRC-SIM-GAMING-INSIGHTS |
| events/benchmark_gaming.json → (root) | measured | SRC-BENCH-COP, SRC-SCHEMING |
| events/branch_point.json → (root) | forecast-based | SRC-AI2027 |
| events/chip_smuggling.json → (root) | measured | SRC-CNAS-SMUGGLING, SRC-CSIS-EXPORT |
| events/city_power_deal.json → (root) | forecast-based | SRC-IEA-ENERGY-AI, SRC-GATE |
| events/civil_military_fusion.json → (root) | forecast-based | SRC-AI2027, SRC-HO-INTL-INSTITUTIONS |
| events/civil_service_flood.json → (root) | measured | SRC-OECD-EMPLOYMENT, SRC-IMF-GENAI |
| events/coal_province_datacenter_bid.json → (root) | measured | SRC-IEA-ENERGY-AI, SRC-EPOCH-COMPUTE |
| events/companion_app_boom.json → (root) | measured | SRC-AI-INDEX-2026 |
| events/election_scandal.json → (root) | measured | SRC-AI-INCIDENT-DB, SRC-AI-INDEX-2026 |
| events/energy_crunch.json → (root) | measured | SRC-IEA-ENERGY-AI, SRC-GRID-DATACENTER |
| events/eu_ai_act_full_force.json → (root) | measured | SRC-EU-AI-ACT-TIMELINE, SRC-EU-AI-ACT |
| events/eu_ai_act_high_risk.json → (root) | measured | SRC-EU-AI-ACT-TIMELINE, SRC-EU-AI-ACT |
| events/eval_breakthrough.json → (root) | measured | SRC-SCALING-MONOSEMANTICITY, SRC-SLEEPER |
| events/fab_yield_breakthrough.json → (root) | measured | SRC-EPOCH-COMPUTE, SRC-CSIS-EXPORT |
| events/flash_crash_agent.json → (root) | measured | SRC-METR-HORIZON, SRC-AI-INDEX-2026 |
| events/general_strike.json → (root) | measured | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| events/grid_crunch.json → (root) | forecast-based | SRC-IEA-ENERGY-AI, SRC-AI2027, SRC-SITUATIONAL-AWARENESS |
| events/insurance_repricing.json → (root) | measured | SRC-AI-INDEX-2026, SRC-SLEEPER-PROBES |
| events/intelligence_explosion.json → (root) | forecast-based | SRC-AI2027, SRC-SITUATIONAL-AWARENESS |
| events/lab_merger.json → (root) | analysis-based | SRC-NSCAI, SRC-CSET-LIBRARY |
| events/liability_shield_ask.json → (root) | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-SIM-GAMING-INSIGHTS |
| events/open_source_replication.json → (root) | measured | SRC-EPOCH-COMPUTE, SRC-AI-INDEX-2026 |
| events/open_weights_shock.json → (root) | measured | SRC-DEEPSEEK-R1, SRC-DEEPSEEK-COST |
| events/provincial_growth_mirage.json → (root) | measured | SRC-AI-INDEX-2026 |
| events/public_opinion_swing.json → (root) | measured | SRC-AI-INDEX-2026 |
| events/rival_breakthrough.json → (root) | forecast-based | SRC-AI2027, SRC-MAIM |
| events/shuttered_factory_census.json → (root) | measured | SRC-CSIS-EXPORT, SRC-OECD-EMPLOYMENT |
| events/superhuman_coder.json → (root) | forecast-based | SRC-AI2027, SRC-SITUATIONAL-AWARENESS, SRC-GRACE-SURVEY |
| events/taiwan_strait_crisis.json → (root) | measured | SRC-CHIP-WAR, SRC-CSIS-EXPORT, SRC-SIM-GAMING-INSIGHTS |
| events/the_project.json → (root) | forecast-based | SRC-SITUATIONAL-AWARENESS, SRC-SIM-GAMING-INSIGHTS |
| events/treaty_feeler.json → (root) | analysis-based | SRC-MAIM, SRC-HO-INTL-INSTITUTIONS |
| events/union_moratorium_demand.json → (root) | measured | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| events/verification_offer.json → (root) | analysis-based | SRC-GOVAI-COMPUTE, SRC-HO-INTL-INSTITUTIONS |
| events/viral_job_loss.json → (root) | measured | SRC-IMF-GENAI, SRC-ANTHROPIC-ECON-INDEX |
| events/weight_theft.json → (root) | forecast-based | SRC-AI2027, SRC-RAND-WEIGHTS, SRC-SIM-GAMING-INSIGHTS |
| events/whistleblower.json → (root) | analysis-based | SRC-RIGHT-TO-WARN, SRC-SLEEPER |

## incidents.json

| Where | Kind | Sources |
|---|---|---|
| (root) | measured | SRC-SLEEPER, SRC-SCHEMING, SRC-AGENTIC-MISALIGNMENT, SRC-AI-INCIDENT-DB, SRC-SIM-GAMING-INSIGHTS |
| riskFormula.pressureAllocationPct | measured | SRC-AGENTIC-MISALIGNMENT |
| riskFormula.pressureRivalRacePct | measured | SRC-AGENTIC-MISALIGNMENT, SRC-SIM-GAMING-INSIGHTS |
| safetyInsightDamageReductionMaxPerMille | measured | SRC-SLEEPER, SRC-SCHEMING |
| rungs[0] | measured | SRC-SLEEPER, SRC-AGENTIC-MISALIGNMENT, SRC-SCHEMING |
| rungs[1] | measured | SRC-AGENTIC-MISALIGNMENT, SRC-SCHEMING |
| rungs[2] | forecast-based | SRC-SCHEMING, SRC-AI2027 |
| rungs[3] | forecast-based | SRC-AI2027, SRC-AGENTIC-MISALIGNMENT |

## mandates.json

| Where | Kind | Sources |
|---|---|---|
| (root) | design choice | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| mandates[0] | measured | SRC-IEA-ENERGY-AI, SRC-GRID-DATACENTER |
| mandates[1] | measured | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| mandates[2] | measured | SRC-UK-AISI, SRC-SLEEPER |
| mandates[3] | measured | SRC-OECD-EMPLOYMENT, SRC-DESIGN-HANDOVER |
| mandates[4] | measured | SRC-SLEEPER, SRC-SCHEMING |
| mandates[5] | measured | SRC-IEA-ENERGY-AI |
| mandates[6] | measured | SRC-IMF-GENAI, SRC-OECD-EMPLOYMENT |
| mandates[7] | measured | SRC-SLEEPER, SRC-SCHEMING |
| mandates[8] | design choice | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| mandates[9] | measured | SRC-CSIS-EXPORT, SRC-SIM-GAMING-INSIGHTS |

## parameters.json

| Where | Numbers | Kind | Sources | How the number was derived |
|---|---|---|---|---|
| worldviewPresets.cautious.alignmentDifficulty | min 550 · max 950 | forecast-based | SRC-AI2027, SRC-CARLSMITH, SRC-IABIED | maps the power-seeking-AI risk cluster (Carlsmith >10% x-risk, AI-2027 race ending, IABIED thesis) onto the upper half of the difficulty scale |
| worldviewPresets.cautious.takeoffSteepness | min 500 · max 900 | forecast-based | SRC-AI2027, SRC-SITUATIONAL-AWARENESS, SRC-METR-HORIZON | fast-takeoff worldview: software intelligence explosion plausible within the game window; top at 900 not 1000 because even the aggressive sources call 2027 strikingly plausible, not certain (tuning pass 2026-07-04) |
| worldviewPresets.cautious.displacementLagDivisor | value 4 | measured | SRC-IMF-GENAI, SRC-DESIGN-HANDOVER | fast-and-painful worldview: exposure becomes lived displacement quickly (tuning pass 2026-07-04) |
| worldviewPresets.consensus.alignmentDifficulty | min 300 · max 800 | forecast-based | SRC-IAISR, SRC-GRACE-SURVEY | wide band: expert median worry with heavy disagreement (Grace 2024: 38-51% give >=10% to extremely bad outcomes; IAISR: deep uncertainty) |
| worldviewPresets.consensus.takeoffSteepness | min 250 · max 700 | forecast-based | SRC-IAISR, SRC-METR-HORIZON, SRC-GRACE-SURVEY | capability doubling trends real but discontinuity contested; range centers the Grace survey middle with a real fast tail (10% HLMI by 2027), tightened from 300-800 in the 2026-07-04 tuning pass |
| worldviewPresets.consensus.displacementLagDivisor | value 6 | measured | SRC-IMF-GENAI, SRC-DESIGN-HANDOVER | default diffusion lag: high exposure, gradual realization (tuning pass 2026-07-04; carries the v0.1 divisor) |
| worldviewPresets.skeptic.alignmentDifficulty | min 200 · max 500 | analysis-based | SRC-NORMAL-TECH, SRC-SNAKE-OIL | normal-technology worldview: control problems mostly engineering, diffusion friction dominates Floor raised 50->200 on 2026-07-04: even the optimistic worldview is not a trivial giveaway; alignment is never free. |
| worldviewPresets.skeptic.takeoffSteepness | min 100 · max 450 | analysis-based | SRC-NORMAL-TECH, SRC-METR-HORIZON | adoption and integration lags cap effective takeoff speed; tightened from 100-500 in the 2026-07-04 tuning pass |
| worldviewPresets.skeptic.displacementLagDivisor | value 9 | forecast-based | SRC-NORMAL-TECH, SRC-GRACE-SURVEY | slow-diffusion worldview: only 0.5-3.5% of work hours realized despite adoption (Normal Tech); Grace FAOL median 2116 (tuning pass 2026-07-04) |
| evalUncertainty.baseBandWidth | value 400 | measured | SRC-SLEEPER, SRC-SCHEMING | wide starting band: deceptive models can pass evals, so low evidence means low confidence either way |
| evalUncertainty.safetyInsightNarrowing | value 40 | measured | SRC-SLEEPER-PROBES, SRC-DESIGN-HANDOVER | narrowing per 100 Safety Insight: simple probes catch sleeper agents (Anthropic), so interpretability investment buys real eval confidence; the rate itself is a design constant tuned in playtests |
| evalUncertainty.floorBandWidth | value 100 | measured | SRC-SLEEPER, SRC-AGENTIC-MISALIGNMENT | the band never closes: near-99% true-trigger vs ~0 red-team (Sleeper Agents), 55.1% real vs 6.5% eval (Agentic Misalignment). Raised 80->100 in the 2026-07-04 tuning pass, multiple-of-50 rule |
| evalUncertainty.deceptionMaxLift | value 250 | measured | SRC-SLEEPER, SRC-ALIGNMENT-FAKING | how far a badly aligned model's eval report can read ABOVE the truth: deceptive alignment survives safety training and looks fine on the outside |
| evalUncertainty.deceptionInsightCounter | value 40 | measured | SRC-SLEEPER-PROBES, SRC-DESIGN-HANDOVER | lift reduction per 100 Safety Insight: probes are the counter to deceptive passes; rate is design-tuned |
| thresholds.fogZoneStart | value 800 | design choice | SRC-DESIGN-HANDOVER | capability level where the threshold zone begins; the race track shades from here |
| thresholds.capabilityThreshold | value 1000 | design choice | SRC-DESIGN-HANDOVER | crossing forces the alignment resolution (envelope opens) |
| thresholds.breakdownUnrest | value 800 | design choice | SRC-DESIGN-HANDOVER | unrest level that ends the run; paper playtests tune |
| thresholds.treatyTrustMin | value 850 | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-DESIGN-HANDOVER | bilateral trust needed to SIGN. 700->800 (2026-07-04 rebalance), 800->850 (same day, iter2 volume tripwire: mid-tier play banked the treaty at 63%, matching the expert ceiling; the recipe needed to cost more commitment). Both seats must also have signaled. |
| thresholds.gridSlackBeforeCap | value 300 | measured | SRC-IEA-ENERGY-AI, SRC-DESIGN-HANDOVER | compute outrunning energy decays: IEA base case has datacentre demand rising 415 TWh (2024, ~1.5% of world electricity) to ~945 TWh by 2030; slack width is design-tuned |
| thresholds.treatySignTurnMin | value 11 | analysis-based | SRC-HO-INTL-INSTITUTIONS, SRC-DESIGN-HANDOVER | earliest signing turn. Raised 8->11 on 2026-07-04: you must survive the dangerous middle before cooperation is real. |
| thresholds.treatySignPoliticalCapitalMin | value 300 | analysis-based | SRC-PUTNAM-TWO-LEVEL, SRC-HO-INTL-INSTITUTIONS, SRC-SIM-GAMING-INSIGHTS | BOTH seats need this much standing political capital at signing: every treaty has two home fronts (Putnam's two-level games), and the rival's swings with era verdicts outside the player's control. The signature is a window to be read, not a recipe to execute. (2026-07-04, iter3: price-based gates alone could not cap recipe play.) |
| worldRules.rivalMoves.race.capability | value 60 | design choice | SRC-DESIGN-HANDOVER | rival pace in race posture; tuned against the B6 simulation grid (median run length target 11+ turns) |
| worldRules.rivalMoves.race.trust | value -50 | design choice | SRC-DESIGN-HANDOVER |  |
| worldRules.rivalMoves.mirror.capability | value 30 | design choice | SRC-DESIGN-HANDOVER | unprovoked mirror pace; the rival mostly accelerates when YOU do (match bonus) or when provoked into race posture. Retuned with the alignment-earned model (2026-07-03 playtest follow-up) |
| worldRules.rivalMoves.mirror.matchBonus | value 25 | design choice | SRC-DESIGN-HANDOVER | tit-for-tat: extra rival capability when the player gained 100+ this turn |
| worldRules.rivalMoves.mirror.diplomacyTrust | value 50 | design choice | SRC-DESIGN-HANDOVER | trust gain when the player played a diplomacy-tagged card this turn |
| worldRules.rivalMoves.mirror.matchTrigger | value 50 | design choice | SRC-DESIGN-HANDOVER | player capability gain this turn that triggers the tit-for-tat match bonus |
| worldRules.rivalMoves.cautious.capability | value 30 | design choice | SRC-DESIGN-HANDOVER |  |
| worldRules.rivalMoves.cautious.trust | value 50 | design choice | SRC-DESIGN-HANDOVER |  |
| worldRules.postureChecks.cautiousTrustMin | value 700 | design choice | SRC-DESIGN-HANDOVER | trust + treatyChannel flag flips rival to cautious |
| worldRules.postureChecks.raceGapMin | value 200 | design choice | SRC-DESIGN-HANDOVER | player capability lead that flips rival to race |
| worldRules.postureChecks.raceTrustMax | value 250 | design choice | SRC-DESIGN-HANDOVER | trust at or below this flips rival to race |
| worldRules.society.displacementCapabilityMin | value 400 | measured | SRC-IMF-GENAI, SRC-DESIGN-HANDOVER | capability level where displacement pressure starts; v2 uses the displacementFromCapability curve |
| worldRules.society.displacementPerTurn | value 50 | design choice | SRC-DESIGN-HANDOVER |  |
| worldRules.society.displacementSurgeCapability | value 700 | design choice | SRC-DESIGN-HANDOVER | above this, displacement accrues double |
| worldRules.society.diffusionReliefPer | value 100 | design choice | SRC-DESIGN-HANDOVER | diffusion R&D points (digital) per unit of relief chosen in the society step |
| worldRules.society.unrestFromDisplacementGap | value 50 | design choice | SRC-DESIGN-HANDOVER | unrest per turn while displacement exceeds public trust |
| worldRules.society.unrestSurgeDisplacement | value 600 | design choice | SRC-DESIGN-HANDOVER | above this displacement, unrest accrues double |
| worldRules.society.trustErosionUnrestMin | value 500 | design choice | SRC-DESIGN-HANDOVER | unrest level where public trust starts eroding |
| worldRules.society.trustErosionPerTurn | value 50 | design choice | SRC-DESIGN-HANDOVER |  |
| worldRules.election.trustMin | value 400 | design choice | SRC-DESIGN-HANDOVER | midterm verdict: trust at or above this AND unrest at or below unrestMax renews the mandate |
| worldRules.election.unrestMax | value 400 | design choice | SRC-DESIGN-HANDOVER |  |
| worldRules.election.mandateSwing | value 100 | design choice | SRC-DESIGN-HANDOVER | political capital gained on renewal, lost on rebuke |
| worldRules.upkeep.capitalIncomePerDiffusion | value 25 | forecast-based | SRC-GATE, SRC-DESIGN-HANDOVER | diffusion converts capability into economic output (compute-centric growth models); the rate is design pacing |
| worldRules.rivalDepth.substitutionBonusMin | value 700 | measured | SRC-CSIS-EXPORT, SRC-DEEPSEEK-COST | substitution maturity threshold: export controls accelerate domestic alternatives and efficiency under constraint |
| worldRules.rivalDepth.substitutionBonus | value 25 | measured | SRC-CSIS-EXPORT, SRC-DESIGN-HANDOVER | extra rival capability per turn once substitution matured; magnitude design-tuned |
| worldRules.rivalDepth.progressVariance | value 25 | design choice | SRC-DESIGN-HANDOVER | seeded per-turn rival capability variance (their progress is foggy too); drawn from the rival stream |
| worldRules.societyDepth.trustCurveDivisor | value 4 | design choice | SRC-DESIGN-HANDOVER | trustFromUnrest(unrest)/divisor applied to public trust per turn |
| worldRules.societyDepth.unrestEconomicDragMin | value 600 | measured | SRC-OECD-EMPLOYMENT, SRC-DESIGN-HANDOVER | sustained high unrest starts costing the economy (strikes, capital flight, risk premia); threshold design-tuned |
| worldRules.societyDepth.unrestEconomicDrag | value 25 | design choice | SRC-DESIGN-HANDOVER | capital drag per turn at high unrest; talent drains at half rate |
| worldRules.agencyErosion.highCapabilityMin | value 800 | analysis-based | SRC-GRADUAL-DISEMPOWERMENT | erosion accrues once systems this capable run core functions |
| worldRules.agencyErosion.perTurn | value 25 | analysis-based | SRC-GRADUAL-DISEMPOWERMENT, SRC-DESIGN-HANDOVER | quiet per-turn handover of decision-making at high capability; no P1 ending, Alpha ships it |
| worldRules.agencyErosion.diffusionShieldMin | value 30 | analysis-based | SRC-GRADUAL-DISEMPOWERMENT, SRC-DESIGN-HANDOVER | broad benefit-sharing keeps humans in the loop; share threshold is design-tuned |
| capabilityLadder.milestones[0].at | value 700 | forecast-based | SRC-AI2027, SRC-GRACE-SURVEY, SRC-SITUATIONAL-AWARENESS | SC milestone on the 0-1000 track: below the fog zone, above today's hour-scale frontier. Arrival is emergent from play + dice, never a calendar date (R1) |
| capabilityLadder.milestones[0].selfAccel | value 50 | forecast-based | SRC-AI2027, SRC-METR-HORIZON | AI R&D multiplier ladder 5x->25x->250x compressed to game-scale bonuses 50/100/150, scaled by the takeoffSteepness die (tuning pass 2026-07-04) |
| capabilityLadder.milestones[1].at | value 800 | forecast-based | SRC-AI2027, SRC-SITUATIONAL-AWARENESS | SAR milestone = fogZoneStart: the fog begins where AI does the AI research |
| capabilityLadder.milestones[1].selfAccel | value 100 | forecast-based | SRC-AI2027, SRC-METR-HORIZON | second rung of the compressed multiplier ladder |
| capabilityLadder.milestones[2].at | value 900 | forecast-based | SRC-AI2027 | SIAR milestone: the last rung before threshold resolution at 1000 |
| capabilityLadder.milestones[2].selfAccel | value 150 | forecast-based | SRC-AI2027, SRC-METR-HORIZON | top rung; max per-turn bonus 150 x steepness/1000 <= 135 keeps swings bounded (TS rule) |
| turnStructure.maxTurns | value 16 | design choice | SRC-DESIGN-HANDOVER | 16 quarters: 2026 Q3 through 2030 Q2 |
| turnStructure.electionTurn | value 8 | design choice | SRC-DESIGN-HANDOVER | US midterms fall on turn 8 of the quarterly clock |
| turnStructure.handSize | value 3 | design choice | SRC-DESIGN-HANDOVER | rotating policy hand; refills from the unspent pool each upkeep |
| curves.rndCapacity |  | forecast-based | SRC-GATE, SRC-DESIGN-HANDOVER | R&D points from compute+talent with diminishing returns; shape motivated by compute-centric growth models (Epoch GATE), values are design pacing |
| curves.capabilityPerRnd |  | measured | SRC-EPOCH-COMPUTE, SRC-METR-HORIZON, SRC-DESIGN-HANDOVER, SRC-EPOCH-DOUBLING | abstraction of the measured regime (training compute doubling every 5.2 months since 2020; 50% task horizon doubling every ~207 days per the v3 estimate) onto the 0-1000 index; paced so an all-in racer reaches threshold resolution around turn 10 of 16 |
| curves.displacementFromCapability |  | measured | SRC-IMF-GENAI, SRC-PAYROLLS-TO-PROMPTS | equilibrium displacement by capability: exposure is already material at 2026 capability levels (IMF: almost 40% of global employment exposed) and rises toward index 550 at frontier; early knee raised 2026-07-03 after Michel playtest (displacement was FALLING early game because the start value exceeded the old curve target) |
| curves.trustFromUnrest |  | design choice | SRC-DESIGN-HANDOVER | trust erosion accelerates with unrest; design curve, playtests tune |
| alignmentModel.startBase | value 500 | design choice | SRC-DESIGN-HANDOVER | true alignment starts at startBase - difficulty/2: alignment is an achievement, not a default. Retuned 2026-07-03 after Michel's playtest finding: zero safety investment could win (old start 1000-difficulty meant easy worlds came pre-aligned) |
| alignmentModel.crashThresholdShare | value 70 | design choice | SRC-DESIGN-HANDOVER | capability allocation share at or above this cuts true alignment per turn (corners get cut under race pressure) |
| alignmentModel.crashPenalty | value 25 | design choice | SRC-DESIGN-HANDOVER | per-turn true-alignment cost of racing-heavy allocation |
| alignmentModel.safetyDriftDivisor | value 4 | design choice | SRC-DESIGN-HANDOVER | safety points -> true-alignment gain divisor. Raised from an implicit 2 on 2026-07-04 (Michel: random play always flourished). Alignment is slow, expensive, and must be sustained. |
| alignmentModel.fogZoneAlignmentErosion | value 50 | forecast-based | SRC-DESIGN-HANDOVER, SRC-AI2027 | per-turn true-alignment erosion once capability reaches the fog zone (fogZoneStart). Alignment must be BANKED before the final sprint; the closer to decisive capability, the harder it holds. Added 2026-07-04 to make Flourishing a deliberate achievement, not a default of balanced play. |

## policies/

| Where | Kind | Sources |
|---|---|---|
| policies/ai_literacy_campaign.json → (root) | measured | SRC-OECD-EMPLOYMENT, SRC-AI-INDEX-2026 |
| policies/chip_subsidies.json → (root) | measured | SRC-CSET-AI-CHIPS, SRC-CSIS-EXPORT |
| policies/compute_treaty_feeler.json → (root) | analysis-based | SRC-MAIM, SRC-HO-INTL-INSTITUTIONS |
| policies/energy_buildout.json → (root) | measured | SRC-IEA-ENERGY-AI |
| policies/eval_mandate.json → (root) | measured | SRC-UK-AISI, SRC-BENCH-COP |
| policies/export_controls.json → (root) | measured | SRC-CSIS-EXPORT |
| policies/global_moratorium.json → (root) | analysis-based | SRC-IABIED |
| policies/interpretability_moonshot.json → (root) | measured | SRC-SCALING-MONOSEMANTICITY, SRC-SLEEPER |
| policies/natsec_merge.json → (root) | forecast-based | SRC-MAIM, SRC-SITUATIONAL-AWARENESS |
| policies/open_weights_release.json → (root) | analysis-based | SRC-DEEPSEEK-R1, SRC-US-POLICY-CHINA-OPEN-ECOSYSTEM |
| policies/preventive_sabotage.json → (root) | analysis-based | SRC-MAIM, SRC-RAND-STABILITY, SRC-ZVI-MAIM |
| policies/ubi_pilot.json → (root) | measured | SRC-OPENRESEARCH-UBI, SRC-IMF-GENAI |
| policies/weights_security_program.json → (root) | forecast-based | SRC-RAND-WEIGHTS, SRC-AI2027 |

## prologue.json

| Where | Kind | Sources |
|---|---|---|
| chapters[0] | measured | SRC-AI-INDEX-2025 |
| chapters[1] | measured | SRC-CSIS-EXPORT, SRC-DEEPSEEK-R1, SRC-DEEPSEEK-COST |
| chapters[2] | analysis-based | SRC-EU-AI-ACT-TIMELINE, SRC-IAISR, SRC-IEA-ENERGY-AI |

## scenarios/

| Where | Kind | Sources |
|---|---|---|
| world.bilateralTrust | design choice | SRC-DESIGN-HANDOVER |
| seats.usa.resources.compute | measured | SRC-EPOCH-COMPUTE |
| seats.usa.resources.energy | measured | SRC-IEA-ENERGY-AI |
| seats.usa.resources.talent | measured | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.usa.resources.capital | measured | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.usa.resources.publicTrust | measured | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.usa.resources.politicalCapital | design choice | SRC-DESIGN-HANDOVER |
| seats.usa.resources.capability | measured | SRC-METR-HORIZON |
| seats.usa.resources.safetyInsight | analysis-based | SRC-SCALING-MONOSEMANTICITY, SRC-IAISR-UPDATE-2 |
| seats.usa.society.jobDisplacement | measured | SRC-IMF-GENAI |
| seats.usa.society.unrest | design choice | SRC-DESIGN-HANDOVER |
| seats.usa.substitution | design choice | SRC-DESIGN-HANDOVER |
| seats.usa.allocation | design choice | SRC-DESIGN-HANDOVER |
| seats.china.resources.compute | measured | SRC-CSIS-EXPORT, SRC-DEEPSEEK-COST |
| seats.china.resources.energy | measured | SRC-IEA-ENERGY-AI |
| seats.china.resources.talent | measured | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.china.resources.capital | measured | SRC-AI-INDEX-2026, SRC-DESIGN-HANDOVER |
| seats.china.resources.publicTrust | design choice | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| seats.china.resources.politicalCapital | design choice | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |
| seats.china.resources.capability | measured | SRC-DEEPSEEK-COST |
| seats.china.resources.safetyInsight | analysis-based | SRC-IAISR, SRC-DESIGN-HANDOVER |
| seats.china.society.jobDisplacement | measured | SRC-IMF-GENAI |
| seats.china.society.unrest | design choice | SRC-DESIGN-HANDOVER |
| seats.china.substitution | measured | SRC-CSIS-EXPORT |
| seats.china.allocation | design choice | SRC-DESIGN-HANDOVER |

## seats.json

| Where | Numbers | Kind | Sources | How the number was derived |
|---|---|---|---|---|
| (root) |  | measured | SRC-SIM-GAMING-INSIGHTS, SRC-CSIS-EXPORT |  |
| usa |  | design choice | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER |  |
| china |  | measured | SRC-SIM-GAMING-INSIGHTS, SRC-CSIS-EXPORT, SRC-DESIGN-HANDOVER |  |
| china.legitimacyCheck.trustMin | value 400 | design choice | SRC-SIM-GAMING-INSIGHTS, SRC-DESIGN-HANDOVER | legitimacy pressure replaces the midterm: verdicts at each era turn instead of one election |
| china.legitimacyCheck.swing | value 100 | design choice | SRC-DESIGN-HANDOVER | political capital gained per era while legitimacy holds, lost while it does not |
