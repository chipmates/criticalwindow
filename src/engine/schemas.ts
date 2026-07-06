/**
 * zod schemas for every data file type. These are the single source of truth:
 * the TS types are z.infer, the JSON Schemas for editor autocomplete are
 * generated from them (scripts/generate-schemas.ts), and `pnpm validate`
 * parses every data file against them.
 *
 * THE IRON RULE IS A TYPE HERE: numeric game values do not exist bare in
 * data files; they are wrapped as { value, sourceIds } (or carry sourceIds
 * at the enclosing object). 'TODO-SOURCE' is tolerated only while the draft
 * whitelist is on (Blocks C1..C2) and is rejected by --strict-sources.
 */
import { z } from 'zod';
import {
  EFFECT_TARGETS,
  ERA_IDS,
  EXPOSURE_KEYS,
  GAME_MODES,
  PLAYABLE_SEAT_IDS,
  RESOURCE_KEYS,
  RIVAL_POSTURES,
  SOCIETY_KEYS,
  WORLDVIEW_PRESET_IDS,
} from './types';

// ---------------------------------------------------------------------------
// Shared fragments
// ---------------------------------------------------------------------------

const CARD_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const TAG_PATTERN = /^[a-z][a-z0-9-]*$/;
const SOURCE_ID_PATTERN = /^SRC-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const STRINGS_REF_PATTERN = /^strings:[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+$/;
const STRING_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+$/;

export const sourceIdSchema = z
  .string()
  .regex(SOURCE_ID_PATTERN, 'source ids look like SRC-EPOCH-COMPUTE');

/** TODO-SOURCE marks a draft value awaiting a citation (rejected once strict). */
export const sourceIdOrTodoSchema = z.union([sourceIdSchema, z.literal('TODO-SOURCE')]);

export const sourceIdsSchema = z
  .array(sourceIdOrTodoSchema)
  .min(1, 'iron rule: at least one source id (TODO-SOURCE only while drafting)');

/** Claim-level citations (iron-rule extension, v0.2): ids of the form SRC-ID#n. */
const CLAIM_ID_PATTERN = /^SRC-[A-Z0-9]+(?:-[A-Z0-9]+)*#\d+$/;
export const claimIdsSchema = z.array(z.string().regex(CLAIM_ID_PATTERN)).min(1).optional();

export const stringsRefSchema = z
  .string()
  .regex(STRINGS_REF_PATTERN, 'string references look like strings:event.foo.title');

const scaledInt = z.number().int().min(0).max(1000);
const deltaInt = z.number().int().min(-1000).max(1000);
const turnInt = z.number().int().min(1).max(64);
const shareInt = z.number().int().min(0).max(100);

/** A sourced scalar: the iron rule as a shape. */
export const sourcedIntSchema = z.strictObject({
  value: z.number().int().min(-1000).max(1000),
  sourceIds: sourceIdsSchema,
  note: z.string().optional(),
});

/** A sourced [min, max] range on the 0..1000 scale (hidden dice roll inside). */
export const sourcedRangeSchema = z
  .strictObject({
    min: scaledInt,
    max: scaledInt,
    sourceIds: sourceIdsSchema,
    note: z.string().optional(),
  })
  .refine((range) => range.min <= range.max, { message: 'range min must be <= max' });

/**
 * Piecewise-linear curve table: the only curve representation the engine
 * accepts (exact interpolation; no transcendental functions; sourceable).
 */
export const curveTableSchema = z
  .strictObject({
    x: z.array(z.number().int().min(-100000).max(100000)).min(2),
    y: z.array(z.number().int().min(-100000).max(100000)).min(2),
    sourceIds: sourceIdsSchema,
    note: z.string().optional(),
  })
  .refine((curve) => curve.x.length === curve.y.length, {
    message: 'curve x and y need the same length',
  })
  .refine((curve) => curve.x.every((xi, i) => i === 0 || xi > curve.x[i - 1]!), {
    message: 'curve x knots must be strictly increasing',
  });

function optionalKeys<K extends string, S extends z.ZodType>(
  keys: readonly K[],
  schema: S,
): Record<K, z.ZodOptional<S>> {
  return Object.fromEntries(keys.map((key) => [key, schema.optional()])) as Record<
    K,
    z.ZodOptional<S>
  >;
}

function requiredKeys<K extends string, S extends z.ZodType>(
  keys: readonly K[],
  schema: S,
): Record<K, S> {
  return Object.fromEntries(keys.map((key) => [key, schema])) as Record<K, S>;
}

// ---------------------------------------------------------------------------
// Effects (shared by events and policies)
// ---------------------------------------------------------------------------

const flagName = z.string().regex(/^[a-z][a-zA-Z0-9]*$/);

export const effectSetSchema = z.strictObject({
  ...optionalKeys(EFFECT_TARGETS, deltaInt),
  flags: z.array(flagName).min(1).optional(),
  clearFlags: z.array(flagName).min(1).optional(),
});

export const delayedEffectSpecSchema = z.strictObject({
  inTurns: z.number().int().min(1).max(16),
  effects: effectSetSchema,
});

const conditionsSchema = z.strictObject({
  rivalPosture: z.enum(RIVAL_POSTURES).optional(),
  flagsAll: z.array(flagName).min(1).optional(),
  flagsNone: z.array(flagName).min(1).optional(),
  resourceMin: z.strictObject(optionalKeys(RESOURCE_KEYS, scaledInt)).optional(),
  resourceMax: z.strictObject(optionalKeys(RESOURCE_KEYS, scaledInt)).optional(),
  societyMin: z.strictObject(optionalKeys(SOCIETY_KEYS, scaledInt)).optional(),
  societyMax: z.strictObject(optionalKeys(SOCIETY_KEYS, scaledInt)).optional(),
});

// ---------------------------------------------------------------------------
// Event cards
// ---------------------------------------------------------------------------

export const eventChoiceSchema = z.strictObject({
  label: stringsRefSchema,
  effects: effectSetSchema.optional(),
  delayedEffects: z.array(delayedEffectSpecSchema).min(1).optional(),
});

const eventBaseFields = {
  $schema: z.string().optional(),
  id: z.string().regex(CARD_ID_PATTERN),
  title: stringsRefSchema,
  body: stringsRefSchema,
  sourceIds: sourceIdsSchema,
  claimIds: claimIdsSchema,
  tags: z.array(z.string().regex(TAG_PATTERN)).min(1),
};

/** CHOICE: the classic dilemma memo, drawn from the weighted pool. */
const choiceEventSchema = z.strictObject({
  ...eventBaseFields,
  kind: z.literal('choice'),
  /** Optional seat filter: this memo only lands on the named desks. */
  seats: z.array(z.enum(PLAYABLE_SEAT_IDS)).min(1).optional(),
  trigger: z.strictObject({
    era: z.enum(ERA_IDS).optional(),
    turnMin: turnInt.optional(),
    turnMax: turnInt.optional(),
    weight: z.number().int().min(1).max(10),
    conditions: conditionsSchema.optional(),
  }),
  choices: z.array(eventChoiceSchema).min(1).max(4),
  repeatable: z.boolean().optional(),
});

/**
 * R1 NEUTRALITY GUARD: a future beat's condition reads run STATE (capability
 * crossings, hidden dice, flags), never calendar dates. Real-past beats are
 * date-scheduled and unconditional.
 */
const beatConditionSchema = z.strictObject({
  era: z.enum(ERA_IDS).optional(),
  minCapability: scaledInt.optional(),
  flagsAll: z.array(flagName).min(1).optional(),
  flagsNone: z.array(flagName).min(1).optional(),
  /** Per-turn fire probability = the named hidden die's value, in per-mille. */
  diceScaledFireProb: z.literal('takeoffSteepness').optional(),
});

/** FIXED: a scheduled beat (TS-style). Historical = real past, every run shares it. */
const fixedEventSchema = z.strictObject({
  ...eventBaseFields,
  kind: z.literal('fixed'),
  fixedTurn: z.strictObject({ min: turnInt, max: turnInt }),
  historical: z.boolean(),
  condition: beatConditionSchema.optional(),
  choices: z.array(eventChoiceSchema).min(1).max(4),
});

const scaledEffectSchema = z.strictObject({
  target: z.enum(EFFECT_TARGETS),
  /** delta = base + mulDiv(coef, exposureValue, 1000); halved under halveIfFlag. */
  base: deltaInt,
  coef: deltaInt,
  exposure: z.enum(EXPOSURE_KEYS),
  halveIfFlag: flagName.optional(),
});

/** WILDCARD: no choice, the world hits you; damage is exposure-scaled. */
const wildcardEventSchema = z.strictObject({
  ...eventBaseFields,
  kind: z.literal('wildcard'),
  fire: z.strictObject({
    probPerMille: z.number().int().min(1).max(1000),
    probModifiers: z
      .array(
        z.strictObject({
          flag: flagName,
          deltaPerMille: z.number().int().min(-1000).max(1000),
        }),
      )
      .min(1)
      .optional(),
    eligible: z
      .strictObject({
        turnMin: turnInt.optional(),
        minCapability: scaledInt.optional(),
        computeOverEnergyMin: scaledInt.optional(),
        flagsAll: z.array(flagName).min(1).optional(),
        flagsNone: z.array(flagName).min(1).optional(),
      })
      .optional(),
    cooldownTurns: z.number().int().min(1).max(16),
  }),
  effects: effectSetSchema.optional(),
  scaledEffects: z.array(scaledEffectSchema).min(1).optional(),
  delayedEffects: z.array(delayedEffectSpecSchema).min(1).optional(),
});

export const eventCardSchema = z
  .discriminatedUnion('kind', [choiceEventSchema, fixedEventSchema, wildcardEventSchema])
  .superRefine((card, ctx) => {
    if (card.kind === 'choice') {
      const t = card.trigger;
      if (t.turnMin !== undefined && t.turnMax !== undefined && t.turnMin > t.turnMax) {
        ctx.addIssue({ code: 'custom', message: 'turnMin must be <= turnMax' });
      }
      const bites = card.choices.some(
        (choice) =>
          (choice.delayedEffects?.length ?? 0) > 0 ||
          (choice.effects?.flags?.length ?? 0) > 0 ||
          Object.values(choice.effects ?? {}).some(
            (value) => typeof value === 'number' && value < 0,
          ),
      );
      if (!bites) {
        ctx.addIssue({
          code: 'custom',
          message:
            'every strong card bites: at least one choice needs a delayed effect, a flag, or a cost',
        });
      }
    }
    if (card.kind === 'fixed') {
      if (card.fixedTurn.min > card.fixedTurn.max) {
        ctx.addIssue({ code: 'custom', message: 'fixedTurn min must be <= max' });
      }
      if (card.historical && card.condition !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'real-past beats are unconditional (R1 guard): drop the condition',
        });
      }
      if (!card.historical && card.condition === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'future fixed beats require a condition (R1 guard)',
        });
      }
    }
    if (card.kind === 'wildcard') {
      if (!card.effects && !card.scaledEffects) {
        ctx.addIssue({
          code: 'custom',
          message: 'a wildcard needs effects or scaledEffects (it must actually hit)',
        });
      }
      // Systemic wildcards apply to EVERY eligible seat, so a rival.* flat
      // effect would double-hit both seats symmetrically. Theft-type cards
      // (single victim) declare their rival.* transfer in scaledEffects.
      const theft = (card.scaledEffects ?? []).some((s) => s.target.startsWith('rival.'));
      if (!theft) {
        for (const key of Object.keys(card.effects ?? {})) {
          if (key.startsWith('rival.')) {
            ctx.addIssue({
              code: 'custom',
              message: `systemic wildcard '${card.id}' must self-target; '${key}' would hit both seats symmetrically`,
            });
          }
        }
      }
    }
  });

