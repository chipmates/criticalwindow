/**
 * pnpm audio — generate ending narrations via ElevenLabs, build-time only.
 *
 * House rules (constitution + asset notes):
 * - ALWAYS the /with-timestamps endpoint; alignment JSON saved beside each
 *   mp3 (captions later at zero regeneration cost).
 * - API key from the environment only (ELEVENLABS_API_KEY, falling back to
 *   the recorded local .env location). Never committed, never at runtime.
 * - Idempotent: a line regenerates only when its text/voice hash changes.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { hashStringHex } from '../src/engine/hash';

interface AudioScript {
  voiceId: string;
  modelId: string;
  lines: Array<{ id: string; text: string }>;
}

function resolveKey(): string {
  if (process.env.ELEVENLABS_API_KEY) {
    return process.env.ELEVENLABS_API_KEY;
  }
  const envPath = join(homedir(), 'Documents/Coding/story-generator/.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = /^ELEVENLABS_API_KEY=(.+)$/.exec(line.trim());
      if (match) {
        return match[1]!.trim();
      }
    }
  }
  throw new Error('ELEVENLABS_API_KEY not found (env or recorded .env location)');
}

const script = JSON.parse(
  readFileSync(new URL('./audio-script.json', import.meta.url), 'utf8'),
) as AudioScript;
const outDir = new URL('../public/audio', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const key = resolveKey();
let generated = 0;
let skipped = 0;

for (const line of script.lines) {
  const stamp = hashStringHex(`${script.voiceId}::${script.modelId}::${line.text}`);
  const audioPath = join(outDir, `${line.id}.mp3`);
  const metaPath = join(outDir, `${line.id}.timestamps.json`);

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
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({
        text: line.text,
        model_id: script.modelId,
        voice_settings: { stability: 0.55, similarity_boost: 0.6, style: 0.2 },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`${line.id}: ElevenLabs ${response.status} ${await response.text()}`);
  }
  const payload = (await response.json()) as {
    audio_base64: string;
    alignment: unknown;
    normalized_alignment?: unknown;
  };
  writeFileSync(audioPath, Buffer.from(payload.audio_base64, 'base64'));
  writeFileSync(
    metaPath,
    `${JSON.stringify({ textHash: stamp, text: line.text, alignment: payload.alignment }, null, 2)}\n`,
  );
  console.log(`generated ${line.id}.mp3`);
  generated += 1;
}

console.log(`audio: ${generated} generated, ${skipped} cached`);
