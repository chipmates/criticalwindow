# Sources

The evidence base. Machine-readable registry: [`data/sources.json`](data/sources.json)
(this file is generated from it; do not edit by hand, run `pnpm sources-md`).

Every number in `data/` cites an entry here by ID, and `pnpm validate` enforces it.
Found a dead link or a better source? Open a "source check" issue. That is a real
contribution and it is welcome.

168 entries. Status: 9 book, 158 pending, 1 verified.

## ai-index

- **SRC-AI-INDEX-2025** · [The 2025 AI Index Report](https://hai.stanford.edu/ai-index/2025-ai-index-report) · Stanford HAI (2025) _(verification pending)_
- **SRC-AI-INDEX-2026** · [Artificial Intelligence Index Report 2026](https://arxiv.org/abs/2606.15708) · Stanford Institute for Human-Centered AI (2026). Best single annual synthesis for capabilities, policy, labor, science, medicine, and AI sovereignty; ideal baseline world-state reference for opening turns _(verification pending)_

## ai-safety

- **SRC-IASR-2026** · [International AI Safety Report 2026](https://arxiv.org/abs/2602.21012) · Yoshua Bengio et al. (2026). Most authoritative recent multi-expert survey of capabilities, risks, and safeguards; core anchor document _(verification pending)_
- **SRC-IASR-2025-UPDATE2-GA** · [International AI Safety Report 2025: Second Key Update: Technical Safeguards and Risk Management](https://arxiv.org/abs/2511.19863) · Yoshua Bengio et al. (2025). Focuses on operational safeguards and risk-management practice rather than abstract risk alone _(verification pending)_
- **SRC-AGENTIC-MISALIGNMENT** · [Agentic Misalignment: How LLMs Could Be Insider Threats](https://arxiv.org/abs/2510.05179) · Aengus Lynch et al. (2025). Most directly game-relevant recent paper for sabotage / blackmail / insider-threat event chains under high-autonomy deployment _(verification pending)_
- **SRC-BLACKBOX-SCHEMING-MONITORS** · [Training Deliberative Monitors for Black-Box Scheming Detection](https://arxiv.org/abs/2605.29601) · Aditya Sinha et al. (2026). Good for control-stack / monitoring-investment mechanics more concrete than generic alignment spending _(verification pending)_

## alignment

- **SRC-SLEEPER** · [Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training](https://arxiv.org/abs/2401.05566) · Hubinger et al., Anthropic (2024). deceptive-alignment mechanic; eval uncertainty band _(verification pending)_
- **SRC-ALIGNMENT-FAKING** · [Alignment faking in large language models](https://arxiv.org/abs/2412.14093) · Greenblatt, Denison et al., Anthropic/Redwood (2024) _(verification pending)_
- **SRC-SCHEMING** · [Frontier Models are Capable of In-context Scheming](https://arxiv.org/abs/2412.04984) · Meinke, Schoen et al., Apollo Research (2024) _(verification pending)_
- **SRC-RLHF** · [Deep reinforcement learning from human preferences (RLHF)](https://arxiv.org/abs/1706.03741) · Christiano, Leike, Brown, Martic, Legg, Amodei (2017) _(verification pending)_
- **SRC-INSTRUCTGPT** · [Training language models to follow instructions with human feedback (InstructGPT)](https://arxiv.org/abs/2203.02155) · Ouyang et al., OpenAI (2022) _(verification pending)_
- **SRC-CONSTITUTIONAL-AI** · [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) · Bai, Kadavath, Kundu et al., Anthropic (2022) _(verification pending)_
- **SRC-WEAK-TO-STRONG** · [Weak-to-strong generalization](https://arxiv.org/abs/2312.09390) · Burns, Izmailov, Kirchner, Leike, Sutskever et al., OpenAI (2023) _(verification pending)_
- **SRC-SPEC-GAMING** · [Specification gaming: the flip side of AI ingenuity](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/) · Krakovna et al., DeepMind (2020). reward-hacking mechanic _(verification pending)_
- **SRC-GOAL-MISGEN** · [Goal Misgeneralization: Why Correct Specifications Aren't Enough](https://arxiv.org/abs/2210.01790) · Shah, Varma, Kumar et al., DeepMind (2022) _(verification pending)_
- **SRC-GOAL-MISGEN-RL** · [Goal Misgeneralization in Deep Reinforcement Learning](https://arxiv.org/abs/2105.14111) · Langosco, Koch et al. (2022) _(verification pending)_
- **SRC-POWER-SEEKING-POLICIES** · [Optimal Policies Tend to Seek Power](https://arxiv.org/abs/1912.01683) · Turner, Smith, Shah, Critch, Tadepalli (2021). instrumental convergence / power-seeking _(verification pending)_
- **SRC-ALIGNMENT-SURVEY** · [AI Alignment: A Comprehensive Survey](https://arxiv.org/abs/2310.19852) · Ji et al. (2023). background reference _(verification pending)_
- **SRC-HUMAN-COMPATIBLE** · Human Compatible: AI and the Problem of Control · Stuart Russell, Viking/Penguin (2019). alignment framing _(book, obtain manually)_

## benchmark

- **SRC-ARC-AGI** · [ARC-AGI benchmark](https://arcprize.org/arc-agi) · Chollet, Knoop, ARC Prize Foundation. capability benchmark _(verification pending)_
- **SRC-ARC-AGI-2** · [ARC-AGI-2: A New Challenge for Frontier AI Reasoning Systems](https://arxiv.org/abs/2505.11831) · François Chollet, Mike Knoop, Gregory Kamradt, Bryan Landers, Henry Pinkard (2025). Successor benchmark to ARC-AGI; better for reasoning-frontier calibration _(verification pending)_
- **SRC-RE-BENCH** · [RE-Bench: Evaluating frontier AI R&D capabilities of language model agents against human experts](https://arxiv.org/abs/2411.15114) · Hjalmar Wijk et al., METR (2024). Most gameplay-relevant capability benchmark for AI-accelerates-AI; grounds R&D-automation, recursive-acceleration, and lab-race dynamics _(verification pending)_
- **SRC-MLRC-BENCH** · [MLRC-Bench: Can Language Agents Solve Machine Learning Research Challenges?](https://arxiv.org/abs/2504.09702) · Yunxiang Zhang et al. (2025). Counterweight to hype around autonomous AI science; shows harder limits on novel ML-research performance vs. engineering-heavy tasks _(verification pending)_
- **SRC-BENCH-COP** · [Bench-2-CoP: Can We Trust Benchmarking for EU AI Compliance?](https://arxiv.org/abs/2508.05464) · Matteo Prandi et al. (2025). Shows common benchmarks under-measure the systemic risks regulators increasingly care about _(verification pending)_

## benchmarks

- **SRC-AISI-FRONTIER-TRENDS** · [Frontier AI Trends Report](https://www.aisi.gov.uk/frontier-ai-trends-report) · UK AI Security Institute (2026). Strongest recent public source for task-length trends, cyber/CBRN/autonomy curves, safeguard bypass effort, and open-vs-closed gap narrowing; useful for escalation mechanics _(verification pending)_

## capabilities

- **SRC-METR-HORIZON** · [Measuring AI Ability to Complete Long Tasks (task-horizon)](https://arxiv.org/abs/2503.14499) · Kwa, West et al., METR (2025). 50% task-completion time horizon doubling ~every 7 months since 2019; capability clock calibration _(verification pending)_

## china

- **SRC-CSIS-COUNTERING-CHINA** · [Countering China's Challenge to American AI Leadership](https://www.csis.org/analysis/countering-chinas-challenge-american-ai-leadership) · Allen, CSIS (2025). data-center scale, "No chip, no AI" _(verification pending)_
- **SRC-CARNEGIE-CHINA-REGS** · [China's AI Regulations and How They Get Made](https://carnegieendowment.org/research/2023/07/chinas-ai-regulations-and-how-they-get-made) · Matt Sheehan, Carnegie Endowment (2023) _(verification pending)_
- **SRC-CARNEGIE-CHINA-ROOTS** · [Tracing the Roots of China's AI Regulations](https://carnegieendowment.org/research/2024/02/tracing-the-roots-of-chinas-ai-regulations) · Matt Sheehan, Carnegie Endowment (2024) _(verification pending)_
- **SRC-MERICS** · [MERICS China AI/tech analyses](https://merics.org) · MERICS _(verification pending)_
- **SRC-CSET-LIBRARY** · [CSET reports library](https://cset.georgetown.edu) · CSET _(verification pending)_
- **SRC-DEEPSEEK-R1-GA** · [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) · DeepSeek-AI (2025). Grounds reasoning-focused competition, open distillation, and lower-cost catch-up _(verification pending)_
- **SRC-DEEPSEEK-V3-HARDWARE-INSIGHTS** · [Insights into DeepSeek-V3: Scaling Challenges and Reflections on Hardware for AI Architectures](https://arxiv.org/abs/2505.09343) · Chenggang Zhao et al. (2025). Ties model strategy to interconnects, precision formats, and hardware co-design rather than treating compute as a single scalar _(verification pending)_
- **SRC-US-POLICY-CHINA-OPEN-ECOSYSTEM** · [U.S. Policies Unintentionally Accelerated China's Open AI Ecosystems](https://arxiv.org/abs/2606.15999) · Wang Jin et al. (2026). Strategic counterpoint: export controls can slow frontier access while strengthening open, adaptive Chinese ecosystems _(verification pending)_

## chip-war

- **SRC-CHIP-WAR** · Chip War: The Fight for the World's Most Critical Technology · Chris Miller, Scribner (2022). TSMC/Taiwan chokepoint background _(book, obtain manually)_

## chips

- **SRC-CSET-AI-CHIPS** · [AI Chips: What They Are and Why They Matter](https://cset.georgetown.edu) · Khan & Mann, CSET (2020) _(verification pending)_
- **SRC-CNAS-SMUGGLING** · [Preventing AI Chip Smuggling](https://www.cnas.org) · Fist et al., CNAS _(verification pending)_
- **SRC-SEMIANALYSIS-BLOG** · [SemiAnalysis](https://semianalysis.com) · SemiAnalysis. live industry-data layer: fabs, accelerators, datacenters _(verification pending)_

## community

- **SRC-ALIGNMENT-FORUM** · [Alignment Forum](https://www.alignmentforum.org) _(verification pending)_

## compute

- **SRC-EPOCH-MODELS** · [Data on Notable AI Models](https://epoch.ai/data/notable-ai-models) · Epoch AI. >3,500-model training-run database for the tech tree _(verification pending)_
- **SRC-EPOCH-COMPUTE** · [Data on the Trajectory of AI (databases hub)](https://epoch.ai/data) · Epoch AI. compute tech-tree and growth-curve anchor; frontier training compute doubling every 5.2 months since 2020 (~5x/yr) _(verification pending)_
- **SRC-EPOCH-DOUBLING** · [The training compute of notable AI models has been doubling roughly every six months](https://epoch.ai/data-insights/compute-trend-post-2010) · Rahman & Owen, Epoch AI (2024). compute growth-rate anchor _(verification pending)_

## compute-governance

- **SRC-GOVAI-COMPUTE** · [Computing Power and the Governance of AI](https://arxiv.org/abs/2402.08797) · Sastry, Heim, Belfield, Anderljung, Brundage et al., GovAI/OpenAI (2024). compute-governance mechanic _(verification pending)_

## curriculum

- **SRC-BLUEDOT-IMPACT** · [BlueDot Impact — AI Safety Fundamentals / Alignment & Governance courses](https://bluedot.org/) · BlueDot Impact. curriculum scaffolding _(verification pending)_

## dataset

- **SRC-OWID-AI** · [Our World in Data — training computation of notable AI systems](https://ourworldindata.org/grapher/artificial-intelligence-training-computation) · Epoch/OWID. live chart/data for UI _(verification pending)_

## deepseek

- **SRC-DEEPSEEK-COST** · [DeepSeek Debates: Chinese Leadership on Cost, True Training Cost, Closed Model Margin Impacts](https://newsletter.semianalysis.com/p/deepseek-debates) · Patel et al., SemiAnalysis (2025). DeepSeek cost mechanic (~$1.6B server capex; MLA cuts KV-cache 93.3%) _(verification pending)_
- **SRC-DEEPSEEK-V3** · [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) · DeepSeek (2024) _(verification pending)_
- **SRC-DEEPSEEK-R1** · [DeepSeek-R1](https://arxiv.org/abs/2501.12948) · DeepSeek (2025) _(verification pending)_

## economics

- **SRC-GATE** · [GATE: An Integrated Assessment Model for AI Automation](https://arxiv.org/abs/2503.04941) · Epoch AI (2025). compute-centric economic takeoff model; automation/growth economic engine _(verification pending)_

## economy

- **SRC-GOLDMAN-GENAI-GDP** · [Generative AI could raise global GDP by 7%](https://www.goldmansachs.com/insights/articles/generative-ai-could-raise-global-gdp-by-7-percent) · Briggs & Kodnani, Goldman Sachs Research (2023). ~$7T/decade GDP; ~300M full-time jobs exposed to automation _(verification pending)_
- **SRC-POWER-PROGRESS** · Power and Progress: Our Thousand-Year Struggle Over Technology and Prosperity · Acemoglu & Johnson, PublicAffairs (2023). macro/political-economy of automation _(book, obtain manually)_
- **SRC-ACEMOGLU-SIMPLE-MACRO** · The Simple Macroeconomics of AI · Acemoglu (2024) _(verification pending)_

## energy

- **SRC-IEA-ENERGY-AI** · [Energy and AI](https://www.iea.org/reports/energy-and-ai) · International Energy Agency (2025). Grounds electricity demand, energy-source mix, affordability, security, and climate tradeoffs _(verification pending)_
- **SRC-GRID-DATACENTER** · [Environmental Burden of United States Data Centers in the Artificial Intelligence Era](https://arxiv.org/abs/2411.09786) · Gianluca Guidi et al. (2024). Local environmental backlash, carbon intensity, and fossil-fuel dependence around data-center expansion _(verification pending)_
- **SRC-DATACENTER-SITING-STRESS** · [Concentrated siting of AI data centers drives regional power-system stress under rising global compute demand](https://arxiv.org/abs/2604.06198) · Danbo Chen et al. (2026). Region-specific bottleneck mechanics: not just total TWh, but clustered siting and local grid vulnerability _(verification pending)_

## eu-governance

- **SRC-EU-AI-OFFICE** · [European AI Office](https://digital-strategy.ec.europa.eu/en/policies/ai-office) · European Commission (2026). Captures the implementation machinery, enforcement structure, and current supporting instruments (better than generic AI Act explainers) _(verification pending)_
- **SRC-EU-GPAI-COP-PRACTICE** · [Existing Industry Practice for the EU AI Act's General-Purpose AI Code of Practice Safety and Security Measures](https://arxiv.org/abs/2504.15181) · Lily Stelling et al. (2025). Bridge source between frontier-lab safety frameworks and EU compliance language; grounds regulatory-meets-technical-measures gameplay _(verification pending)_

## eu-regulation

- **SRC-EU-AI-ACT** · [EU AI Act (Regulation (EU) 2024/1689)](https://artificialintelligenceact.eu/the-act/) · EU (2024) _(verification pending)_
- **SRC-EU-AI-ACT-TIMELINE** · [EU AI Act Implementation Timeline](https://artificialintelligenceact.eu/implementation-timeline/) · FLI. phased dates (bans Feb 2025; GPAI Aug 2025; bulk Aug 2026; high-risk Aug 2027) _(verification pending)_
- **SRC-WHITECASE-EU-ACT** · [Long-awaited EU AI Act becomes law](https://www.whitecase.com/insight-alert/long-awaited-eu-ai-act-becomes-law-after-publication-eus-official-journal) · White & Case (2024) _(verification pending)_

## europe

- **SRC-DRAGHI-REPORT** · [The Draghi report: The Future of European Competitiveness](https://commission.europa.eu/topics/competitiveness/draghi-report_en) · Mario Draghi, European Commission (2024). "Europe left behind" / competitiveness mechanic (€800B/yr investment gap) _(verification pending)_
- **SRC-DRAGHI-WIKI** · [Draghi report](https://en.wikipedia.org/wiki/Draghi_report) · Wikipedia. implementation tracking incl. EPIC Observatory: 11.2% fully implemented after 1 yr _(verification pending)_
- **SRC-INVESTAI** · InvestAI / AI gigafactories & AI Action Summit outcomes (2025) _(verification pending)_
- **SRC-BRUSSELS-EFFECT** · The Brussels Effect · Bradford (2020) _(book, obtain manually)_

## evals

- **SRC-SLEEPER-PROBES** · [Simple probes can catch sleeper agents](https://www.anthropic.com/research/probes-catch-sleeper-agents) · Anthropic Alignment Science (2024). detection/eval mechanic _(verification pending)_
- **SRC-UK-AISI** · [UK AI Security Institute (formerly AI Safety Institute)](https://www.aisi.gov.uk/) · UK AISI. eval/regulation actor _(verification pending)_

## export-controls

- **SRC-CSIS-EXPORT** · [Choking off China's Access to the Future of AI](https://www.csis.org/analysis/choking-chinas-access-future-ai) · Gregory Allen, CSIS (2022). Oct 7 2022 export controls _(verification pending)_
- **SRC-CSIS-EXPORT-UPDATE** · [Understanding the Biden Administration's Updated Export Controls](https://www.csis.org/analysis/understanding-biden-administrations-updated-export-controls) · Allen, CSIS (2024) _(verification pending)_
- **SRC-CSIS-SME-CONTROLS** · [The True Impact of Allied Export Controls on the U.S. and Chinese SME Industries](https://www.csis.org/analysis/true-impact-allied-export-controls-us-and-chinese-semiconductor-manufacturing-equipment) · Allen, CSIS (2024) _(verification pending)_
- **SRC-CSIS-ALLIES-AUTHORITY** · [Understanding U.S. Allies' Current Legal Authority to Implement Export Controls](https://www.csis.org/analysis/understanding-us-allies-current-legal-authority-implement-ai-and-semiconductor-export) · Allen & Goldston, CSIS (2025) _(verification pending)_
- **SRC-CSIS-SEISMIC-SHIFT** · [A Seismic Shift: The New U.S. Semiconductor Export Controls](https://www.csis.org/analysis/seismic-shift-new-us-semiconductor-export-controls-and-implications-us-firms-allies-and) · CSIS (2022) _(verification pending)_
- **SRC-CSIS-LIMITS-EXPORT** · [The Limits of Chip Export Controls in Meeting the China Challenge](https://www.csis.org/analysis/limits-chip-export-controls-meeting-china-challenge) · CSIS _(verification pending)_

## forecasting

- **SRC-EPOCH-MODEL-COUNT** · [Trends in Frontier AI Model Count: A Forecast to 2028](https://arxiv.org/abs/2504.16138) · Epoch AI (2025). models exceeding compute thresholds over time _(verification pending)_
- **SRC-SITUATIONAL-AWARENESS** · [Situational Awareness: The Decade Ahead](https://situational-awareness.ai/) · Leopold Aschenbrenner (2024). aggressive-timeline / intelligence-explosion worldview preset _(verification pending)_
- **SRC-GRACE-2018** · [When Will AI Exceed Human Performance? Evidence from AI Experts](https://arxiv.org/abs/1705.08807) · Grace, Salvatier, Dafoe, Zhang, Evans (2018). expert-timeline survey (AI Impacts); treat estimates as ranges, not points _(verification pending)_
- **SRC-GRACE-SURVEY** · [Thousands of AI Authors on the Future of AI](https://arxiv.org/abs/2401.02843) · Grace et al. (2024). expert-survey timeline distributions; consensus preset anchors (HANDOVER core anchor) _(verification pending)_
- **SRC-COTRA-BIOANCHORS** · Forecasting TAI with Biological Anchors · Cotra, Open Philanthropy (2020). bio-anchors timeline model _(verification pending)_
- **SRC-XPT** · [Forecasting Existential Risks (Existential Risk Persuasion Tournament / XPT)](https://forecastingresearch.org/xpt) · Karger, Rosenberg, Tetlock et al., FRI (2023). forecasting-disagreement mechanic _(verification pending)_

## game-theory

- **SRC-RACING-PRECIPICE** · [Racing to the precipice: a model of AI development](https://link.springer.com/article/10.1007/s00146-015-0590-y) · Armstrong, Bostrom, Shulman, AI & Society (2016). race game-theory core model _(verification pending)_

## general

- **SRC-DESIGN-HANDOVER** · Race Conditions design handover (founding document) · project (2026). design constants with no empirical referent (turn counts, starting defaults, allocation defaults)

## governance

- **SRC-ANTHROPIC-RSP** · [Anthropic Responsible Scaling Policy](https://www.anthropic.com/responsible-scaling-policy) · Anthropic. lab self-governance representation _(verification pending)_
- **SRC-OPENAI-PREPAREDNESS** · [OpenAI Preparedness Framework (v2)](https://openai.com/index/updating-our-preparedness-framework/) · OpenAI (2025) _(verification pending)_
- **SRC-DEEPMIND-FSF** · [Google DeepMind Frontier Safety Framework (v3)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) · Google DeepMind _(verification pending)_
- **SRC-UN-GOVERNING-AI** · [Governing AI for Humanity — Final Report](https://www.un.org/sites/un2.un.org/files/governing_ai_for_humanity_final_report_en.pdf) · UN Secretary-General's High-Level Advisory Body on AI (2024) _(verification pending)_
- **SRC-HEIM-TECH-GOVERNANCE** · [Technical AI Governance](https://blog.heim.xyz/technical-ai-governance/) · Lennart Heim. verification/monitoring mechanisms _(verification pending)_
- **SRC-HO-INTL-INSTITUTIONS** · [International Institutions for Advanced AI](https://arxiv.org/abs/2307.04699) · Ho et al. (2023) _(verification pending)_
- **SRC-GOVAI-LIBRARY** · [GovAI research library](https://www.governance.ai) · GovAI _(verification pending)_
- **SRC-WINDFALL-CLAUSE** · The Windfall Clause · O'Keefe et al., GovAI _(verification pending)_
- **SRC-CONDITIONAL-AI-TREATY** · [International Agreements on AI Safety: Review and Recommendations for a Conditional AI Safety Treaty](https://arxiv.org/abs/2503.18956) · Rebecca Scholefield, Samuel Martin, Otto Barten (2025). Strong addition for negotiated-slowdown / treaty / verification endings _(verification pending)_
- **SRC-AI-RISK-MGMT-STANDARDS** · [AI Risk-Management Standards Profile for General-Purpose AI and Foundation Models](https://arxiv.org/abs/2506.23949) · Anthony M. Barrett et al. (2025). Standards-oriented complement to high-level governance pieces; helpful for audits/controls/assurance mechanics _(verification pending)_

## hardware-governance

- **SRC-FLEXHEG** · [Technical Options for Flexible Hardware-Enabled Guarantees (flexHEG)](https://arxiv.org/abs/2506.03409) (2025). hardware-enabled governance mechanic _(verification pending)_

## incidents

- **SRC-AI-INCIDENT-DB** · [AI Incident Database](https://incidentdatabase.ai/) · Responsible AI Collaborative. real-world harm cases _(verification pending)_

## interpretability

- **SRC-MONOSEMANTICITY** · [Towards Monosemanticity: Decomposing Language Models with Dictionary Learning](https://transformer-circuits.pub/2023/monosemantic-features/index.html) · Bricken, Templeton, Batson et al., Anthropic (2023). interpretability mechanic _(verification pending)_
- **SRC-SCALING-MONOSEMANTICITY** · [Scaling Monosemanticity (Claude 3 Sonnet features)](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html) · Templeton et al., Anthropic (2024) _(verification pending)_
- **SRC-GOLDEN-GATE** · [Golden Gate Claude](https://www.anthropic.com/news/golden-gate-claude) · Anthropic (2024) _(verification pending)_

## lab-governance

- **SRC-ANTHROPIC-RSP-2026-GA** · [Anthropic's Responsible Scaling Policy](https://www.anthropic.com/responsible-scaling-policy) · Anthropic (2026). 2026 revisions materially affect how lab self-governance should be represented in-game _(verification pending)_
- **SRC-ANTHROPIC-FSR-ROADMAP** · [Anthropic's Frontier Safety Roadmap](https://www.anthropic.com/responsible-scaling-policy/roadmap) · Anthropic (2026). Turns safety posture into dated milestones across security, safeguards, alignment, and policy; highly gameable _(verification pending)_
- **SRC-OPENAI-PREPAREDNESS-2025-GA** · [Our updated Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) · OpenAI (2025). Clarifies tracked vs. research categories, safeguard reports, and competitive-adjustment logic _(verification pending)_
- **SRC-DEEPMIND-FSF-2026-GA** · [Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) · Google DeepMind (2025). Strong source for harmful-manipulation and misalignment-risk framing, plus tracked capability thresholds _(verification pending)_

## labor

- **SRC-ANTHROPIC-ECON-INDEX-ADOPTION** · [Anthropic Economic Index report: Uneven geographic and enterprise AI adoption](https://arxiv.org/abs/2511.15080) · Ruth Appel et al. (2025). Best recent empirical corrective to instant-economy-wide-transformation narratives; valuable for adoption-friction and uneven-diffusion mechanics _(verification pending)_
- **SRC-GENAI-WORK-EUROPE** · [Generative AI at Work: From Exposure to Adoption across 35 European Countries](https://arxiv.org/abs/2604.18849) · Golo Henseke (2026). Strong EU-specific evidence that exposure does not equal adoption, and firm/worker/country institutions shape actual AI use _(verification pending)_
- **SRC-PAYROLLS-TO-PROMPTS** · [Payrolls to Prompts: Firm-Level Evidence on the Substitution of Labor for AI](https://arxiv.org/abs/2602.00139) · Ryan Stevens (2026). Measures actual spending substitution rather than only occupational exposure; good for labor-market event cards _(verification pending)_
- **SRC-GENAI-LABOR-REORG** · [Generative AI and the Reorganization of Labor Demand](https://arxiv.org/abs/2605.23159) · Fangyan Wang, Zaiyan Wei, Yang Wang (2026). Jobs don't just disappear; firms reallocate and redesign tasks — exactly the nuance worldview presets should expose _(verification pending)_
- **SRC-GENAI-PRODUCTIVITY-META** · [A meta-analysis of the effect of generative AI on productivity and learning in programming](https://arxiv.org/abs/2605.04779) · Sebastian Maier et al. (2026). Evidence-based antidote to both AI-changes-nothing and AI-replaces-programmers-now; useful for education/upskilling mechanics _(verification pending)_

## labor-market

- **SRC-IMF-GENAI** · [Gen-AI: Artificial Intelligence and the Future of Work](https://www.imf.org/-/media/files/publications/sdn/2024/english/sdnea2024001.pdf) · Cazzaniga et al., IMF SDN (2024). job-displacement mechanic; ~40% of global jobs exposed (60% advanced economies, 40% emerging, 26% low-income) _(verification pending)_
- **SRC-IMF-BLOG** · [AI Will Transform the Global Economy](https://www.imf.org/en/blogs/articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity) · Georgieva, IMF (2024) _(verification pending)_
- **SRC-IMF-SKILLGAPS** · [Bridging Skill Gaps for the Future: New Jobs Creation in the AI Age](https://www.imf.org/-/media/files/publications/sdn/2026/english/sdnea2026001.pdf) · IMF SDN (2026). includes entry-level hiring decline evidence _(verification pending)_
- **SRC-ANTHROPIC-ECON-INDEX** · [The Anthropic Economic Index](https://www.anthropic.com/economic-index) · Anthropic (2025). real usage-by-occupation data _(verification pending)_
- **SRC-GPTS-ARE-GPTS** · [GPTs are GPTs](https://arxiv.org/abs/2303.10130) · Eloundou et al. (2023) _(verification pending)_
- **SRC-BRYNJOLFSSON-GENAI-WORK** · Generative AI at Work · Brynjolfsson et al. (2023). productivity mechanic; the 'Brynjolfsson call-center study' referenced in FULL section 6 _(verification pending)_
- **SRC-NOY-ZHANG** · Experimental Evidence on Productivity Effects of GenAI · Noy & Zhang (2023) _(verification pending)_
- **SRC-DELLACQUA-JAGGED** · Navigating the Jagged Technological Frontier · Dell'Acqua et al., HBS (2023) _(verification pending)_
- **SRC-OECD-EMPLOYMENT** · [OECD Employment Outlook (AI chapters)](https://www.oecd.org) · OECD _(verification pending)_

## leaderboard

- **SRC-LMARENA** · [LMArena (Chatbot Arena / "Arena")](https://lmarena.ai/) · UC Berkeley SkyLab → Arena Inc.. live model-ranking leaderboard _(verification pending)_

## live-data

- **SRC-EPOCH-DATA-TRAJECTORY** · [Epoch AI — Data on the Trajectory of AI (models, hardware, benchmarks, chip sales, data centers)](https://epoch.ai/data) · Epoch AI _(verification pending)_

## maim

- **SRC-ZVI-MAIM** · [On MAIM and Superintelligence Strategy](https://thezvi.substack.com/p/on-maim-and-superintelligence-strategy) · Zvi Mowshowitz (2025). analysis _(verification pending)_

## military-ai

- **SRC-MILITARY-AI-REGULATION** · [Military AI Needs Technically-Informed Regulation to Safeguard AI Research and its Applications](https://arxiv.org/abs/2505.18371) · Riley Simmons-Edler et al. (2025). Starter source for a dedicated autonomous-weapons / military-AI category _(verification pending)_

## model-cards

- **SRC-MODEL-DOCS-BUNDLE** · System/model cards (GPT-4, Claude 3/Opus, Gemini); Papers with Code; Alignment Forum / LessWrong key posts. model-release-timeline and documentation layer _(verification pending)_

## model-weights

- **SRC-RAND-WEIGHTS** · [Securing AI Model Weights: Preventing Theft and Misuse of Frontier Models](https://www.rand.org/pubs/research_reports/RRA2849-1.html) · Nevo, Lahav, Karpur et al., RAND (2024). weight-security mechanic; also cited in the US-China section as the model-weight-theft / espionage mechanic (RAND, RR-A2849-1) _(verification pending)_

## policy-tracker

- **SRC-OECD-AI-OBSERVATORY** · [OECD.AI Policy Observatory](https://oecd.ai/en/) · OECD. national AI policy tracker _(verification pending)_

## problem-profile

- **SRC-80K-AI-CATASTROPHE** · [Preventing an AI-related catastrophe (problem profile)](https://80000hours.org/problem-profiles/artificial-intelligence/) · Benjamin Hilton, 80,000 Hours _(verification pending)_
- **SRC-80K-GRADUAL-DISEMPOWERMENT** · [Gradual disempowerment (problem profile)](https://80000hours.org/problem-profiles/gradual-disempowerment/) · 80,000 Hours (2025) _(verification pending)_

## public-opinion

- **SRC-PUBLIC-OPINION-AI-MODERATION** · [What do people expect from Artificial Intelligence? Public opinion on alignment in AI moderation from Germany and the United States](https://arxiv.org/abs/2504.12476) · Andreas Jungherr, Adrian Rauchfleisch (2025). Public-legitimacy, censorship, and whose-values-count mechanics, comparing U.S. and European political cultures _(verification pending)_
- **SRC-PUBLIC-OPINION-DIGITAL-MINDS** · [Public Opinion and The Rise of Digital Minds: Perceived Risk, Trust, and Regulation Support](https://arxiv.org/abs/2504.21849) · Justin B. Bullock et al. (2025). Regulation-support mechanics; ties trust/risk perception to policy appetite _(verification pending)_

## risk

- **SRC-GRADUAL-DISEMPOWERMENT** · [Gradual Disempowerment: Systemic Existential Risks from Incremental AI Development](https://arxiv.org/abs/2501.16946) · Kulveit, Douglas, Ammann, Turan, Krueger, Duvenaud (2025). gradual-disempowerment ending (HANDOVER: grounds the hidden ending) _(verification pending)_
- **SRC-INTELLIGENCE-CURSE** · [The Intelligence Curse](https://intelligence-curse.ai/) · Luke Drago & Rudolf Laine (2025). societal-breakdown ending _(verification pending)_
- **SRC-IAISR** · [International AI Safety Report 2025](https://arxiv.org/abs/2501.17805) · Bengio et al. (2025). consensus risk synthesis; consensus preset anchors _(verification pending)_
- **SRC-IAISR-UPDATE-1** · [International AI Safety Report — First Key Update: Capabilities & Risk Implications](https://arxiv.org/abs/2510.13653) · Bengio et al. (2025) _(verification pending)_
- **SRC-IAISR-UPDATE-2** · [International AI Safety Report — Second Key Update: Technical Safeguards & Risk Management](https://arxiv.org/abs/2511.19863) · Bengio et al. (2025) _(verification pending)_
- **SRC-BOSTROM-SUPERINTELLIGENCE** · Superintelligence: Paths, Dangers, Strategies · Nick Bostrom, Oxford University Press (2014). foundational risk framing _(book, obtain manually)_

## risk-taxonomy

- **SRC-MIT-AI-RISK-REPO** · [MIT AI Risk Repository](https://airisk.mit.edu/) · Slattery, Saeri et al., MIT FutureTech (2024). >1,600 risks; risk-taxonomy layer _(verification pending)_

## safety

- **SRC-CONCRETE-PROBLEMS** · [Concrete Problems in AI Safety](https://arxiv.org/abs/1606.06565) · Amodei, Olah, Steinhardt, Christiano, Schulman, Mané (2016). taxonomy of failure modes _(verification pending)_
- **SRC-AI-CONTROL** · [AI Control: Improving Safety Despite Intentional Subversion](https://arxiv.org/abs/2312.06942) · Greenblatt, Shlegeris, Sachan, Roger, Redwood Research (2023). control-agenda mechanic _(verification pending)_

## scaling

- **SRC-KAPLAN-SCALING** · [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) · Kaplan, McCandlish, Henighan, Brown, Amodei et al., OpenAI (2020). power-law scaling; foundation of compute mechanic _(verification pending)_
- **SRC-CHINCHILLA** · [Training Compute-Optimal Large Language Models (Chinchilla)](https://arxiv.org/abs/2203.15556) · Hoffmann et al., DeepMind (2022). compute/params/data tradeoff (20 tokens/param heuristic) _(verification pending)_
- **SRC-CHINCHILLA-REPLICATION** · [Chinchilla Scaling: A replication attempt](https://arxiv.org/abs/2404.10102) · Besiroglu, Erdil, Barnett, You, Epoch AI (2024). models scaling-law uncertainty _(verification pending)_

## scenario

- **SRC-AI2027** · [AI 2027](https://ai-2027.com/) · Kokotajlo, Alexander, Larsen, Lifland, Dean, AI Futures Project (2025). race vs. slowdown endings; core scenario spine; cautious preset anchors _(verification pending)_

## serious-games

- **SRC-AI-FUTURES-ROLEPLAY** · [Exploring AI Futures Through Role Play (Intelligence Rising)](https://arxiv.org/abs/1912.08964) · Avin, Gruetzemacher, Fox (2020). closest direct precedent to Race Conditions _(verification pending)_
- **SRC-SIM-GAMING-INSIGHTS** · [Strategic Insights from Simulation Gaming of AI Race Dynamics](https://arxiv.org/pdf/2410.03092) · Gruetzemacher et al. (2024). facilitator insights from 43 Intelligence Rising games _(verification pending)_
- **SRC-INTELLIGENCE-RISING-CSER** · [Intelligence Rising (project page + facilitation)](https://www.cser.ac.uk/work/intelligence-rising/) · CSER (Cambridge) _(verification pending)_
- **SRC-AVIN-AI-FUTURES-SURVEY** · [Exploring Artificial Intelligence Futures (survey of methods)](https://books.openbookpublishers.com/10.11647/obp.0360/ch8.xhtml) · Shahar Avin (2019). narrative to roleplay to participatory methods _(verification pending)_
- **SRC-SERIOUS-GAMES-BUNDLE** · RAND wargaming series; Schelling on gaming; Wouters et al. and Clark et al. serious-games meta-analyses; Bogost Persuasive Games; matrix-games & TTX methodology; climate-game studies (e.g. Daybreak). debrief, learning-outcome, and persuasive-game grounding _(verification pending)_
- **SRC-WOUTERS-2013** · Meta-analysis of serious-games learning outcomes · Wouters et al. (2013). debrief / learning-outcome grounding _(verification pending)_
- **SRC-CLARK-2016** · Digital Games for Learning meta-analysis · Clark et al. (2016). debrief / learning-outcome grounding _(verification pending)_
- **SRC-BOGOST-PERSUASIVE-GAMES** · Persuasive Games · Bogost (2007). persuasive-game grounding for mechanics-carry-the-message design _(book, obtain manually)_
- **SRC-LOPEZ-FERNANDEZ-2024** · [Learning and Motivational Impact of Game-Based Learning: Comparing Face-to-Face and Online Formats on Computer Science Education](https://arxiv.org/abs/2407.07762) · Daniel López-Fernández et al. (2024). Useful for delivery-format decisions; shows game-based learning can remain effective outside the classroom _(verification pending)_
- **SRC-RIBEIRO-EVACUATION-GAMES** · [Using Serious Games to Train Evacuation Behaviour](https://arxiv.org/abs/1303.3828) · João Ribeiro et al. (2013). Not AI-specific, but a serious-games precedent showing behavior-training value in high-stakes scenarios _(verification pending)_

## summit-diplomacy

- **SRC-BLETCHLEY** · [The Bletchley Declaration](https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration/the-bletchley-declaration-by-countries-attending-the-ai-safety-summit-1-2-november-2023) · AI Safety Summit (28 countries + EU) (2023) _(verification pending)_
- **SRC-PARIS-STATEMENT** · [Statement on Inclusive and Sustainable AI](https://www.elysee.fr/en/emmanuel-macron/2025/02/11/statement-on-inclusive-and-sustainable-artificial-intelligence-for-people-and-the-planet) · France/co-chairs, Paris AI Action Summit (2025). US and UK declined to sign, dramatizes fracturing coordination _(verification pending)_

## takeoff

- **SRC-DAVIDSON-TAKEOFF** · [Compute-centric takeoff model](https://takeoffspeeds.com) · Davidson, Open Philanthropy (2023). takeoff-speed modeling _(verification pending)_

## treaty-slowdown

- **SRC-PAUSE-LETTER** · [Pause Giant AI Experiments: An Open Letter](https://futureoflife.org/open-letter/pause-giant-ai-experiments/) · Future of Life Institute (2023). treaty/slowdown mechanic _(verification pending)_

## ubi

- **SRC-OPENRESEARCH-UBI** · [OpenResearch Unconditional Income Study](https://www.openresearchlab.org) (2024). UBI/redistribution mechanic _(verification pending)_

## us-china

- **SRC-MAIM** · [Superintelligence Strategy: Expert Version (MAIM)](https://arxiv.org/abs/2503.05628) · Hendrycks, Schmidt, Wang (2025). deterrence/sabotage/nonproliferation mechanic _(verification pending)_
- **SRC-RAND-STABILITY** · [Seeking Stability in the Competition for AI Advantage](https://www.rand.org/pubs/commentary/2025/03/seeking-stability-in-the-competition-for-ai-advantage.html) · RAND (2025). critique of MAIM _(verification pending)_

## us-policy

- **SRC-NSCAI** · [NSCAI Final Report](https://www.nscai.gov/2021-final-report/) · National Security Commission on AI (2021) _(verification pending)_
- **SRC-AI-ACTION-PLAN** · [Winning the Race: America's AI Action Plan](https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf) · White House (OSTP) (2025) _(verification pending)_

## wargaming

- **SRC-RAND-WARGAMING** · [RAND wargaming methodology series](https://www.rand.org) · RAND. matrix-game / TTX methodology grounding _(verification pending)_

## whistleblower

- **SRC-RIGHT-TO-WARN** · [A Right to Warn about Advanced Artificial Intelligence (open letter)](https://righttowarn.ai) · current and former OpenAI and Google DeepMind employees (2024). whistleblower event card _(verification pending)_

## worldview-optimistic

- **SRC-LOVING-GRACE** · [Machines of Loving Grace](https://www.darioamodei.com/essay/machines-of-loving-grace) · Dario Amodei (2024). flourishing ending / optimistic preset _(verification pending)_
- **SRC-PLANNING-AGI** · [Planning for AGI and beyond](https://openai.com/index/planning-for-agi-and-beyond/) · Altman, OpenAI (2023) _(verification pending)_

## worldview-skeptic

- **SRC-NORMAL-TECH** · [AI as Normal Technology](https://knightcolumbia.org/content/ai-as-normal-technology) · Narayanan & Kapoor, Princeton/Knight Institute (2025). skeptical worldview preset _(verification pending)_
- **SRC-NORMAL-TECH-GUIDE** · [A guide to understanding AI as normal technology](https://www.normaltech.ai/p/a-guide-to-understanding-ai-as-normal) · Narayanan & Kapoor (2025) _(verification pending)_
- **SRC-SNAKE-OIL** · AI Snake Oil · Narayanan & Kapoor, Princeton University Press (2024). skeptical worldview _(book, obtain manually)_

## x-risk

- **SRC-CAIS-STATEMENT** · [Statement on AI Risk](https://safe.ai/work/statement-on-ai-risk) · Center for AI Safety (CAIS) (2023). one-sentence extinction-risk consensus _(verification pending)_
- **SRC-CARLSMITH** · [Is Power-Seeking AI an Existential Risk?](https://arxiv.org/abs/2206.13353) · Joseph Carlsmith (2022). decomposed risk model _(verification pending)_
- **SRC-PRECIPICE** · [The Precipice: Existential Risk and the Future of Humanity](https://theprecipice.com/) · Toby Ord (2020) _(book, obtain manually)_
- **SRC-IABIED** · [If Anyone Builds It, Everyone Dies](https://ifanyonebuildsit.com/) · Yudkowsky & Soares (2025). misaligned-catastrophe worldview _(book, obtain manually)_
- **SRC-COMPENDIUM** · [The Compendium](https://www.thecompendium.ai/) · Leahy, Alfour et al. (2024). risk-emphasizing synthesis _(verification pending)_