// ---------------------------------------------------------------------------
// Policy cards
// ---------------------------------------------------------------------------

/**
 * A CHOSEN GAMBLE (the structural Twilight-Struggle coup): the card's outcome
 * is stochastic and the card copy says so. This is the sanctioned exception to
 * "decisions execute deterministically" — reserved for cards whose real-world
 * referent is genuinely contested (MAIM sabotage: deterrence vs spiral).
 */
const gambleSchema = z.strictObject({
  stream: z.literal('wildcards'),
  baseSpiralPerMille: z.number().int().min(0).max(1000),
  postureModifiers: z
    .strictObject({
      cautious: z.number().int().min(-1000).max(1000).optional(),
      mirror: z.number().int().min(-1000).max(1000).optional(),
      race: z.number().int().min(-1000).max(1000).optional(),
    })
    .optional(),
  flagModifiers: z
    .array(z.strictObject({ flag: flagName, deltaPerMille: z.number().int().min(-1000).max(1000) }))
    .min(1)
    .optional(),
  deter: effectSetSchema,
  spiral: effectSetSchema,
  spiralSetsPosture: z.enum(RIVAL_POSTURES).optional(),
});

export const policyCardSchema = z.strictObject({
  $schema: z.string().optional(),
  id: z.string().regex(CARD_ID_PATTERN),
  title: stringsRefSchema,
  body: stringsRefSchema,
  cost: z
    .strictObject({
      politicalCapital: scaledInt.optional(),
      capital: scaledInt.optional(),
    })
    .optional(),
  gates: z
    .strictObject({
      publicTrustMin: scaledInt.optional(),
      politicalCapitalMin: scaledInt.optional(),
      capabilityMin: scaledInt.optional(),
      flagsAll: z.array(flagName).min(1).optional(),
      flagsNone: z.array(flagName).min(1).optional(),
      eraMin: z.enum(ERA_IDS).optional(),
    })
    .optional(),
  effects: effectSetSchema.optional(),
  delayedEffects: z.array(delayedEffectSpecSchema).min(1).optional(),
  gamble: gambleSchema.optional(),
  cooldown: z.number().int().min(1).max(16).optional(),
  oncePerRun: z.boolean().optional(),
  sourceIds: sourceIdsSchema,
  claimIds: claimIdsSchema,
  tags: z.array(z.string().regex(TAG_PATTERN)).min(1),
});

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

