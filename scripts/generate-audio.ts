/**
 * pnpm audio — generate the voice layer via ElevenLabs, build-time only.
 *
 * House rules (constitution + asset notes):
 * - ALWAYS the /with-timestamps endpoint; alignment JSON saved beside each
 *   mp3 (captions later at zero regeneration cost).
 * - API key from the environment only (ELEVENLABS_API_KEY). Never committed,
 *   never at runtime.
 * - Idempotent: a surface regenerates only when its text/voice/model hash
 *   changes.
 * - TEXT COMES FROM data/strings/en.json: the script lists string KEYS, so
 *   the spoken words can never drift from the displayed words, and a future
 *   locale is the same script pointed at another strings file.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashStringHex } from '../src/engine/hash';

interface AudioScript {
  voiceId: string;
  modelId: string;
  surfaces: Array<{ id: string; key: string }>;
}

function resolveKey(): string {
  if (process.env.ELEVENLABS_API_KEY) {
    return process.env.ELEVENLABS_API_KEY;
  }
  throw new Error('set ELEVENLABS_API_KEY in the environment (build-time only, never committed)');
}

const script = JSON.parse(
  readFileSync(new URL('./audio-script.json', import.meta.url), 'utf8'),
) as AudioScript;
const strings = JSON.parse(
  readFileSync(new URL('../data/strings/en.json', import.meta.url), 'utf8'),
) as Record<string, string>;
const outDir = new URL('../public/audio', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const apiKey = resolveKey();
let generated = 0;
let skipped = 0;
let failed = 0;

for (const surface of script.surfaces) {
  const text = strings[surface.key];
  if (!text) {
    throw new Error(`audio surface '${surface.id}' points at missing string key '${surface.key}'`);
  }
  const stamp = hashStringHex(`${script.voiceId}::${script.modelId}::${text}`);
  const audioPath = join(outDir, `voice-${surface.id}.mp3`);
  const metaPath = join(outDir, `voice-${surface.id}.timestamps.json`);

  if (existsSync(metaPath) && existsSync(audioPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as { textHash?: string };
    if (meta.textHash === stamp) {
      skipped += 1;
      continue;
    }
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${script.voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: script.modelId,
        voice_settings: { stability: 0.55, similarity_boost: 0.6, style: 0.2 },
      }),
    },
  );
  if (!response.ok) {
    // A model that rejects the timestamps endpoint or a transient error must
    // not kill the whole batch; report at the end and exit nonzero.
    console.error(`FAIL ${surface.id}: ElevenLabs ${response.status} ${await response.text()}`);
    failed += 1;
    continue;
  }
  const payload = (await response.json()) as {
    audio_base64: string;
    alignment: unknown;
    normalized_alignment?: unknown;
  };
  writeFileSync(audioPath, Buffer.from(payload.audio_base64, 'base64'));
  writeFileSync(
    metaPath,
    `${JSON.stringify({ textHash: stamp, key: surface.key, text, alignment: payload.alignment }, null, 2)}\n`,
  );
  console.log(`generated voice-${surface.id}.mp3`);
  generated += 1;
}

console.log(`audio: ${generated} generated, ${skipped} cached, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
