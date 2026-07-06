# Sources

The evidence base, mapped. Machine-readable registry: [`data/sources.json`](data/sources.json)
(this file is generated from it, do not edit by hand, run `pnpm sources-md`).

The map runs in both directions and `pnpm validate` enforces it in CI: a number
in `data/` without a source ID fails the build, and so does a registry entry that
claims a tier its citations do not support. [`docs/EVIDENCE.md`](docs/EVIDENCE.md)
lists every cited number with its evidence.

**164 entries. 54 external sources drive numbers directly (249 citation sites). Game-design constants cite the project's own [design constitution](docs/DESIGN.md) instead (85 sites), and those are always labeled `design`, never counted as outside evidence. 11 more sources shaped the design, 98 are further reading.**
Status: 9 book, 5 flagged, 150 verified.

What the statuses mean: `verified` says the link was fetched and the title and
authors matched this entry (July 2026, scripted fetches plus hand checks; where
a publisher blocks robots, the entry's note says so and the check was manual).
`flagged` names its own limitation on the entry. `book` means a library copy.
One honest limit, stated plainly: the machine proves every citation exists and
every tier is real. Whether a source truly supports a value is human work, and
the challenge loop exists exactly for that.

Every entry carries an evidence class: `empirical` (a measurement or documented
fact), `forecast` (a claim about the future), `analysis` (an argument or
framework), `design` (a game-design decision, no claim about the world).
The most contested dials, how hard alignment is and how fast capability
compounds, never become single numbers: they live as ranges inside worldview
presets, and a seeded hidden roll picks the truth inside the range you chose.

Found a dead link, a better source, or a number you want to challenge? Open an
issue. That is a real contribution and it is welcome, see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## The design constitution (internal, 85 citation sites)

Not outside evidence, and never counted as such: game-design constants cite the
project's own design document so that no game-feel number ever has to wear a
fake empirical citation.

- **SRC-DESIGN-HANDOVER** · [Design constitution (founding brief drafted 2026-07-03 under the working title Race Conditions)](https://github.com/chipmates/criticalwindow/blob/v0.3.3/docs/DESIGN.md) · project (2026) · `design`
  Used for: design constants with no empirical referent (turn counts, starting defaults, allocation defaults)

## External sources that drive numbers (54)

Every entry lists each place it is cited. Sorted by citation count.

- **SRC-AI2027** · [AI 2027](https://ai-2027.com/) · Kokotajlo, Alexander, Larsen, Lifland, Dean, AI Futures Project (2025) · `forecast`
  Used for: race vs. slowdown endings; core scenario spine; cautious preset anchors
  Cited 21× by: anchors.json → tracks.capability · events/autonomous_targeting_demo.json → sourceIds · events/branch_point.json → sourceIds · events/civil_military_fusion.json → sourceIds · events/grid_crunch.json → sourceIds · events/intelligence_explosion.json → sourceIds *(+15 more)*
- **SRC-SIM-GAMING-INSIGHTS** · [Strategic Insights from Simulation Gaming of AI Race Dynamics](https://arxiv.org/pdf/2410.03092) · Gruetzemacher et al. (2024) · `design`
  Used for: facilitator insights from 43 Intelligence Rising games
  Cited 18× by: events/asml_export_squeeze.json → sourceIds · events/autonomous_targeting_demo.json → sourceIds · events/liability_shield_ask.json → sourceIds · events/taiwan_strait_crisis.json → sourceIds · events/the_project.json → sourceIds · events/weight_theft.json → sourceIds *(+12 more)*
- **SRC-CSIS-EXPORT** · [Choking off China's Access to the Future of AI](https://www.csis.org/analysis/choking-chinas-access-future-ai) · Gregory Allen, CSIS (2022) · `empirical`
  Used for: Oct 7 2022 export controls
  Cited 16× by: anchors.json → tracks.substitution · events/allied_export_fracture.json → sourceIds · events/ally_eval_request.json → sourceIds · events/asml_export_squeeze.json → sourceIds · events/chip_smuggling.json → sourceIds · events/fab_yield_breakthrough.json → sourceIds *(+10 more)*
- **SRC-AI-INDEX-2026** · [Artificial Intelligence Index Report 2026](https://arxiv.org/abs/2606.15708) · Stanford Institute for Human-Centered AI (2026) · `empirical`
  Used for: Anchors the talent, capital and public-trust tracks and the prologue's opening beat, via the report's investment, adoption and public-opinion chapters.
  Cited 16× by: anchors.json → tracks.talent · anchors.json → tracks.capital · anchors.json → tracks.publicTrust · events/companion_app_boom.json → sourceIds · events/election_scandal.json → sourceIds · events/flash_crash_agent.json → sourceIds *(+10 more)*
- **SRC-SLEEPER** · [Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training](https://arxiv.org/abs/2401.05566) · Hubinger et al., Anthropic (2024) · `empirical`
  Used for: deceptive-alignment mechanic; eval uncertainty band
  Cited 13× by: anchors.json → tracks.alignment · events/eval_breakthrough.json → sourceIds · events/whistleblower.json → sourceIds · incidents.json → safetyInsightDamageReductionMaxPerMille · incidents.json → rungs.0 · incidents.json → sourceIds *(+7 more)*
- **SRC-IMF-GENAI** · [Gen-AI: Artificial Intelligence and the Future of Work](https://www.imf.org/-/media/files/publications/sdn/2024/english/sdnea2024001.pdf) · Cazzaniga et al., IMF SDN (2024) · `empirical`
  Used for: job-displacement mechanic; ~40% of global jobs exposed (60% advanced economies, 40% emerging, 26% low-income)
  Cited 13× by: anchors.json → tracks.jobDisplacement · events/civil_service_flood.json → sourceIds · events/general_strike.json → sourceIds · events/union_moratorium_demand.json → sourceIds · events/viral_job_loss.json → sourceIds · mandates.json → mandates.1 *(+7 more)*
- **SRC-IEA-ENERGY-AI** · [Energy and AI](https://www.iea.org/reports/energy-and-ai) · International Energy Agency (2025) · `empirical`
  Used for: Grounds the single energy-resource track and its thresholds (grid slack, mandates, event and policy effects) in IEA's datacentre electricity-demand projections, 415 TWh in 2024 rising toward roughly 945 TWh by 2030. The game folds energy-source mix and emissions into that one track rather than modeling them separately.
  Cited 12× by: anchors.json → tracks.energy · events/city_power_deal.json → sourceIds · events/coal_province_datacenter_bid.json → sourceIds · events/energy_crunch.json → sourceIds · events/grid_crunch.json → sourceIds · mandates.json → mandates.0 *(+6 more)*
- **SRC-METR-HORIZON** · [Measuring AI Ability to Complete Long Tasks (task-horizon)](https://arxiv.org/abs/2503.14499) · Kwa, West et al., METR (2025) · `empirical`
  Used for: 50% task-completion time horizon doubling ~every 7 months since 2019; capability clock calibration
  Cited 10× by: anchors.json → tracks.capability · events/flash_crash_agent.json → sourceIds · parameters.json → worldviewPresets.cautious.takeoffSteepness · parameters.json → worldviewPresets.consensus.takeoffSteepness · parameters.json → worldviewPresets.skeptic.takeoffSteepness · parameters.json → capabilityLadder.milestones.0.selfAccel *(+4 more)*
- **SRC-SCHEMING** · [Frontier Models are Capable of In-context Scheming](https://arxiv.org/abs/2412.04984) · Meinke, Schoen et al., Apollo Research (2024) · `empirical`
  Used for: Frontier models demonstrated strategically deceiving evaluators and pursuing misaligned goals covertly in controlled evals; backs the eval-uncertainty band width, several incident-ladder rungs, and the safety-focused mandates.
  Cited 10× by: anchors.json → tracks.alignment · events/benchmark_gaming.json → sourceIds · incidents.json → safetyInsightDamageReductionMaxPerMille · incidents.json → rungs.0 · incidents.json → rungs.1 · incidents.json → rungs.2 *(+4 more)*
- **SRC-OECD-EMPLOYMENT** · [OECD Employment Outlook (AI chapters)](https://doi.org/10.1787/08785bba-en) · OECD (2023) · `empirical`
  Used for: Backs the unrest/labor-disruption side of the society mechanic across multiple mandates, strike/displacement events, the ai_literacy_campaign policy, and the unrestEconomicDragMin threshold (sustained high unrest starts costing the economy).
  Cited 10× by: anchors.json → tracks.unrest · events/civil_service_flood.json → sourceIds · events/general_strike.json → sourceIds · events/shuttered_factory_census.json → sourceIds · events/union_moratorium_demand.json → sourceIds · mandates.json → mandates.1 *(+4 more)*
- **SRC-HO-INTL-INSTITUTIONS** · [International Institutions for Advanced AI](https://arxiv.org/abs/2307.04699) · Ho et al. (2023) · `analysis`
  Used for: Grounds the bilateral-trust track and treaty-signing thresholds/events: real proposals for international AI institutions (verification bodies, joint safety research, coordination mechanisms) motivate the trust-building diplomacy chain (ally_eval_request, civil_military_fusion, liability_shield_ask, treaty_feeler, verification_offer, compute_treaty_feeler) and the political-capital/trust gates required to sign a treaty.
  Cited 10× by: anchors.json → tracks.bilateralTrust · events/ally_eval_request.json → sourceIds · events/civil_military_fusion.json → sourceIds · events/liability_shield_ask.json → sourceIds · events/treaty_feeler.json → sourceIds · events/verification_offer.json → sourceIds *(+4 more)*
- **SRC-SITUATIONAL-AWARENESS** · [Situational Awareness: The Decade Ahead](https://situational-awareness.ai/) · Leopold Aschenbrenner (2024) · `forecast`
  Used for: Aggressive-timeline / intelligence-explosion worldview preset anchor; also backs the nationalized 'the Project' event and natsec_merge policy, the SC/SAR milestone timing, and the compute-energy grid-crunch event, all drawn from the essay's industrial-mobilization and intelligence-explosion argument.
  Cited 8× by: events/grid_crunch.json → sourceIds · events/intelligence_explosion.json → sourceIds · events/superhuman_coder.json → sourceIds · events/the_project.json → sourceIds · parameters.json → worldviewPresets.cautious.takeoffSteepness · parameters.json → capabilityLadder.milestones.0.at *(+2 more)*
- **SRC-AGENTIC-MISALIGNMENT** · [Agentic Misalignment: How LLMs Could Be Insider Threats](https://arxiv.org/abs/2510.05179) · Aengus Lynch et al. (2025) · `empirical`
  Used for: Most directly game-relevant recent paper for sabotage / blackmail / insider-threat event chains under high-autonomy deployment
  Cited 8× by: anchors.json → tracks.alignment · incidents.json → riskFormula.pressureAllocationPct · incidents.json → riskFormula.pressureRivalRacePct · incidents.json → rungs.0 · incidents.json → rungs.1 · incidents.json → rungs.3 *(+2 more)*
- **SRC-EPOCH-COMPUTE** · [Data on the Trajectory of AI (databases hub)](https://epoch.ai/data) · Epoch AI · `empirical`
  Used for: Compute-meter anchor and the capabilityPerRnd growth curve's compute-doubling assumption (~5.2 months per doubling since 2020); also general compute/energy event flavor.
  Cited 6× by: anchors.json → tracks.compute · events/coal_province_datacenter_bid.json → sourceIds · events/fab_yield_breakthrough.json → sourceIds · events/open_source_replication.json → sourceIds · parameters.json → curves.capabilityPerRnd · scenarios/scenario_2026.json → seats.usa.resources.compute
- **SRC-GRACE-SURVEY** · [Thousands of AI Authors on the Future of AI](https://arxiv.org/abs/2401.02843) · Grace et al. (2024) · `forecast`
  Used for: expert-survey timeline distributions; consensus preset anchors (founding core anchor set)
  Cited 5× by: events/superhuman_coder.json → sourceIds · parameters.json → worldviewPresets.consensus.alignmentDifficulty · parameters.json → worldviewPresets.consensus.takeoffSteepness · parameters.json → worldviewPresets.skeptic.displacementLagDivisor · parameters.json → capabilityLadder.milestones.0.at
- **SRC-MAIM** · [Superintelligence Strategy: Expert Version (MAIM)](https://arxiv.org/abs/2503.05628) · Hendrycks, Schmidt, Wang (2025) · `analysis`
  Used for: deterrence/sabotage/nonproliferation mechanic
  Cited 5× by: events/rival_breakthrough.json → sourceIds · events/treaty_feeler.json → sourceIds · policies/compute_treaty_feeler.json → sourceIds · policies/natsec_merge.json → sourceIds · policies/preventive_sabotage.json → sourceIds
- **SRC-SCALING-MONOSEMANTICITY** · [Scaling Monosemanticity (Claude 3 Sonnet features)](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html) · Templeton et al., Anthropic (2024) · `empirical`
  Used for: Interpretability feature-extraction demonstrated at production model scale (Claude 3 Sonnet); backs the safetyInsight resource/track and the interpretability-investment mechanics (interpretability_moonshot policy, eval_breakthrough event).
  Cited 4× by: anchors.json → tracks.safetyInsight · events/eval_breakthrough.json → sourceIds · policies/interpretability_moonshot.json → sourceIds · scenarios/scenario_2026.json → seats.usa.resources.safetyInsight
- **SRC-SLEEPER-PROBES** · [Simple probes can catch sleeper agents](https://www.anthropic.com/research/probes-catch-sleeper-agents) · Anthropic Alignment Science (2024) · `empirical`
  Used for: Backs the eval-uncertainty band's safety-insight narrowing and deception-insight counter in parameters.json (evalUncertainty.safetyInsightNarrowing, deceptionInsightCounter): probes that catch sleeper agents let Safety Insight investment narrow uncertainty about whether a model is deceptively aligned.
  Cited 4× by: anchors.json → tracks.safetyInsight · events/insurance_repricing.json → sourceIds · parameters.json → evalUncertainty.safetyInsightNarrowing · parameters.json → evalUncertainty.deceptionInsightCounter
- **SRC-IAISR** · [International AI Safety Report 2025](https://arxiv.org/abs/2501.17805) · Bengio et al. (2025) · `analysis`
  Used for: consensus risk synthesis; consensus preset anchors
  Cited 4× by: parameters.json → worldviewPresets.consensus.alignmentDifficulty · parameters.json → worldviewPresets.consensus.takeoffSteepness · prologue.json → chapters.2 · scenarios/scenario_2026.json → seats.china.resources.safetyInsight
- **SRC-DEEPSEEK-COST** · [DeepSeek Debates: Chinese Leadership on Cost, True Training Cost, Closed Model Margin Impacts](https://newsletter.semianalysis.com/p/deepseek-debates) · Patel et al., SemiAnalysis (2025) · `empirical`
  Used for: DeepSeek cost mechanic (~$1.6B server capex; MLA cuts KV-cache 93.3%)
  Cited 4× by: events/open_weights_shock.json → sourceIds · prologue.json → chapters.1 · scenarios/scenario_2026.json → seats.china.resources.compute · scenarios/scenario_2026.json → seats.china.resources.capability
- **SRC-GATE** · [GATE: An Integrated Assessment Model for AI Automation](https://arxiv.org/abs/2503.04941) · Epoch AI (2025) · `forecast`
  Used for: compute-centric economic takeoff model; automation/growth economic engine
  Cited 3× by: events/city_power_deal.json → sourceIds · parameters.json → worldRules.upkeep.capitalIncomePerDiffusion · parameters.json → curves.rndCapacity
- **SRC-GRADUAL-DISEMPOWERMENT** · [Gradual Disempowerment: Systemic Existential Risks from Incremental AI Development](https://arxiv.org/abs/2501.16946) · Kulveit, Douglas, Ammann, Turan, Krueger, Duvenaud (2025) · `analysis`
  Used for: Grounds the agency-erosion pressure that accrues at high capability and is read back in the debrief; the dedicated hidden ending it argues for is planned, not in this release.
  Cited 3× by: parameters.json → worldRules.agencyErosion.highCapabilityMin · parameters.json → worldRules.agencyErosion.perTurn · parameters.json → worldRules.agencyErosion.diffusionShieldMin
- **SRC-EU-AI-ACT-TIMELINE** · [EU AI Act Implementation Timeline](https://artificialintelligenceact.eu/implementation-timeline/) · FLI · `empirical`
  Used for: phased dates (bans Feb 2025; GPAI Aug 2025; bulk Aug 2026; high-risk Aug 2027)
  Cited 3× by: events/eu_ai_act_full_force.json → sourceIds · events/eu_ai_act_high_risk.json → sourceIds · prologue.json → chapters.2
- **SRC-DEEPSEEK-R1** · [DeepSeek-R1](https://arxiv.org/abs/2501.12948) · DeepSeek (2025) · `empirical`
  Used for: Models the real 'DeepSeek shock': a competitive open-weights reasoning release from an export-controlled rival, backing the open_weights_shock event, the open_weights_release policy's capability/trust effects, and the prologue's chokepoint-war chapter.
  Cited 3× by: events/open_weights_shock.json → sourceIds · policies/open_weights_release.json → sourceIds · prologue.json → chapters.1
- **SRC-NORMAL-TECH** · [AI as Normal Technology](https://knightcolumbia.org/content/ai-as-normal-technology) · Narayanan & Kapoor, Princeton/Knight Institute (2025) · `analysis`
  Used for: skeptical worldview preset
  Cited 3× by: parameters.json → worldviewPresets.skeptic.alignmentDifficulty · parameters.json → worldviewPresets.skeptic.takeoffSteepness · parameters.json → worldviewPresets.skeptic.displacementLagDivisor
- **SRC-UK-AISI** · [UK AI Security Institute (formerly AI Safety Institute)](https://www.aisi.gov.uk/) · UK AISI · `empirical`
  Used for: eval/regulation actor
  Cited 2× by: mandates.json → mandates.2 · policies/eval_mandate.json → sourceIds
- **SRC-RAND-WEIGHTS** · [Securing AI Model Weights: Preventing Theft and Misuse of Frontier Models](https://www.rand.org/pubs/research_reports/RRA2849-1.html) · Nevo, Lahav, Karpur et al., RAND (2024) · `analysis`
  Used for: weight-security mechanic; also cited in the US-China section as the model-weight-theft / espionage mechanic (RAND, RR-A2849-1)
  Cited 2× by: events/weight_theft.json → sourceIds · policies/weights_security_program.json → sourceIds
- **SRC-CHIP-WAR** · Chip War: The Fight for the World's Most Critical Technology · Chris Miller, Scribner (2022) · `empirical` *(book, obtain manually)*
  Used for: TSMC/Taiwan chokepoint background
  Cited 2× by: events/asml_export_squeeze.json → sourceIds · events/taiwan_strait_crisis.json → sourceIds
- **SRC-EU-AI-ACT** · [EU AI Act (Regulation (EU) 2024/1689)](https://artificialintelligenceact.eu/the-act/) · EU (2024) · `empirical`
  Used for: Backs the fixed historical beats eu_ai_act_full_force and eu_ai_act_high_risk, dramatizing the Act's phased compliance deadlines (prohibited-practices ban, GPAI duties, high-risk certification).
  Cited 2× by: events/eu_ai_act_full_force.json → sourceIds · events/eu_ai_act_high_risk.json → sourceIds
- **SRC-IABIED** · [If Anyone Builds It, Everyone Dies](https://ifanyonebuildsit.com/) · Yudkowsky & Soares (2025) · `analysis` *(book, obtain manually)*
  Used for: Grounds the cautious worldview's high alignment-difficulty range (upper half of the 550-950 band) and, via the book's core policy prescription of a halt on frontier AI development, the global_moratorium policy card's pause mechanic.
  Cited 2× by: parameters.json → worldviewPresets.cautious.alignmentDifficulty · policies/global_moratorium.json → sourceIds
- **SRC-AI-INCIDENT-DB** · [AI Incident Database](https://incidentdatabase.ai/) · Responsible AI Collaborative · `empirical`
  Used for: real-world harm cases
  Cited 2× by: events/election_scandal.json → sourceIds · incidents.json → sourceIds
- **SRC-BENCH-COP** · [Bench-2-CoP: Can We Trust Benchmarking for EU AI Compliance?](https://arxiv.org/abs/2508.05464) · Matteo Prandi et al. (2025) · `empirical`
  Used for: Shows common benchmarks under-measure the systemic risks regulators increasingly care about
  Cited 2× by: events/benchmark_gaming.json → sourceIds · policies/eval_mandate.json → sourceIds
- **SRC-GRID-DATACENTER** · [Environmental Burden of United States Data Centers in the Artificial Intelligence Era](https://arxiv.org/abs/2411.09786) · Gianluca Guidi et al. (2024) · `empirical`
  Used for: Grounds the grid-capacity strain and household power-price spikes from data-center demand (events/energy_crunch.json's price-crunch event, mandates.json's keep_lights_on energy target), not specifically the paper's carbon-intensity/environmental-backlash framing.
  Cited 2× by: events/energy_crunch.json → sourceIds · mandates.json → mandates.0
- **SRC-EPOCH-DOUBLING** · [The training compute of notable AI models has been doubling roughly every six months](https://epoch.ai/data-insights/compute-trend-post-2010) · Rahman & Owen, Epoch AI (2024) · `empirical`
  Used for: Training compute doubling roughly every six months since 2020; the capabilityPerRnd growth curve cites it for exactly that assumption.
  Cited 1× by: parameters.json → curves.capabilityPerRnd
- **SRC-ALIGNMENT-FAKING** · [Alignment faking in large language models](https://arxiv.org/abs/2412.14093) · Greenblatt, Denison et al., Anthropic/Redwood (2024) · `empirical`
  Used for: Deceptive alignment surviving safety training even under monitoring incentives; backs evalUncertainty.deceptionMaxLift (a badly-aligned model's eval report can read above the truth).
  Cited 1× by: parameters.json → evalUncertainty.deceptionMaxLift
- **SRC-IAISR-UPDATE-2** · [International AI Safety Report — Second Key Update: Technical Safeguards & Risk Management](https://arxiv.org/abs/2511.19863) · Bengio et al. (2025) · `analysis`
  Used for: Backs the scenario's starting safety-insight level: where operational safeguards practice actually stood in late 2025 sets where the world begins.
  Cited 1× by: scenarios/scenario_2026.json → seats.usa.resources.safetyInsight
- **SRC-GOVAI-COMPUTE** · [Computing Power and the Governance of AI](https://arxiv.org/abs/2402.08797) · Sastry, Heim, Belfield, Anderljung, Brundage et al., GovAI/OpenAI (2024) · `analysis`
  Used for: compute-governance mechanic
  Cited 1× by: events/verification_offer.json → sourceIds
- **SRC-CSIS-SME-CONTROLS** · [The True Impact of Allied Export Controls on the U.S. and Chinese SME Industries](https://www.csis.org/analysis/true-impact-allied-export-controls-us-and-chinese-semiconductor-manufacturing-equipment) · Allen, CSIS (2024) · `empirical`
  Used for: Backs the allied_export_fracture event's choice between compensating allies for enforcing semiconductor-manufacturing-equipment export controls versus letting the allied coalition fray.
  Cited 1× by: events/allied_export_fracture.json → sourceIds
- **SRC-RAND-STABILITY** · [Seeking Stability in the Competition for AI Advantage](https://www.rand.org/pubs/commentary/2025/03/seeking-stability-in-the-competition-for-ai-advantage.html) · RAND (2025) · `analysis`
  Used for: critique of MAIM
  Cited 1× by: policies/preventive_sabotage.json → sourceIds
- **SRC-ZVI-MAIM** · [On MAIM and Superintelligence Strategy](https://thezvi.substack.com/p/on-maim-and-superintelligence-strategy) · Zvi Mowshowitz (2025) · `analysis`
  Used for: Zvi's critical read of MAIM feeds the preventive_sabotage policy's deter-vs-spiral gamble and its escalation-flag risk modifier, reflecting skepticism that deterrence between rivals stays clean.
  Cited 1× by: policies/preventive_sabotage.json → sourceIds
- **SRC-NSCAI** · [NSCAI Final Report](https://www.govinfo.gov/app/details/GOVPUB-Y3-PURL-gpo153246) · National Security Commission on AI (2021) · `analysis`
  Used for: General US national-security AI-strategy framing (talent, compute, government-industry coordination) motivates natsec-flavored governance events like lab_merger; the 2021 report itself does not specifically address lab-merger or industry-concentration policy.
  Cited 1× by: events/lab_merger.json → sourceIds
- **SRC-CSET-AI-CHIPS** · [AI Chips: What They Are and Why They Matter](https://cset.georgetown.edu/publication/ai-chips-what-they-are-and-why-they-matter/) · Khan & Mann, CSET (2020) · `empirical`
  Used for: Backs the chip_subsidies policy's chokepoint premise: advanced AI chips are a scarce, export-controlled resource, justifying the card's delayed compute + substitution payoff.
  Cited 1× by: policies/chip_subsidies.json → sourceIds
- **SRC-CNAS-SMUGGLING** · [Preventing AI Chip Smuggling](https://www.cnas.org/publications/reports/preventing-ai-chip-smuggling-to-china) · Fist et al., CNAS · `empirical`
  Used for: Backs the chip_smuggling event's enforce-vs-look-away choice: documented smuggling routes and enforcement tradeoffs for export-controlled AI chips reaching China.
  Cited 1× by: events/chip_smuggling.json → sourceIds
- **SRC-ANTHROPIC-ECON-INDEX** · [The Anthropic Economic Index](https://www.anthropic.com/economic-index) · Anthropic (2025) · `empirical`
  Used for: real usage-by-occupation data
  Cited 1× by: events/viral_job_loss.json → sourceIds
- **SRC-OPENRESEARCH-UBI** · [OpenResearch Unconditional Income Study](https://www.openresearchlab.org/studies/unconditional-cash-study/study) (2024) · `empirical`
  Used for: UBI/redistribution mechanic
  Cited 1× by: policies/ubi_pilot.json → sourceIds
- **SRC-CARLSMITH** · [Is Power-Seeking AI an Existential Risk?](https://arxiv.org/abs/2206.13353) · Joseph Carlsmith (2022) · `analysis`
  Used for: decomposed risk model
  Cited 1× by: parameters.json → worldviewPresets.cautious.alignmentDifficulty
- **SRC-SNAKE-OIL** · AI Snake Oil · Narayanan & Kapoor, Princeton University Press (2024) · `analysis` *(book, obtain manually)*
  Used for: skeptical worldview
  Cited 1× by: parameters.json → worldviewPresets.skeptic.alignmentDifficulty
- **SRC-AI-INDEX-2025** · [The 2025 AI Index Report](https://hai.stanford.edu/ai-index/2025-ai-index-report) · Stanford HAI (2025) · `empirical`
  Used for: Backs the prologue's opening beat (data/prologue.json chapters[0] 'starting_gun': capability, capital, and safetyInsight rising while publicTrust dips) via the 2025 report's investment, adoption, and public-opinion chapters.
  Cited 1× by: prologue.json → chapters.0
- **SRC-AISI-FRONTIER-TRENDS** · [Frontier AI Trends Report](https://www.aisi.gov.uk/frontier-ai-trends-report) · UK AI Security Institute (2026) · `empirical`
  Used for: Task-length trend data (software task success by duration, time-horizon benchmark figures) backing the capability track's hours-scale anchor mapping alongside METR.
  Cited 1× by: anchors.json → tracks.capability
- **SRC-US-POLICY-CHINA-OPEN-ECOSYSTEM** · [U.S. Policies Unintentionally Accelerated China's Open AI Ecosystems](https://arxiv.org/abs/2606.15999) · Wang Jin et al. (2026) · `analysis`
  Used for: Strategic counterpoint: export controls can slow frontier access while strengthening open, adaptive Chinese ecosystems
  Cited 1× by: policies/open_weights_release.json → sourceIds
- **SRC-PAYROLLS-TO-PROMPTS** · [Payrolls to Prompts: Firm-Level Evidence on the Substitution of Labor for AI](https://arxiv.org/abs/2602.00139) · Ryan Stevens (2026) · `empirical`
  Used for: Backs the shape of the displacementFromCapability curve in parameters.json (paired with SRC-IMF-GENAI's exposure baseline): firm-level evidence of actual spending substitution of AI for labor justifies displacement rising with capability rather than staying flat, not merely 'labor-market event cards' generically.
  Cited 1× by: parameters.json → curves.displacementFromCapability
- **SRC-RIGHT-TO-WARN** · [A Right to Warn about Advanced Artificial Intelligence (open letter)](https://righttowarn.ai) · current and former OpenAI and Google DeepMind employees (2024) · `analysis`
  Used for: Grounds the whistleblower event card's premise that safety concerns get buried under launch pressure and employees need protection to surface them, per the 2024 open letter's core 'right to warn' demand.
  Cited 1× by: events/whistleblower.json → sourceIds
- **SRC-PUTNAM-TWO-LEVEL** · [Diplomacy and Domestic Politics: The Logic of Two-Level Games](https://www.jstor.org/stable/2706785) · Robert D. Putnam, International Organization 42(3) (1988) · `analysis`
  Used for: treaty ratification requires BOTH governments' domestic standing (political capital) at signing; the win-set logic behind the ratification window mechanic
  Cited 1× by: parameters.json → thresholds.treatySignPoliticalCapitalMin
- **SRC-METR-TH11** · [Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) · METR (2026) · `empirical`
  Used for: The updated task-horizon fit the capabilityPerRnd pacing note quotes: P50 doubling of 196.5 days on the all-time stitched trend, 130.8 days for models from 2023 on.
  Cited 1× by: parameters.json → curves.capabilityPerRnd

## Sources that shaped the design (11)

These shaped a mechanic without backing one specific number. Each states which
mechanic, checkably. Wiring one of these to an actual number is a welcome PR.

- **SRC-DAVIDSON-TAKEOFF** · [Compute-centric takeoff model](https://takeoffspeeds.com) · Davidson, Open Philanthropy (2023) · `forecast`
  Shaped: The takeoffSteepness worldview dial (parameters.json worldviewPresets.*.takeoffSteepness), which sets how fast capability compounds once frontier AI R&D automation begins, operationalizes this paper's compute-centric takeoff-speed framework of treating takeoff duration as a distinct, quantifiable axis separate from AGI-timeline forecasts.
- **SRC-POWER-SEEKING-POLICIES** · [Optimal Policies Tend to Seek Power](https://arxiv.org/abs/1912.01683) · Turner, Smith, Shah, Critch, Tadepalli (2021) · `analysis`
  Shaped: The agencyErosion mechanic (parameters.json worldRules.agencyErosion.perTurn), where sufficiently capable AI systems quietly accumulate control over decisions each turn, operationalizes this paper's formal result that optimal policies across a wide range of environments tend to seek power and resources instrumentally.
- **SRC-LOVING-GRACE** · [Machines of Loving Grace](https://www.darioamodei.com/essay/machines-of-loving-grace) · Dario Amodei (2024) · `forecast`
  Shaped: The game's top-scoring 'flourishing' ending (src/engine/score.ts, worth 5000 points versus 500-4000 for the other five endings) takes its name and optimistic-but-earned framing from this essay's vision of AI-enabled abundance once safety holds.
- **SRC-PAUSE-LETTER** · [Pause Giant AI Experiments: An Open Letter](https://futureoflife.org/open-letter/pause-giant-ai-experiments/) · Future of Life Institute (2023) · `analysis`
  Shaped: The global_moratorium policy card (data/policies/global_moratorium.json), letting a seat push a coordinated capability freeze at political-capital cost, simulates the real-world coordination move this open letter proposed: a temporary, verifiable pause on frontier AI training runs (though the card's own sourceIds currently cite SRC-IABIED instead of this letter).
- **SRC-XPT** · [Forecasting Existential Risks (Existential Risk Persuasion Tournament / XPT)](https://forecastingresearch.org/xpt) · Karger, Rosenberg, Tetlock et al., FRI (2023) · `forecast`
  Shaped: The three worldview presets (parameters.json worldviewPresets.cautious/consensus/skeptic), which encode unresolved expert disagreement about alignment difficulty and takeoff speed as different dice ranges rather than one 'true' number, reflect XPT's core finding that domain-expert and superforecaster estimates of AI existential risk persistently diverge. The founding brief filed it under 'feeds worldview presets', and the presets still do.
- **SRC-RACING-PRECIPICE** · [Racing to the precipice: a model of AI development](https://link.springer.com/article/10.1007/s00146-015-0590-y) · Armstrong, Bostrom, Shulman, AI & Society (2016) · `analysis`
  Shaped: The alignmentModel.crashThresholdShare/crashPenalty mechanic (parameters.json), where allocating 70%+ capability share cuts true alignment per turn, mirrors this paper's founding game-theoretic finding that competitive racing pressure drives teams to cut corners on safety precautions.
- **SRC-HEIM-TECH-GOVERNANCE** · [Technical AI Governance](https://blog.heim.xyz/technical-ai-governance/) · Lennart Heim · `analysis`
  Shaped: The verification_offer event's verificationPilot mechanic (events/verification_offer.json: safetyInsight +150, rival.trust +150) follows this piece's core argument that concrete technical verification and monitoring mechanisms, not paper agreements alone, are what let rival powers trust an AI treaty.
- **SRC-WINDFALL-CLAUSE** · [The Windfall Clause](https://www.governance.ai/research-paper/the-windfall-clause-distributing-the-benefits-of-ai-for-the-common-good) · O'Keefe et al., GovAI · `analysis`
  Shaped: The agencyErosion.diffusionShieldMin mechanic (parameters.json worldRules.agencyErosion), where a high enough diffusion/benefit-sharing share lowers erosion of human agency, per its own note 'broad benefit-sharing keeps humans in the loop', reflects this paper's core proposal that redistributing AI's economic windfall preserves participation and blocks narrow power concentration.
- **SRC-AI-FUTURES-ROLEPLAY** · [Exploring AI Futures Through Role Play (Intelligence Rising)](https://arxiv.org/abs/1912.08964) · Avin, Gruetzemacher, Fox (2020) · `design`
  Shaped: The design constitution (docs/DESIGN.md §1) names Intelligence Rising as the direct inspiration this project scales ('proves the pedagogy'); the project's overall structure, a turn-based, multi-seat (USA/China) roleplay simulation of AI race dynamics with policy cards and posture shifts (data/seats.json, parameters.json worldRules.rivalMoves), follows this paper's original Intelligence Rising format.
- **SRC-WOUTERS-2013** · [Meta-analysis of serious-games learning outcomes](https://eric.ed.gov/?id=EJ1008015) · Wouters et al. (2013) · `design`
  Shaped: The debrief screen (src/ui/screens/Debrief.tsx, spec'd in docs/DESIGN.md §8: takeaways surfaced, counterfactual hints, sources link) follows this meta-analysis's finding that serious games produce better learning outcomes when paired with explicit debriefing rather than left to stand alone.
- **SRC-BOGOST-PERSUASIVE-GAMES** · Persuasive Games · Bogost (2007) · `design` *(book, obtain manually)*
  Shaped: The project's core Fun-First-70/30 principle (docs/DESIGN.md §3, operating principle 1: the lesson lives in mechanics, never in lecture screens) follows Bogost's concept of procedural rhetoric: games persuade through their rules and systems, not through explicit argument.

## The library: further reading (98)

No usage claim. This is the shelf we read from and the shelf we recommend,
grouped by topic.

### ai-safety

- **SRC-IASR-2026** · [International AI Safety Report 2026](https://arxiv.org/abs/2602.21012) · Yoshua Bengio et al. (2026) · `analysis`
  Why it is here: Points a reader to the most current multi-expert international consensus report on frontier AI capabilities and risk, the same report series already grounding the consensus worldview preset (via the separately-registered SRC-IAISR), updated to its newest edition.
- **SRC-BLACKBOX-SCHEMING-MONITORS** · [Training Deliberative Monitors for Black-Box Scheming Detection](https://arxiv.org/abs/2605.29601) · Aditya Sinha et al. (2026) · `empirical`
  Why it is here: Gives a reader a concrete technical account of training monitors to catch scheming behavior that hides from chain-of-thought, useful further reading for the control-stack/monitoring-investment theme already carried by the Safety Insight mechanic, though no current number cites it.

### alignment

- **SRC-RLHF** · [Deep reinforcement learning from human preferences (RLHF)](https://arxiv.org/abs/1706.03741) · Christiano, Leike, Brown, Martic, Legg, Amodei (2017) · `empirical`
  Why it is here: The original technique paper for training models from human preference feedback; broad background reading on why 'training for alignment' is treated as an actionable, investable lever in the game, though no specific mechanic is traceably built on this paper rather than the field generally.
- **SRC-INSTRUCTGPT** · [Training language models to follow instructions with human feedback (InstructGPT)](https://arxiv.org/abs/2203.02155) · Ouyang et al., OpenAI (2022) · `empirical`
  Why it is here: Demonstrates that instruction-tuning via human feedback measurably improves model helpfulness and harmlessness at production scale; useful background on real alignment-training practice, though not specifically tied to any single game mechanic.
- **SRC-CONSTITUTIONAL-AI** · [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) · Bai, Kadavath, Kundu et al., Anthropic (2022) · `empirical`
  Why it is here: Introduces AI-feedback-based safety training as an alternative to pure RLHF; good further reading on real lab alignment techniques, though the game's abstract alignment/safety-investment numbers don't distinguish between training methods.
- **SRC-WEAK-TO-STRONG** · [Weak-to-strong generalization](https://arxiv.org/abs/2312.09390) · Burns, Izmailov, Kirchner, Leike, Sutskever et al., OpenAI (2023) · `empirical`
  Why it is here: Investigates whether weaker supervisors can reliably oversee stronger models, the core 'scalable oversight' problem; relevant background for the fog-zone idea that oversight gets harder as capability rises, though the game's fog-zone erosion mechanic is explicitly sourced to AI-2027 rather than this paper.
- **SRC-SPEC-GAMING** · [Specification gaming: the flip side of AI ingenuity](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/) · Krakovna et al., DeepMind (2020) · `empirical`
  Why it is here: A widely-cited catalog of real specification-gaming/reward-hacking examples (the AI does exactly what you asked, not what you wanted); good illustrative reading, though the game has no incident type or parameter that distinctly models reward hacking as opposed to deliberate deception.
- **SRC-GOAL-MISGEN** · [Goal Misgeneralization: Why Correct Specifications Aren't Enough](https://arxiv.org/abs/2210.01790) · Shah, Varma, Kumar et al., DeepMind (2022) · `empirical`
  Why it is here: Demonstrates that a model can appear to have learned the intended goal during training yet pursue a different one once deployed; relevant conceptual background on why evals can mislead, though the game's eval-uncertainty band is explicitly sourced to the deception literature (Sleeper Agents, Scheming) rather than this misgeneralization paper.
- **SRC-GOAL-MISGEN-RL** · [Goal Misgeneralization in Deep Reinforcement Learning](https://arxiv.org/abs/2105.14111) · Langosco, Koch et al. (2022) · `empirical`
  Why it is here: The deep-RL-specific companion finding to SRC-GOAL-MISGEN (the CoinRun agent that learns 'go right' instead of 'get the coin'); same relevance and same caveat as that entry.
- **SRC-ALIGNMENT-SURVEY** · [AI Alignment: A Comprehensive Survey](https://arxiv.org/abs/2310.19852) · Ji et al. (2023) · `analysis`
  Why it is here: A broad taxonomy of alignment research techniques and open problems (RLHF, interpretability, scalable oversight) for players or teachers who want the academic map behind the game's alignment-difficulty dial.
- **SRC-HUMAN-COMPATIBLE** · Human Compatible: AI and the Problem of Control · Stuart Russell, Viking/Penguin (2019) · `analysis` *(book, obtain manually)*
  Why it is here: Russell's provably-beneficial-AI framing and the control problem, for readers wanting the classic popular-science argument behind the game's alignment mechanics.

### benchmark

- **SRC-ARC-AGI** · [ARC-AGI benchmark](https://arcprize.org/arc-agi) · Chollet, Knoop, ARC Prize Foundation · `empirical`
  Why it is here: For players curious what a 'capability' benchmark actually looks like in the real world, ARC-AGI is the most discussed current example of a benchmark designed to resist brute pattern-matching, alongside the METR task-horizon data already backing the capability meter.
- **SRC-ARC-AGI-2** · [ARC-AGI-2: A New Challenge for Frontier AI Reasoning Systems](https://arxiv.org/abs/2505.11831) · François Chollet, Mike Knoop, Gregory Kamradt, Bryan Landers, Henry Pinkard (2025) · `empirical`
  Why it is here: Gives a curious player or researcher the actual successor benchmark used to show frontier models still fail novel visual-reasoning puzzles even as older benchmarks saturate, useful context for the capability-ladder milestones though no specific milestone value is drawn from it.
- **SRC-RE-BENCH** · [RE-Bench: Evaluating frontier AI R&D capabilities of language model agents against human experts](https://arxiv.org/abs/2411.15114) · Hjalmar Wijk et al., METR (2024) · `empirical`
  Why it is here: Gives a researcher METR's actual measured data on how close AI agents are to human ML-engineer performance on real R&D tasks, the concrete empirical basis a curious player could look up behind the game's abstracted 'AI accelerates AI' selfAccel bonuses, even though those bonuses are currently sourced only to AI-2027 and the METR task-horizon paper.
- **SRC-MLRC-BENCH** · [MLRC-Bench: Can Language Agents Solve Machine Learning Research Challenges?](https://arxiv.org/abs/2504.09702) · Yunxiang Zhang et al. (2025) · `empirical`
  Why it is here: Gives a skeptical reader evidence that language agents still hit hard limits on genuinely novel ML research versus engineering-heavy tasks, a useful counterweight to autonomous-AI-science hype for anyone probing the game's R&D-automation framing.

### china

- **SRC-CSIS-COUNTERING-CHINA** · [Countering China's Challenge to American AI Leadership](https://www.csis.org/analysis/countering-chinas-challenge-american-ai-leadership) · Allen, CSIS (2025) · `analysis`
  Why it is here: Explains the 'no chip, no AI' framing of China's data-center scale-up, useful background for the compute/substitution mechanics even though no single game value is drawn from it directly.
- **SRC-CARNEGIE-CHINA-REGS** · [China's AI Regulations and How They Get Made](https://carnegieendowment.org/research/2023/07/chinas-ai-regulations-and-how-they-get-made) · Matt Sheehan, Carnegie Endowment (2023) · `analysis`
  Why it is here: For readers who want to understand China's opaque AI regulatory process, useful context for the China seat's governance asymmetry even though no specific game value cites it.
- **SRC-CARNEGIE-CHINA-ROOTS** · [Tracing the Roots of China's AI Regulations](https://carnegieendowment.org/research/2024/02/tracing-the-roots-of-chinas-ai-regulations) · Matt Sheehan, Carnegie Endowment (2024) · `analysis`
  Why it is here: Traces the historical origins of China's AI governance approach, complementing SRC-CARNEGIE-CHINA-REGS for readers who want the fuller policy history behind the China seat.
- **SRC-MERICS** · [MERICS China AI/tech analyses](https://merics.org) · MERICS · `analysis`
  Why it is here: Ongoing China AI-policy analysis for a player or teacher wanting deeper context on the China seat's regulatory and geopolitical environment than the game's abstracted mechanics can show.
- **SRC-CSET-LIBRARY** · [CSET reports library](https://cset.georgetown.edu) · CSET · `analysis`
  Why it is here: CSET's research library on AI-lab concentration and governance oversight, the reading behind the lab_merger dilemma's premise; no single publication is pinned, which is why it is shelf rather than citation.
- **SRC-DEEPSEEK-V3-HARDWARE-INSIGHTS** · [Insights into DeepSeek-V3: Scaling Challenges and Reflections on Hardware for AI Architectures](https://arxiv.org/abs/2505.09343) · Chenggang Zhao et al. (2025) · `empirical`
  Why it is here: Gives a reader the actual hardware/interconnect engineering story behind cost-efficient frontier training, useful further reading for anyone wanting compute mechanics to reflect hardware co-design rather than a single scalar, beyond the Epoch/METR compute-trend sources currently cited.

### chips

- **SRC-SEMIANALYSIS-BLOG** · [SemiAnalysis](https://semianalysis.com) · SemiAnalysis · `empirical`
  Why it is here: The industry's ongoing fab/accelerator/datacenter data-and-analysis outlet that supplies many of the specific figures other cited sources (like DeepSeek cost estimates) draw on; a good next stop for a player who wants the chip/compute picture behind the game's abstracted single 'compute' resource.

### community

- **SRC-ALIGNMENT-FORUM** · [Alignment Forum](https://www.alignmentforum.org) · `analysis`
  Why it is here: A live, ongoing venue where researchers debate the exact alignment questions this game dramatizes (deceptive alignment, interpretability, corrigibility); useful for a player who wants to go deeper than the evalUncertainty mechanic into current debate.

### compute

- **SRC-EPOCH-MODELS** · [Data on Notable AI Models](https://epoch.ai/data/notable-ai-models) · Epoch AI · `empirical`
  Why it is here: The primary public database of 3,500+ real AI training runs; the natural first stop for a player or researcher who wants to check the game's abstracted compute/capability numbers against actual historical models, even though the game has no model-level tech tree drawing on it directly.

### curriculum

- **SRC-BLUEDOT-IMPACT** · [BlueDot Impact — AI Safety Fundamentals / Alignment & Governance courses](https://bluedot.org/) · BlueDot Impact · `analysis`
  Why it is here: For a classroom teacher (a stated project audience) wanting a structured follow-on curriculum after playing, BlueDot's AI Safety Fundamentals courses are the standard on-ramp into technical alignment and governance study.

### dataset

- **SRC-OWID-AI** · [Our World in Data — training computation of notable AI systems](https://ourworldindata.org/grapher/artificial-intelligence-training-computation) · Epoch/OWID · `empirical`
  Why it is here: A live, continuously-updated chart of real training-compute growth; a good external link for a player who wants to see the actual trend behind the game's abstracted compute meter, though the game embeds no live chart itself.

### deepseek

- **SRC-DEEPSEEK-V3** · [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) · DeepSeek (2024) · `empirical`
  Why it is here: The primary technical report for the DeepSeek model family whose efficiency claims and R1 follow-up drive the game's open-weights-shock storyline; read this for the actual architecture and training-cost numbers behind the narrative (the game cites the R1 report and a separate cost analysis for the actual mechanics).

### economy

- **SRC-GOLDMAN-GENAI-GDP** · [Generative AI could raise global GDP by 7%](https://www.goldmansachs.com/insights/articles/generative-ai-could-raise-global-gdp-by-7-percent) · Briggs & Kodnani, Goldman Sachs Research (2023) · `forecast`
  Why it is here: The widely-cited optimistic GDP/jobs-exposure projection for generative AI, a useful counterweight for readers comparing it against the more skeptical Acemoglu macro estimate also in this registry.
- **SRC-POWER-PROGRESS** · Power and Progress: Our Thousand-Year Struggle Over Technology and Prosperity · Acemoglu & Johnson, PublicAffairs (2023) · `analysis` *(book, obtain manually)*
  Why it is here: Acemoglu & Johnson's historical argument that a new technology's benefits depend on institutional choices, not inevitability, deeper reading behind the game's political-economy framing of automation and unrest.
- **SRC-ACEMOGLU-SIMPLE-MACRO** · [The Simple Macroeconomics of AI](https://www.nber.org/papers/w32487) · Acemoglu (2024) · `forecast`
  Why it is here: A skeptical macro estimate of modest GDP growth from AI over the next decade, useful for a player weighing how much to trust either worldview's economic optimism against the Goldman Sachs projection also in this registry.

### energy

- **SRC-DATACENTER-SITING-STRESS** · [Concentrated siting of AI data centers drives regional power-system stress under rising global compute demand](https://arxiv.org/abs/2604.06198) · Danbo Chen et al. (2026) · `empirical`
  Why it is here: Gives a reader the regional-clustering angle on grid stress (specific power systems overloaded by concentrated data-center siting, not just national totals), useful further reading for the energy_crunch event and keep_lights_on mandate beyond the aggregate IEA figures currently cited there.

### eu-governance

- **SRC-EU-AI-OFFICE** · [European AI Office](https://digital-strategy.ec.europa.eu/en/policies/ai-office) · European Commission (2026) · `empirical`
  Why it is here: Gives a reader the actual enforcement machinery behind the EU AI Act (the Office, national authorities, codes of practice) beyond the Act's high-level timeline already cited in the eu_ai_act event cards.
- **SRC-EU-GPAI-COP-PRACTICE** · [Existing Industry Practice for the EU AI Act's General-Purpose AI Code of Practice Safety and Security Measures](https://arxiv.org/abs/2504.15181) · Lily Stelling et al. (2025) · `empirical`
  Why it is here: Shows what frontier labs are actually already doing to satisfy the EU AI Act's GPAI Code of Practice, a useful bridge for anyone extending the eval_mandate or EU AI Act event cards beyond the sources currently cited there.

### eu-regulation

- **SRC-WHITECASE-EU-ACT** · [Long-awaited EU AI Act becomes law](https://www.whitecase.com/insight-alert/long-awaited-eu-ai-act-becomes-law-after-publication-eus-official-journal) · White & Case (2024) · `analysis`
  Why it is here: A law firm's practical walkthrough of the EU AI Act's entry into force, useful further reading alongside the already-cited FLI implementation timeline that drives the game's fixed EU regulatory beats.

### europe

- **SRC-DRAGHI-REPORT** · [The Draghi report: The Future of European Competitiveness](https://commission.europa.eu/topics/competitiveness/draghi-report_en) · Mario Draghi, European Commission (2024) · `analysis`
  Why it is here: Gives a curious reader or teacher the actual EU competitiveness diagnosis (the roughly 800bn-euro/yr investment gap) behind the 'Europe has real leverage and a closing window' takeaway, ahead of the Phase 4 EU seat this game does not have yet.
- **SRC-DRAGHI-WIKI** · [Draghi report](https://en.wikipedia.org/wiki/Draghi_report) · Wikipedia · `empirical`
  Why it is here: Tracks how much of the Draghi competitiveness agenda the EU has actually implemented (11.2% after one year per the EPIC Observatory), useful for a player or journalist checking whether a future EU seat reflects reality.
- **SRC-INVESTAI** · InvestAI / AI gigafactories & AI Action Summit outcomes (2025) · `empirical` *(flagged: An umbrella citation covering InvestAI, the AI gigafactories program and summit outcomes; no single official page covers all three.)*
  Why it is here: The EU's own AI-infrastructure investment push (InvestAI funding, AI gigafactories, the Feb 2025 AI Action Summit outcomes), background for the 'Europe left behind' competitiveness story the game doesn't yet model with a playable EU seat.
- **SRC-BRUSSELS-EFFECT** · The Brussels Effect · Bradford (2020) · `analysis` *(book, obtain manually)*
  Why it is here: Bradford's thesis on how EU regulation projects power globally even without EU market presence, relevant background for why the game's EU AI Act wildcard events fire regardless of whether Europe is a playable seat, though those events cite EU-AI-Act sources directly rather than this book.

### export-controls

- **SRC-CSIS-EXPORT-UPDATE** · [Understanding the Biden Administration's Updated Export Controls](https://www.csis.org/analysis/understanding-biden-administrations-updated-export-controls) · Allen, CSIS (2024) · `empirical`
  Why it is here: Documents the 2024 tightening of US export controls (closing early loopholes), useful further context for the chip/export mechanics that currently cite only the original 2022 CSIS report.
- **SRC-CSIS-ALLIES-AUTHORITY** · [Understanding U.S. Allies' Current Legal Authority to Implement Export Controls](https://www.csis.org/analysis/understanding-us-allies-current-legal-authority-implement-ai-and-semiconductor-export) · Allen & Goldston, CSIS (2025) · `empirical`
  Why it is here: For readers asking whether US allies (Netherlands, Japan, South Korea) have independent legal authority to restrict chip exports, the real-world tension echoed by the allied_export_fracture event.
- **SRC-CSIS-SEISMIC-SHIFT** · [A Seismic Shift: The New U.S. Semiconductor Export Controls](https://www.csis.org/analysis/seismic-shift-new-us-semiconductor-export-controls-and-implications-us-firms-allies-and) · CSIS (2022) · `empirical`
  Why it is here: An earlier CSIS take on the October 2022 export controls and their implications for allied firms, complementing the primary cited CSIS-EXPORT report.
- **SRC-CSIS-LIMITS-EXPORT** · [The Limits of Chip Export Controls in Meeting the China Challenge](https://www.csis.org/analysis/limits-chip-export-controls-meeting-china-challenge) · CSIS · `analysis`
  Why it is here: A critical counterpoint arguing export controls have structural limits, useful for readers weighing the substitution mechanic against the assumption that controls simply work.

### forecasting

- **SRC-EPOCH-MODEL-COUNT** · [Trends in Frontier AI Model Count: A Forecast to 2028](https://arxiv.org/abs/2504.16138) · Epoch AI (2025) · `forecast`
  Why it is here: Forecasts how many frontier-scale models will exist through 2028 as compute costs fall; useful context for why the game assumes more than one actor can approach the frontier over time, though no specific in-game number is drawn from it.
- **SRC-GRACE-2018** · [When Will AI Exceed Human Performance? Evidence from AI Experts](https://arxiv.org/abs/1705.08807) · Grace, Salvatier, Dafoe, Zhang, Evans (2018) · `forecast`
  Why it is here: The original 2017/2018 AI Impacts expert-timeline survey; useful for a reader who wants to see how much expert opinion moved between this survey and the 2024 follow-up (SRC-GRACE-SURVEY) that the game actually draws its consensus-preset anchors from.
- **SRC-COTRA-BIOANCHORS** · Forecasting TAI with Biological Anchors · Cotra, Open Philanthropy (2020) · `forecast` *(flagged: The report has no canonical page: it lives in an unlisted folder linked from the author's announcement post. We cite the work; the link situation is genuinely messy.)*
  Why it is here: The founding bio-anchors approach to forecasting transformative AI by analogy to biological brain compute; useful for a researcher tracing where the field's timeline debates (and this game's takeoff/timeline thinking) originally came from, despite backing no specific number here and having a genuinely messy citation trail.

### governance

- **SRC-ANTHROPIC-RSP** · [Anthropic Responsible Scaling Policy](https://www.anthropic.com/responsible-scaling-policy) · Anthropic · `analysis`
  Why it is here: A real frontier lab's own public capability-scaling safety commitments; relevant further reading on real-world lab self-governance, though the game has no policy card that distinctly models voluntary lab self-governance apart from the government-mandated eval_mandate and the pause-focused global_moratorium.
- **SRC-OPENAI-PREPAREDNESS** · [OpenAI Preparedness Framework (v2)](https://openai.com/index/updating-our-preparedness-framework/) · OpenAI (2025) · `analysis`
  Why it is here: For readers curious how a frontier lab operationalizes capability-risk tracking (tracked-vs-research categories, safeguard reporting, competitive-adjustment logic), a real-world analog to the game's eval-uncertainty and threshold mechanics.
- **SRC-DEEPMIND-FSF** · [Google DeepMind Frontier Safety Framework (v3)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) · Google DeepMind · `analysis`
  Why it is here: For readers who want to compare a second frontier lab's public capability-threshold and misalignment-risk framework against the game's own fog-zone/threshold system.
- **SRC-UN-GOVERNING-AI** · [Governing AI for Humanity — Final Report](https://www.un.org/sites/un2.un.org/files/governing_ai_for_humanity_final_report_en.pdf) · UN Secretary-General's High-Level Advisory Body on AI (2024) · `analysis`
  Why it is here: For a player or teacher who wants the UN's own official menu of global AI governance proposals (an international scientific panel, a coordination/verification hub, benefit-sharing mechanisms) beyond what the game's treaty mechanic dramatizes.
- **SRC-GOVAI-LIBRARY** · [GovAI research library](https://www.governance.ai) · GovAI · `analysis`
  Why it is here: A curated portal to GovAI's own governance research (institutions, compute governance, benefit-sharing) for players or teachers wanting primary sources behind the treaty and coordination mechanics.
- **SRC-CONDITIONAL-AI-TREATY** · [International Agreements on AI Safety: Review and Recommendations for a Conditional AI Safety Treaty](https://arxiv.org/abs/2503.18956) · Rebecca Scholefield, Samuel Martin, Otto Barten (2025) · `analysis`
  Why it is here: Gives a reader the fullest real-world proposal for a staged, verifiable AI safety treaty, useful further reading for anyone extending the game's treaty-window and verification-pilot mechanics beyond the sources (MAIM, Horowitz/Scharre) currently cited there.
- **SRC-AI-RISK-MGMT-STANDARDS** · [AI Risk-Management Standards Profile for General-Purpose AI and Foundation Models](https://arxiv.org/abs/2506.23949) · Anthony M. Barrett et al. (2025) · `analysis`
  Why it is here: Gives a reader a standards-profile mapping (NIST-AI-RMF-style controls for GPAI models) that could ground future audits/compliance mechanics, complementing the higher-level governance sources already in the registry.

### hardware-governance

- **SRC-FLEXHEG** · [Technical Options for Flexible Hardware-Enabled Guarantees (flexHEG)](https://arxiv.org/abs/2506.03409) (2025) · `analysis`
  Why it is here: For readers interested in the technical feasibility of hardware-based compute verification, the real-world mechanism family behind the treaty verification-pilot flag in verification_offer.json.

### interpretability

- **SRC-MONOSEMANTICITY** · [Towards Monosemanticity: Decomposing Language Models with Dictionary Learning](https://transformer-circuits.pub/2023/monosemantic-features/index.html) · Bricken, Templeton, Batson et al., Anthropic (2023) · `empirical`
  Why it is here: The original, smaller-scale demonstration that a language model's internal features can be decomposed into interpretable, monosemantic units; the direct intellectual predecessor of SRC-SCALING-MONOSEMANTICITY, which the game already cites for the safetyInsight mechanic.
- **SRC-GOLDEN-GATE** · [Golden Gate Claude](https://www.anthropic.com/news/golden-gate-claude) · Anthropic (2024) · `empirical`
  Why it is here: A vivid, non-technical public demo of what steering an interpretability feature actually looks like (an AI obsessed with the Golden Gate Bridge); accessible further reading for a player or teacher who wants a concrete picture of what the abstract safetyInsight meter represents.

### lab-governance

- **SRC-ANTHROPIC-FSR-ROADMAP** · [Anthropic's Frontier Safety Roadmap](https://www.anthropic.com/responsible-scaling-policy/roadmap) · Anthropic (2026) · `analysis`
  Why it is here: Gives a reader Anthropic's own dated-milestone breakdown of security, safeguards, alignment, and policy commitments, a more granular companion to the Responsible Scaling Policy already cited elsewhere, useful for anyone wanting to turn the game's abstract safety-posture mechanics into concrete real-world checkpoints.

### labor

- **SRC-ANTHROPIC-ECON-INDEX-ADOPTION** · [Anthropic Economic Index report: Uneven geographic and enterprise AI adoption](https://arxiv.org/abs/2511.15080) · Ruth Appel et al. (2025) · `empirical`
  Why it is here: Gives a reader Anthropic's own data showing sharply uneven AI adoption by geography and firm size, a useful corrective for anyone tightening the game's displacement-lag/diffusion-friction curves beyond the IMF, Normal Technology, and Grace-survey sources currently cited.
- **SRC-GENAI-WORK-EUROPE** · [Generative AI at Work: From Exposure to Adoption across 35 European Countries](https://arxiv.org/abs/2604.18849) · Golo Henseke (2026) · `empirical`
  Why it is here: Gives a reader EU-specific survey evidence that exposure to generative AI does not equal adoption, directly relevant further reading for the game's European seat and displacement mechanics even though no number currently cites it.
- **SRC-GENAI-LABOR-REORG** · [Generative AI and the Reorganization of Labor Demand](https://arxiv.org/abs/2605.23159) · Fangyan Wang, Zaiyan Wei, Yang Wang (2026) · `empirical`
  Why it is here: Gives a reader evidence that firms reallocate and redesign tasks rather than simply cutting jobs, a nuance the worldview presets gesture at but don't cite directly, useful for anyone refining the displacement/diffusion balance mechanics.
- **SRC-GENAI-PRODUCTIVITY-META** · [A meta-analysis of the effect of generative AI on productivity and learning in programming](https://arxiv.org/abs/2605.04779) · Sebastian Maier et al. (2026) · `empirical`
  Why it is here: Gives a reader an evidence-based middle ground between 'AI changes nothing' and 'AI replaces programmers now,' useful further reading for anyone building out education/upskilling mechanics the game doesn't yet have.

### labor-market

- **SRC-IMF-BLOG** · [AI Will Transform the Global Economy](https://www.imf.org/en/blogs/articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity) · Georgieva, IMF (2024) · `analysis`
  Why it is here: The IMF's own plain-language summary of its Gen-AI labor-market findings (the same underlying report that backs the job-displacement mechanic elsewhere), good for a reader who wants the headline case without the full SDN paper.
- **SRC-IMF-SKILLGAPS** · [Bridging Skill Gaps for the Future: New Jobs Creation in the AI Age](https://www.imf.org/-/media/files/publications/sdn/2026/english/sdnea2026001.pdf) · IMF SDN (2026) · `empirical`
  Why it is here: Evidence on declining entry-level hiring in the AI era, a real labor-market dynamic the game's single job-displacement scalar doesn't yet break out separately; useful reading for a future 'entry-level jobs' mechanic.
- **SRC-GPTS-ARE-GPTS** · [GPTs are GPTs](https://arxiv.org/abs/2303.10130) · Eloundou et al. (2023) · `empirical`
  Why it is here: The original occupational-exposure measurement study for LLMs, useful background on the methodology behind 'percent of jobs exposed' claims used elsewhere in the registry.
- **SRC-BRYNJOLFSSON-GENAI-WORK** · [Generative AI at Work](https://www.nber.org/papers/w31161) · Brynjolfsson et al. (2023) · `empirical`
  Why it is here: The call-center field experiment showing real productivity gains from generative AI assistance, primary evidence behind the game's general 'AI boosts productivity' framing.
- **SRC-NOY-ZHANG** · [Experimental Evidence on Productivity Effects of GenAI](https://pubmed.ncbi.nlm.nih.gov/37440646/) · Noy & Zhang (2023) · `empirical`
  Why it is here: A controlled experiment showing GenAI narrows the productivity gap between weaker and stronger writers, useful background on the productivity-and-equity angle behind the game's automation mechanics.
- **SRC-DELLACQUA-JAGGED** · [Navigating the Jagged Technological Frontier](https://pubsonline.informs.org/doi/10.1287/orsc.2025.21838) · Dell'Acqua et al., HBS (2023) · `empirical`
  Why it is here: The HBS consulting-task study showing GenAI helps unevenly across tasks (the 'jagged frontier'), good background for why the game treats automation benefits as uneven rather than uniform.

### leaderboard

- **SRC-LMARENA** · [LMArena (Chatbot Arena / "Arena")](https://arena.ai/) · UC Berkeley SkyLab → Arena Inc. · `empirical`
  Why it is here: For players wanting to see today's actual crowd-sourced model rankings as a living companion to the game's abstract 0-1000 capability meter.

### military-ai

- **SRC-MILITARY-AI-REGULATION** · [Military AI Needs Technically-Informed Regulation to Safeguard AI Research and its Applications](https://arxiv.org/abs/2505.18371) · Riley Simmons-Edler et al. (2025) · `analysis`
  Why it is here: Gives a reader a technically-grounded case for regulating military AI applications, a dedicated starter reference for the autonomous_targeting_demo and civil_military_fusion event cards beyond the AI-2027 and simulation-calibration sources currently cited there.

### model-cards

- **SRC-MODEL-DOCS-BUNDLE** · System/model cards (GPT-4, Claude 3/Opus, Gemini); Papers with Code; Alignment Forum / LessWrong key posts · `empirical` *(flagged: An umbrella entry for model release documentation across several labs; no single link to verify.)*
  Why it is here: For a researcher wanting primary model documentation and reproducible benchmark tracking behind the game's abstracted capability meter, this points to real published model cards (GPT-4, Claude, Gemini) and Papers with Code's benchmark leaderboards.

### policy-tracker

- **SRC-OECD-AI-OBSERVATORY** · [OECD.AI Policy Observatory](https://oecd.ai/en/) · OECD · `empirical`
  Why it is here: For a player or teacher wanting to see actual national AI policies and strategies rather than the game's abstracted policy-card hand, OECD.AI's live observatory tracks real government AI initiatives worldwide.

### problem-profile

- **SRC-80K-AI-CATASTROPHE** · [Preventing an AI-related catastrophe (problem profile)](https://80000hours.org/problem-profiles/artificial-intelligence/) · Benjamin Hilton, 80,000 Hours · `analysis`
  Why it is here: An accessible on-ramp for a player who finishes a run wanting the AI-catastrophe case explained in plain language, aimed at people considering working on the problem rather than researchers.
- **SRC-80K-GRADUAL-DISEMPOWERMENT** · [Gradual disempowerment (problem profile)](https://80000hours.org/problem-profiles/gradual-disempowerment/) · 80,000 Hours (2025) · `analysis`
  Why it is here: An accessible explainer of the gradual-disempowerment risk model behind the agency-erosion pressure the game tracks; good further reading once the planned sixth ending ships and someone wants the argument in plain language.

### public-opinion

- **SRC-PUBLIC-OPINION-AI-MODERATION** · [What do people expect from Artificial Intelligence? Public opinion on alignment in AI moderation from Germany and the United States](https://arxiv.org/abs/2504.12476) · Andreas Jungherr, Adrian Rauchfleisch (2025) · `empirical`
  Why it is here: Gives a reader comparative US/German survey evidence on what people actually want from AI moderation and alignment, useful grounding for the public-trust and legitimacy mechanics (public_opinion_swing, election_scandal) beyond the general AI Index source currently cited there.
- **SRC-PUBLIC-OPINION-DIGITAL-MINDS** · [Public Opinion and The Rise of Digital Minds: Perceived Risk, Trust, and Regulation Support](https://arxiv.org/abs/2504.21849) · Justin B. Bullock et al. (2025) · `empirical`
  Why it is here: Gives a reader survey data tying perceived AI risk and trust to appetite for regulation, useful further reading for the public-trust/regulation-support side of the game beyond the general AI Index source currently cited in public_opinion_swing.

### risk

- **SRC-INTELLIGENCE-CURSE** · [The Intelligence Curse](https://intelligence-curse.ai/) · Luke Drago & Rudolf Laine (2025) · `analysis`
  Why it is here: For players curious about the economic-power-concentration argument behind the Societal Breakdown ending's premise, distinct from the IMF/OECD job-displacement data that actually drives that ending's mechanics in-game.
- **SRC-IAISR-UPDATE-1** · [International AI Safety Report — First Key Update: Capabilities & Risk Implications](https://arxiv.org/abs/2510.13653) · Bengio et al. (2025) · `analysis`
  Why it is here: For readers who want the most recent (Oct 2025) expert-consensus update on frontier capability trends and risk implications, one step ahead of the primary IAISR report the consensus preset is built on.
- **SRC-BOSTROM-SUPERINTELLIGENCE** · Superintelligence: Paths, Dangers, Strategies · Nick Bostrom, Oxford University Press (2014) · `analysis` *(book, obtain manually)*
  Why it is here: The foundational instrumental-convergence and orthogonality-thesis argument underlying the general existential-risk vocabulary echoed by the game's cautious worldview preset.

### risk-taxonomy

- **SRC-MIT-AI-RISK-REPO** · [MIT AI Risk Repository](https://airisk.mit.edu/) · Slattery, Saeri et al., MIT FutureTech (2024) · `empirical`
  Why it is here: For a teacher or researcher who wants the academic taxonomy behind why the game's incident ladder spans such different kinds of AI risk (misuse, accidents, systemic, geopolitical), this database catalogs 1,600+ documented risks across 65+ frameworks.

### safety

- **SRC-CONCRETE-PROBLEMS** · [Concrete Problems in AI Safety](https://arxiv.org/abs/1606.06565) · Amodei, Olah, Steinhardt, Christiano, Schulman, Mané (2016) · `analysis`
  Why it is here: The field-defining 2016 taxonomy of concrete AI safety failure modes (side effects, reward hacking, safe exploration, scalable oversight, distributional shift); a strong entry point for a curious player or teacher who wants the original framing behind 'why AI safety is hard,' even though the game's actual incident system draws more specifically on later deception-focused papers.
- **SRC-AI-CONTROL** · [AI Control: Improving Safety Despite Intentional Subversion](https://arxiv.org/abs/2312.06942) · Greenblatt, Shlegeris, Sachan, Roger, Redwood Research (2023) · `analysis`
  Why it is here: Proposes 'control' (catching and restricting a misaligned deployed model even without solving alignment) as a safety strategy distinct from alignment training; relevant further reading, though the game does not currently implement a distinct control-agenda mechanic (an earlier registry draft overclaimed one).

### scaling

- **SRC-KAPLAN-SCALING** · [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) · Kaplan, McCandlish, Henighan, Brown, Amodei et al., OpenAI (2020) · `empirical`
  Why it is here: Foundational scaling-laws paper explaining why bigger training runs predictably buy more capability; useful for a reader who wants to understand why the game ties capability progress to compute investment at all, even though the specific curve values here come from Epoch/METR data rather than this paper.
- **SRC-CHINCHILLA** · [Training Compute-Optimal Large Language Models (Chinchilla)](https://arxiv.org/abs/2203.15556) · Hoffmann et al., DeepMind (2022) · `empirical`
  Why it is here: Explains the real compute/parameters/data tradeoff behind compute-optimal training; good background for why the game abstracts training investment into a single compute resource rather than modeling model size and dataset size separately.
- **SRC-CHINCHILLA-REPLICATION** · [Chinchilla Scaling: A replication attempt](https://arxiv.org/abs/2404.10102) · Besiroglu, Erdil, Barnett, You, Epoch AI (2024) · `empirical`
  Why it is here: Shows that even a landmark scaling-law paper's specific numbers don't replicate cleanly; useful for a skeptical reader who wants to see how contested the compute-to-capability curves underlying this game's mechanics really are in the literature.

### serious-games

- **SRC-INTELLIGENCE-RISING-CSER** · [Intelligence Rising (project page + facilitation)](https://www.cser.ac.uk/work/intelligence-rising/) · CSER (Cambridge) · `design`
  Why it is here: For a player or researcher curious about the real academic wargame this design descends from, CSER's project page is the primary hub for Intelligence Rising's facilitation materials and history.
- **SRC-AVIN-AI-FUTURES-SURVEY** · [Exploring Artificial Intelligence Futures (survey of methods)](https://www.openbookpublishers.com/books/10.11647/obp.0360/chapters/10.11647/obp.0360.08) · Shahar Avin (2019) · `design`
  Why it is here: For readers curious how game-based exploration of AI futures compares to narrative scenario-writing (like AI-2027) or survey forecasting, this is Avin's overview of the methodological menu the project's format sits within.
- **SRC-SERIOUS-GAMES-BUNDLE** · RAND wargaming series; Schelling on gaming; Wouters et al. and Clark et al. serious-games meta-analyses; Bogost Persuasive Games; matrix-games & TTX methodology; climate-game studies (e.g. Daybreak) · `design` *(flagged: An umbrella entry for several works on learning through games; the individual works are listed in this registry, but there is no single link to verify.)*
  Why it is here: For a teacher or researcher wanting the wider serious-games/wargaming literature behind the debrief design (Schelling on gaming, matrix-game/TTX methodology, climate-game studies like Daybreak) beyond the four works already listed individually.
- **SRC-CLARK-2016** · [Digital Games for Learning meta-analysis](https://journals.sagepub.com/doi/10.3102/0034654315582065) · Clark et al. (2016) · `design`
  Why it is here: For readers who want the empirical backing behind 'games can teach, but design matters,' this meta-analysis of digital game-based learning outcomes complements Wouters et al. (already grounding the debrief-screen design) with a broader review across digital games generally.
- **SRC-LOPEZ-FERNANDEZ-2024** · [Learning and Motivational Impact of Game-Based Learning: Comparing Face-to-Face and Online Formats on Computer Science Education](https://arxiv.org/abs/2407.07762) · Daniel López-Fernández et al. (2024) · `design`
  Why it is here: Gives a teacher or contributor evidence that game-based learning holds up whether played face-to-face or online, useful supporting citation for the project's classroom-and-solo delivery commitment even though it wasn't the original source of that decision.
- **SRC-RIBEIRO-EVACUATION-GAMES** · [Using Serious Games to Train Evacuation Behaviour](https://arxiv.org/abs/1303.3828) · João Ribeiro et al. (2013) · `design`
  Why it is here: Gives a reader a non-AI precedent showing serious games can genuinely train behavior for high-stakes scenarios, honest supporting evidence for the project's fun-first pedagogy thesis without backing any specific mechanic.

### summit-diplomacy

- **SRC-BLETCHLEY** · [The Bletchley Declaration](https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration/the-bletchley-declaration-by-countries-attending-the-ai-safety-summit-1-2-november-2023) · AI Safety Summit (28 countries + EU) (2023) · `empirical`
  Why it is here: For a player or teacher wanting the real diplomatic starting point of today's AI-safety summit process (the first multilateral declaration that frontier AI risk needs cooperative attention), as background to the game's more mechanistic treaty chain, which is actually sourced from Ho et al.'s institutional-design research.
- **SRC-PARIS-STATEMENT** · [Statement on Inclusive and Sustainable AI](https://www.elysee.fr/en/emmanuel-macron/2025/02/11/statement-on-inclusive-and-sustainable-artificial-intelligence-for-people-and-the-planet) · France/co-chairs, Paris AI Action Summit (2025) · `empirical`
  Why it is here: For a player curious how a real recent summit actually fractured (the US and UK declining to sign the 2025 Paris statement), as a case study alongside the game's own fracturing-coordination beats in the treaty_feeler and global_moratorium mechanics.

### us-policy

- **SRC-AI-ACTION-PLAN** · [Winning the Race: America's AI Action Plan](https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf) · White House (OSTP) (2025) · `analysis`
  Why it is here: The White House's 2025 AI strategy document, giving readers the current US policy backdrop (deregulation, export controls, infrastructure buildout) that the game's natsec and export mechanics gesture at.

### wargaming

- **SRC-RAND-WARGAMING** · [RAND wargaming methodology series](https://www.rand.org) · RAND · `design` *(flagged: An umbrella entry for RAND's wargaming methodology literature; individual reports verify, the bundle as such has no single link.)*
  Why it is here: For readers curious about the tabletop-wargaming methodology (matrix games, structured turn phases) that the project's turn/era/event structure resembles, RAND's wargaming-methodology literature is the field's reference; no single report is pinned here.

### worldview-optimistic

- **SRC-PLANNING-AGI** · [Planning for AGI and beyond](https://openai.com/index/planning-for-agi-and-beyond/) · Altman, OpenAI (2023) · `analysis`
  Why it is here: OpenAI's own stated AGI-development philosophy in its own words, useful for a player wanting the lab-worldview case behind capability-heavy default allocations elsewhere in the game (which cite the design handover, not this essay, directly).

### worldview-skeptic

- **SRC-NORMAL-TECH-GUIDE** · [A guide to understanding AI as normal technology](https://www.normaltech.ai/p/a-guide-to-understanding-ai-as-normal) · Narayanan & Kapoor (2025) · `analysis`
  Why it is here: Narayanan & Kapoor's plain-language explainer of the 'AI as Normal Technology' thesis that backs the skeptic worldview preset elsewhere (via the main essay); a gentler entry point to the same argument.

### x-risk

- **SRC-CAIS-STATEMENT** · [Statement on AI Risk](https://safe.ai/work/statement-on-ai-risk) · Center for AI Safety (CAIS) (2023) · `analysis`
  Why it is here: The one-sentence expert-consensus statement that AI extinction risk should be a global priority, evidence for a player wanting to know the game's doom worldview preset isn't fringe speculation.
- **SRC-PRECIPICE** · [The Precipice: Existential Risk and the Future of Humanity](https://theprecipice.com/) · Toby Ord (2020) · `analysis` *(book, obtain manually)*
  Why it is here: Ord's canonical popular introduction to existential risk, a gentler companion to Carlsmith's technical paper for a reader building the case behind the game's doom-worldview preset.
- **SRC-COMPENDIUM** · [The Compendium](https://www.thecompendium.ai/) · Leahy, Alfour et al. (2024) · `analysis`
  Why it is here: A risk-emphasizing synthesis of the AI existential-risk case for a player who finishes a cautious-worldview run wanting the fullest version of the doom argument in one place, alongside the game's already-cited Carlsmith and IABIED sources.