export const worldviewPresetSchema = z.strictObject({
  label: stringsRefSchema,
  description: stringsRefSchema,
  alignmentDifficulty: sourcedRangeSchema,
  takeoffSteepness: sourcedRangeSchema,
  /**
   * Displacement drifts toward its exposure curve by gap/divisor per turn.
   * The EXPOSURE curve is shared (measured agreement); how fast exposure
   * becomes lived reality is the worldview dial (contradiction row 5).
   */
  displacementLagDivisor: sourcedIntSchema,
});

export const parametersSchema = z.strictObject({
  $schema: z.string().optional(),
  worldviewPresets: z.strictObject(requiredKeys(WORLDVIEW_PRESET_IDS, worldviewPresetSchema)),
  evalUncertainty: z.strictObject({
    baseBandWidth: sourcedIntSchema,
    safetyInsightNarrowing: sourcedIntSchema,
    floorBandWidth: sourcedIntSchema,
    deceptionMaxLift: sourcedIntSchema,
    deceptionInsightCounter: sourcedIntSchema,
  }),
  alignmentModel: z.strictObject({
    startBase: sourcedIntSchema,
    crashThresholdShare: sourcedIntSchema,
    crashPenalty: sourcedIntSchema,
    safetyDriftDivisor: sourcedIntSchema,
    fogZoneAlignmentErosion: sourcedIntSchema,
  }),
  thresholds: z.strictObject({
    fogZoneStart: sourcedIntSchema,
    capabilityThreshold: sourcedIntSchema,
    breakdownUnrest: sourcedIntSchema,
    treatyTrustMin: sourcedIntSchema,
    treatySignPoliticalCapitalMin: sourcedIntSchema,
    treatySignTurnMin: sourcedIntSchema,
    gridSlackBeforeCap: sourcedIntSchema,
  }),
  worldRules: z.strictObject({
    /**
     * Rival posture drives TRUST drift only; rival capability rides the same
     * capabilityPerRnd curve as the player since the two-seat refactor. The
     * old per-posture capability fields were removed 2026-07-06 as dead data.
     */
    rivalMoves: z.strictObject({
      race: z.strictObject({ trust: sourcedIntSchema }),
      mirror: z.strictObject({ diplomacyTrust: sourcedIntSchema }),
      cautious: z.strictObject({ trust: sourcedIntSchema }),
    }),
    postureChecks: z.strictObject({
      cautiousTrustMin: sourcedIntSchema,
      raceGapMin: sourcedIntSchema,
      raceTrustMax: sourcedIntSchema,
    }),
    /**
     * Displacement and trust erosion run through the displacementFromCapability
     * and trustFromUnrest curves; the flat-rate fields that predated the curves
     * were removed 2026-07-06 as dead data.
     */
    society: z.strictObject({
      diffusionReliefPer: sourcedIntSchema,
      unrestFromDisplacementGap: sourcedIntSchema,
      unrestSurgeDisplacement: sourcedIntSchema,
    }),
    election: z.strictObject({
      trustMin: sourcedIntSchema,
      unrestMax: sourcedIntSchema,
      mandateSwing: sourcedIntSchema,
    }),
    upkeep: z.strictObject({
      capitalIncomePerDiffusion: sourcedIntSchema,
    }),
    societyDepth: z.strictObject({
      trustCurveDivisor: sourcedIntSchema,
      unrestEconomicDragMin: sourcedIntSchema,
      unrestEconomicDrag: sourcedIntSchema,
    }),
    agencyErosion: z.strictObject({
      highCapabilityMin: sourcedIntSchema,
      perTurn: sourcedIntSchema,
      diffusionShieldMin: sourcedIntSchema,
    }),
  }),
  /**
   * The projected milestone ladder (SC -> SAR -> SIAR), R1-tagged: crossing a
   * rung grants a passive per-turn capability bonus scaled by the hidden
   * takeoffSteepness die. Reachability is emergent from play + preset dice,
   * never from calendar dates.
   */
  capabilityLadder: z.strictObject({
    milestones: z
      .array(
        z.strictObject({
          id: z.string().regex(CARD_ID_PATTERN),
          at: sourcedIntSchema,
          selfAccel: sourcedIntSchema,
        }),
      )
      .min(1)
      .refine((ms) => ms.every((m, i) => i === 0 || m.at.value > ms[i - 1]!.at.value), {
        message: 'milestones must be in strictly increasing track order',
      }),
  }),
  turnStructure: z.strictObject({
    maxTurns: sourcedIntSchema,
    electionTurn: sourcedIntSchema,
    handSize: sourcedIntSchema,
    eras: z
      .array(z.strictObject({ id: z.enum(ERA_IDS), fromTurn: turnInt }))
      .min(1)
      .refine((eras) => eras.every((era, i) => i === 0 || era.fromTurn > eras[i - 1]!.fromTurn), {
        message: 'era fromTurn must be strictly increasing',
      })
      .refine((eras) => eras[0]?.fromTurn === 1, { message: 'first era must start at turn 1' }),
  }),
  curves: z.record(z.string().regex(/^[a-z][a-zA-Z0-9]*$/), curveTableSchema),
});

