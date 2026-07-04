/**
 * JSON Schema builds for editor autocomplete in data files.
 * One source of truth: the zod schemas in src/engine/schemas.ts.
 * generate-schemas.ts writes these to data/schemas/; validate-data.ts
 * fails when the committed files drift from the zod definitions.
 */
import { z } from 'zod';
import {
  eventCardSchema,
  incidentsSchema,
  mandatesSchema,
  parametersSchema,
  prologueSchema,
  policyCardSchema,
  scenarioSchema,
  sourcesRegistrySchema,
} from '../../src/engine/schemas';

export function buildJsonSchemas(): Record<string, string> {
  const targets: Record<string, z.ZodType> = {
    'event-card.schema.json': eventCardSchema,
    'policy-card.schema.json': policyCardSchema,
    'parameters.schema.json': parametersSchema,
    'scenario.schema.json': scenarioSchema,
    'sources.schema.json': sourcesRegistrySchema,
    'incidents.schema.json': incidentsSchema,
    'mandates.schema.json': mandatesSchema,
    'prologue.schema.json': prologueSchema,
  };
  const out: Record<string, string> = {};
  for (const [file, schema] of Object.entries(targets)) {
    const jsonSchema = z.toJSONSchema(schema, { io: 'input' });
    out[file] = `${JSON.stringify(jsonSchema, null, 2)}\n`;
  }
  return out;
}
