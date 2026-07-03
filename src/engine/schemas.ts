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
  RESOURCE_KEYS,
  RIVAL_POSTURES,
  SEAT_IDS,
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
});

// ---------------------------------------------------------------------------
// Event cards
// ---------------------------------------------------------------------------

export const eventChoiceSchema = z.strictObject({
  label: stringsRefSchema,
  effects: effectSetSchema.optional(),
  delayedEffects: z.array(delayedEffectSpecSchema).min(1).optional(),
});

export const eventCardSchema = z
  .strictObject({
    $schema: z.string().optional(),
    id: z.string().regex(CARD_ID_PATTERN),
    title: stringsRefSchema,
    body: stringsRefSchema,
    trigger: z
      .strictObject({
        era: z.enum(ERA_IDS).optional(),
        turnMin: turnInt.optional(),
        turnMax: turnInt.optional(),
        weight: z.number().int().min(1).max(10),
        conditions: conditionsSchema.optional(),
      })
      .refine((t) => t.turnMin === undefined || t.turnMax === undefined || t.turnMin <= t.turnMax, {
        message: 'turnMin must be <= turnMax',
      }),
    choices: z.array(eventChoiceSchema).min(1).max(4),
    repeatable: z.boolean().optional(),
    sourceIds: sourceIdsSchema,
    tags: z.array(z.string().regex(TAG_PATTERN)).min(1),
  })
  .refine(
    (card) =>
      card.choices.some(
        (choice) =>
          (choice.delayedEffects?.length ?? 0) > 0 ||
          (choice.effects?.flags?.length ?? 0) > 0 ||
          Object.values(choice.effects ?? {}).some(
            (value) => typeof value === 'number' && value < 0,
          ),
      ),
    {
      message:
        'every strong card bites: at least one choice needs a delayed effect, a flag, or a cost',
    },
  );

// ---------------------------------------------------------------------------
// Policy cards
// ---------------------------------------------------------------------------

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
  cooldown: z.number().int().min(1).max(16).optional(),
  oncePerRun: z.boolean().optional(),
  sourceIds: sourceIdsSchema,
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
});

export const parametersSchema = z.strictObject({
  $schema: z.string().optional(),
  worldviewPresets: z.strictObject(requiredKeys(WORLDVIEW_PRESET_IDS, worldviewPresetSchema)),
  evalUncertainty: z.strictObject({
    baseBandWidth: sourcedIntSchema,
    safetyInsightNarrowing: sourcedIntSchema,
    floorBandWidth: sourcedIntSchema,
  }),
  turnStructure: z.strictObject({
    maxTurns: sourcedIntSchema,
    electionTurn: sourcedIntSchema,
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

export const scenarioSchema = z.strictObject({
  $schema: z.string().optional(),
  id: z.string().regex(CARD_ID_PATTERN),
  seat: z.enum(SEAT_IDS),
  label: stringsRefSchema,
  startTime: z.strictObject({
    year: z.number().int().min(2020).max(2100),
    quarter: z.number().int().min(1).max(4),
  }),
  startResources: z.strictObject(requiredKeys(RESOURCE_KEYS, sourcedIntSchema)),
  startSociety: z.strictObject({
    jobDisplacement: sourcedIntSchema,
    unrest: sourcedIntSchema,
  }),
  startRival: z.strictObject({
    posture: z.enum(RIVAL_POSTURES),
    capability: sourcedIntSchema,
    trust: sourcedIntSchema,
    substitution: sourcedIntSchema,
  }),
  startAllocation: z
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
  startingHand: z.array(z.string().regex(CARD_ID_PATTERN)).optional(),
});

// ---------------------------------------------------------------------------
// Sources registry
// ---------------------------------------------------------------------------

export const sourceEntrySchema = z.strictObject({
  id: sourceIdSchema,
  title: z.string().min(1),
  authors: z.string().optional(),
  org: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  url: z.url().optional(),
  type: z.enum(['paper', 'report', 'book', 'dataset', 'web', 'design']),
  tags: z.array(z.string().regex(TAG_PATTERN)).optional(),
  status: z.enum(['verified', 'flagged', 'book', 'pending']),
  gameUse: z.string().optional(),
  note: z.string().optional(),
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
// Save format (Block B5 implements load/save; the shape is contract now)
// ---------------------------------------------------------------------------

export const actionSchema = z.discriminatedUnion('type', [
  z
    .strictObject({
      type: z.literal('allocate'),
      capability: shareInt,
      safety: shareInt,
      diffusion: shareInt,
    })
    .refine((a) => a.capability + a.safety + a.diffusion === 100, {
      message: 'allocation shares must sum to 100',
    }),
  z.strictObject({ type: z.literal('playPolicy'), policyId: z.string().regex(CARD_ID_PATTERN) }),
  z.strictObject({ type: z.literal('skipPolicy') }),
  z.strictObject({
    type: z.literal('resolveEventChoice'),
    eventId: z.string().regex(CARD_ID_PATTERN),
    choiceIndex: z.number().int().min(0).max(3),
  }),
  z.strictObject({ type: z.literal('advance') }),
]);

export const saveGameSchema = z.strictObject({
  schemaVersion: z.number().int().min(1),
  dataVersion: z.string().min(1),
  seed: z.string().min(1).max(64),
  presetId: z.enum(WORLDVIEW_PRESET_IDS),
  seatId: z.enum(SEAT_IDS),
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
export type EventChoiceData = z.infer<typeof eventChoiceSchema>;
export type PolicyCardData = z.infer<typeof policyCardSchema>;
export type WorldviewPresetData = z.infer<typeof worldviewPresetSchema>;
export type ParametersData = z.infer<typeof parametersSchema>;
export type ScenarioData = z.infer<typeof scenarioSchema>;
export type SourceEntry = z.infer<typeof sourceEntrySchema>;
export type SourcesRegistryData = z.infer<typeof sourcesRegistrySchema>;
export type StringsData = z.infer<typeof stringsFileSchema>;
export type SaveGameData = z.infer<typeof saveGameSchema>;