// ---------------------------------------------------------------------------
// Scenario (start state; annual refresh target)
// ---------------------------------------------------------------------------

const seatStartSchema = z.strictObject({
  resources: z.strictObject(requiredKeys(RESOURCE_KEYS, sourcedIntSchema)),
  society: z.strictObject({
    jobDisplacement: sourcedIntSchema,
    unrest: sourcedIntSchema,
  }),
  substitution: sourcedIntSchema,
  allocation: z
    .strictObject({
      capability: shareInt,
      safety: shareInt,
      diffusion: shareInt,
      sourceIds: sourceIdsSchema,
      note: z.string().optional(),
    })
    .refine((a) => a.capability + a.safety + a.diffusion === 100, {
      message: 'allocation shares must sum to 100',
    }),
  hand: z.array(z.string().regex(CARD_ID_PATTERN)).optional(),
});

export const scenarioSchema = z.strictObject({
  $schema: z.string().optional(),
  id: z.string().regex(CARD_ID_PATTERN),
  label: stringsRefSchema,
  startTime: z.strictObject({
    year: z.number().int().min(2020).max(2100),
    quarter: z.number().int().min(1).max(4),
  }),
  world: z.strictObject({
    bilateralTrust: sourcedIntSchema,
  }),
  seats: z.strictObject({
    usa: seatStartSchema,
    china: seatStartSchema,
  }),
});

// ---------------------------------------------------------------------------
// Incidents (data/incidents.json) — the misalignment-incident system.
// The hidden dice LEAKING: risk ∝ capability x misalignment x pressure, one
// seeded check per turn on the 'incidents' stream. Safety Insight reduces
// DAMAGE (detection/containment), never true alignment.
// ---------------------------------------------------------------------------

export const incidentRungSchema = z.strictObject({
  id: z.string().regex(CARD_ID_PATTERN),
  ladder: z.number().int().min(0).max(3),
  title: stringsRefSchema,
  body: stringsRefSchema,
  threshold: scaledInt,
  baseDamage: effectSetSchema,
  forcedPause: z.boolean(),
  cooldownTurns: z.number().int().min(1).max(16),
  /** Rung 3 only: firing while true alignment sits below this ends the run. */
  catastropheBelowTrueAlignment: scaledInt.optional(),
  sourceIds: sourceIdsSchema,
  claimIds: claimIdsSchema,
});

export const incidentsSchema = z
  .strictObject({
    $schema: z.string().optional(),
    riskFormula: z.strictObject({
      pressureAllocationPct: sourcedIntSchema,
      pressureRivalRacePct: sourcedIntSchema,
    }),
    safetyInsightDamageReductionMaxPerMille: sourcedIntSchema,
    rungs: z.array(incidentRungSchema).min(1),
    sourceIds: sourceIdsSchema,
  })
  .refine(
    (data) =>
      data.rungs.every((r, i) => i === 0 || r.threshold > data.rungs[i - 1]!.threshold) &&
      data.rungs.every((r, i) => i === 0 || r.ladder > data.rungs[i - 1]!.ladder),
    { message: 'incident rungs must be ordered by rising ladder and threshold' },
  );

// ---------------------------------------------------------------------------
// Mandates (data/mandates.json) — near-term cabinet objectives. Goals read
// only VISIBLE state (never hidden dice). A lapsed safety mandate is the
// attention-decay dynamic made mechanical.
// ---------------------------------------------------------------------------

export const mandateSchema = z.strictObject({
  id: z.string().regex(CARD_ID_PATTERN),
  title: stringsRefSchema,
  body: stringsRefSchema,
  era: z.enum(ERA_IDS),
  goal: z
    .strictObject({
      target: z.enum(EFFECT_TARGETS),
      comparator: z.enum(['<=', '>=']),
      value: scaledInt,
      /** Deadline = era start turn + offset. '>=' goals resolve as soon as
       *  reached; '<=' goals must HOLD at the deadline check. */
      byTurnOffset: z.number().int().min(1).max(15),
    })
    .refine((goal) => !goal.target.startsWith('hidden.'), {
      message: 'mandate goals read only visible state (no-peeking guard)',
    }),
  rewardPoliticalCapital: z.number().int().min(0).max(1000),
  penaltyOnLapse: effectSetSchema.optional(),
  /** Which seats can draw this mandate. Absent = both. */
  seats: z.array(z.enum(PLAYABLE_SEAT_IDS)).min(1).optional(),
  sourceIds: sourceIdsSchema,
  claimIds: claimIdsSchema,
});

export const mandatesSchema = z
  .strictObject({
    $schema: z.string().optional(),
    perEraDraw: z.number().int().min(1).max(2),
    mandates: z.array(mandateSchema).min(1),
    sourceIds: sourceIdsSchema,
  })
  .refine((data) => new Set(data.mandates.map((m) => m.id)).size === data.mandates.length, {
    message: 'mandate ids must be unique',
  });

// ---------------------------------------------------------------------------
// Prologue (data/prologue.json) — the 2023->2026 scripted tutorial. Display
// data only: the engine never reads this file; the UI replays real history
// and lands exactly on the scenario start state (validate cross-checks).
// ---------------------------------------------------------------------------

const prologueTrackMotionSchema = z
  .strictObject({
    target: z.enum(EFFECT_TARGETS),
    from: scaledInt,
    to: scaledInt,
  })
  .refine((motion) => !motion.target.startsWith('hidden.'), {
    message: 'the prologue shows only visible tracks',
  });

const prologueChapterSchema = z.strictObject({
  id: z.string().regex(CARD_ID_PATTERN),
  dateLabel: stringsRefSchema,
  title: stringsRefSchema,
  body: stringsRefSchema,
  teach: z.enum(['allocate', 'policy', 'memo']),
  explainer: stringsRefSchema,
  trackMotion: z.array(prologueTrackMotionSchema).min(1),
  /** memo chapters: mock choices; any pick advances (no failure possible). */
  mockChoices: z
    .array(z.strictObject({ label: stringsRefSchema, response: stringsRefSchema }))
    .min(2)
    .max(3)
    .optional(),
  /** policy chapters: which REAL policy card to show being enacted. */
  mockPolicyId: z.string().regex(CARD_ID_PATTERN).optional(),
  sourceIds: sourceIdsSchema,
});

/**
 * Anchor labels (data/anchors.json): descriptive UI translations of the
 * 0-1000 indices back to sourced real-world equivalents. Never engine-read.
 */
export const anchorsSchema = z.strictObject({
  comment: z.string().optional(),
  tracks: z.record(
    z.string(),
    z.strictObject({
      sourceIds: z.array(z.string()).min(1),
      /** How the rungs and unit mapping were derived from the cited sources. */
      note: z.string().optional(),
      anchors: z
        .array(z.strictObject({ at: z.number().int().min(0).max(1000), label: stringsRefSchema }))
        .min(2),
      unit: z
        .strictObject({
          template: stringsRefSchema,
          points: z.array(z.tuple([z.number(), z.number()])).min(2),
          scale: z.enum(['linear', 'log']),
          decimals: z.number().int().min(0).max(2),
        })
        .optional(),
    }),
  ),
});
export type AnchorsData = z.infer<typeof anchorsSchema>;

export const prologueSchema = z
  .strictObject({
    $schema: z.string().optional(),
    intro: stringsRefSchema,
    outro: stringsRefSchema,
    chapters: z.array(prologueChapterSchema).min(1).max(5),
  })
  .superRefine((data, ctx) => {
    for (const chapter of data.chapters) {
      if (chapter.teach === 'memo' && !chapter.mockChoices) {
        ctx.addIssue({ code: 'custom', message: `memo chapter '${chapter.id}' needs mockChoices` });
      }
      if (chapter.teach === 'policy' && !chapter.mockPolicyId) {
        ctx.addIssue({
          code: 'custom',
          message: `policy chapter '${chapter.id}' needs mockPolicyId`,
        });
      }
    }
  });

// ---------------------------------------------------------------------------
// Seat rules (data/seats.json) — the asymmetry lives in DATA (S7).
// Symmetric uncertainty: same decks, same dice ranges; the seats differ in
// institutions (elections vs legitimacy), chokepoint exposure and card access.
// ---------------------------------------------------------------------------

export const seatRulesSchema = z.strictObject({
  id: z.enum(PLAYABLE_SEAT_IDS),
  labelKey: stringsRefSchema,
  /** Track relabeling (e.g. China's publicTrust reads as Legitimacy). */
  trackLabelOverrides: z.record(z.string(), stringsRefSchema).optional(),
  /** Turn-8 midterms (USA institutional rhythm). */
  elections: z.boolean(),
  /**
   * Era-cadence legitimacy verdicts instead of one midterm (China).
   * Checked at each era start after the first.
   */
  legitimacyCheck: z
    .strictObject({
      trustMin: sourcedIntSchema,
      swing: sourcedIntSchema,
    })
    .optional(),
  /** Compute GAINS scale by substitution/1000 while the export crackdown holds. */
  computeGatedBySubstitution: z.boolean(),
  /** Policy ids this seat cannot play. */
  policyUnavailable: z.array(z.string().regex(CARD_ID_PATTERN)).optional(),
  /** Per-policy cost deltas (state coordination makes some moves cheaper). */
  costModifiers: z
    .record(
      z.string().regex(CARD_ID_PATTERN),
      z.strictObject({
        politicalCapital: z.number().int().min(-1000).max(1000).optional(),
        capital: z.number().int().min(-1000).max(1000).optional(),
      }),
    )
    .optional(),
  sourceIds: sourceIdsSchema,
  claimIds: claimIdsSchema,
  /** How the seat's rule magnitudes relate to the cited sources. */
  note: z.string().optional(),
});

export const seatsSchema = z.strictObject({
  $schema: z.string().optional(),
  usa: seatRulesSchema,
  china: seatRulesSchema,
  sourceIds: sourceIdsSchema,
  /** How the shared seat rules relate to the cited sources. */
  note: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Sources registry
// ---------------------------------------------------------------------------

/**
 * Registry tiers. load-bearing = cited by at least one sourceIds array in
 * data/ (validate-data cross-checks this against the actual citation map,
 * so the tier is declared but never self-declared). background = shaped a
 * mechanic's design without backing one specific number. library = honest
 * further reading, no usage claim at all.
 */
export const sourceTierSchema = z.enum(['load-bearing', 'background', 'library']);

/**
 * What kind of evidence the game takes from a source: a measurement, a
 * forecast, an argument, or a game-design decision. Orthogonal to `type`
 * (which is the publication form). Unlike tiers, which the validator proves
 * against the citation map, the class is a human judgment the machine cannot
 * verify; disagree via a source-check issue.
 */
export const sourceEvidenceClassSchema = z.enum(['empirical', 'forecast', 'analysis', 'design']);

export const sourceEntrySchema = z
  .strictObject({
    id: sourceIdSchema,
    title: z.string().min(1),
    authors: z.string().optional(),
    org: z.string().optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    url: z.url().optional(),
    type: z.enum(['paper', 'report', 'book', 'dataset', 'web', 'design']),
    tags: z.array(z.string().regex(TAG_PATTERN)).optional(),
    status: z.enum(['verified', 'flagged']),
    tier: sourceTierSchema,
    evidenceClass: sourceEvidenceClassSchema,
    /** load-bearing only: what the citations actually use this source for. */
    gameUse: z.string().min(1).optional(),
    /** background only: the specific mechanic this source shaped, and how. */
    shaped: z.string().min(1).optional(),
    /** library only: what a curious reader gets from it. */
    whyListed: z.string().min(1).optional(),
    /** Why a flagged entry is flagged: honesty lives on the entry itself. */
    flagReason: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((entry, ctx) => {
    const want: Record<string, 'gameUse' | 'shaped' | 'whyListed'> = {
      'load-bearing': 'gameUse',
      background: 'shaped',
      library: 'whyListed',
    };
    const required = want[entry.tier];
    for (const field of ['gameUse', 'shaped', 'whyListed'] as const) {
      if (field === required && !entry[field]) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: `${entry.tier} entries must state '${field}'`,
        });
      }
      if (field !== required && entry[field]) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: `'${field}' is reserved for ${
            Object.entries(want).find(([, f]) => f === field)?.[0]
          } entries; a ${entry.tier} entry must not claim it`,
        });
      }
    }
  });

export const sourcesRegistrySchema = z
  .strictObject({
    $schema: z.string().optional(),
    sources: z.array(sourceEntrySchema).min(1),
  })
  .refine(
    (registry) => new Set(registry.sources.map((s) => s.id)).size === registry.sources.length,
    { message: 'source ids must be unique' },
  );

// ---------------------------------------------------------------------------
// Strings (flat dot-key map; every displayed string lives here)
// ---------------------------------------------------------------------------

export const stringsFileSchema = z.record(
  z.string().regex(STRING_KEY_PATTERN, 'string keys are dot-paths like event.foo.title'),
  z.string().min(1),
);

// ---------------------------------------------------------------------------
// Save format (load/save honors this shape as a contract)
// ---------------------------------------------------------------------------

const seatField = z.enum(PLAYABLE_SEAT_IDS).optional();

export const actionSchema = z.discriminatedUnion('type', [
  z
    .strictObject({
      type: z.literal('allocate'),
      capability: shareInt,
      safety: shareInt,
      diffusion: shareInt,
      seat: seatField,
    })
    .refine((a) => a.capability + a.safety + a.diffusion === 100, {
      message: 'allocation shares must sum to 100',
    }),
  z.strictObject({
    type: z.literal('playPolicy'),
    policyId: z.string().regex(CARD_ID_PATTERN),
    seat: seatField,
  }),
  z.strictObject({ type: z.literal('skipPolicy'), seat: seatField }),
  z.strictObject({
    type: z.literal('resolveEventChoice'),
    eventId: z.string().regex(CARD_ID_PATTERN),
    choiceIndex: z.number().int().min(0).max(3),
    seat: seatField,
  }),
  z.strictObject({ type: z.literal('advance'), seat: seatField }),
]);

export const saveGameSchema = z.strictObject({
  schemaVersion: z.number().int().min(1),
  dataVersion: z.string().min(1),
  seed: z.string().min(1).max(64),
  presetId: z.enum(WORLDVIEW_PRESET_IDS),
  mode: z.enum(GAME_MODES),
  playerSeat: z.enum(PLAYABLE_SEAT_IDS),
  scenarioId: z.string().regex(CARD_ID_PATTERN),
  actions: z.array(actionSchema),
});

// ---------------------------------------------------------------------------
// Inferred types (data-file side of the world)
// ---------------------------------------------------------------------------

export type SourcedInt = z.infer<typeof sourcedIntSchema>;
export type SourcedRange = z.infer<typeof sourcedRangeSchema>;
export type CurveTable = z.infer<typeof curveTableSchema>;
export type EffectSetData = z.infer<typeof effectSetSchema>;
export type EventCardData = z.infer<typeof eventCardSchema>;
export type ChoiceEventData = Extract<EventCardData, { kind: 'choice' }>;
export type FixedEventData = Extract<EventCardData, { kind: 'fixed' }>;
export type WildcardEventData = Extract<EventCardData, { kind: 'wildcard' }>;
export type EventChoiceData = z.infer<typeof eventChoiceSchema>;
export type PolicyCardData = z.infer<typeof policyCardSchema>;
export type IncidentRungData = z.infer<typeof incidentRungSchema>;
export type IncidentsData = z.infer<typeof incidentsSchema>;
export type MandateData = z.infer<typeof mandateSchema>;
export type MandatesData = z.infer<typeof mandatesSchema>;
export type SeatRulesData = z.infer<typeof seatRulesSchema>;
export type SeatsData = z.infer<typeof seatsSchema>;
export type PrologueData = z.infer<typeof prologueSchema>;
export type PrologueChapterData = PrologueData['chapters'][number];
export type WorldviewPresetData = z.infer<typeof worldviewPresetSchema>;
export type ParametersData = z.infer<typeof parametersSchema>;
export type ScenarioData = z.infer<typeof scenarioSchema>;
export type SourceEntry = z.infer<typeof sourceEntrySchema>;
export type SourcesRegistryData = z.infer<typeof sourcesRegistrySchema>;
export type StringsData = z.infer<typeof stringsFileSchema>;
export type SaveGameData = z.infer<typeof saveGameSchema>;
