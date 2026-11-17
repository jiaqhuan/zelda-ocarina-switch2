// Read a sheet-music image with a vision model and return a score string that
// `convert()` in ./ocarina.mjs understands (e.g. "E5 D5 C5 B4 | A4 G4").
//
// Works with any OpenAI-compatible chat-completions endpoint that accepts
// image input. Configure with environment variables (never commit keys):
//   OCARINA_VISION_API_KEY   (falls back to OPENAI_API_KEY)
//   OCARINA_VISION_BASE_URL  (default https://api.openai.com/v1)
//   OCARINA_VISION_MODEL     (default gpt-4o)

import fs from 'node:fs/promises';
import path from 'node:path';
import { tokenize } from './ocarina.mjs';

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
const MAX_BYTES = 20 * 1024 * 1024;

export const PROMPT = [
  'You transcribe a sheet-music image into plain text for a converter.',
  'Output ONLY the melody of the top staff as scientific pitch note names separated by spaces:',
  'a letter A-G, an optional # or b, then the octave number (middle C = C4).',
  'Write every accidental explicitly on every note it applies to, including accidentals implied by the',
  'key signature and by earlier accidentals in the same bar.',
  'Put | between bars and use r for rests.',
  'Ignore rhythm, dynamics, lyrics and chord symbols; for chords write only the highest note.',
  'If you cannot read a note, write ? in its place.',
  'No explanations and no code fences.',
].join(' ');

/** Remove code fences / labels a model may add despite the instructions. */
export function cleanModelOutput(text) {
  return text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/^\s*(notes|melody|score)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} imagePath
 * @param {{ apiKey?: string, baseUrl?: string, model?: string, fetch?: typeof fetch }} [options]
 * @returns {Promise<string>} score text; every token has been validated by tokenize()
 */
export async function imageToScore(imagePath, options = {}) {
  const env = process.env;
  const apiKey = options.apiKey ?? env.OCARINA_VISION_API_KEY ?? env.OPENAI_API_KEY;
  const baseUrl = (options.baseUrl ?? env.OCARINA_VISION_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = options.model ?? env.OCARINA_VISION_MODEL ?? 'gpt-4o';
  const doFetch = options.fetch ?? fetch;

  if (!apiKey) {
    throw new Error('No API key. Set OCARINA_VISION_API_KEY (or OPENAI_API_KEY) to use --image.');
  }
  const mime = MIME[path.extname(imagePath).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image type "${path.extname(imagePath)}" (use png, jpg, webp or gif).`);

  const data = await fs.readFile(imagePath);
  if (data.length > MAX_BYTES) throw new Error('Image is larger than 20 MB; please crop or compress it.');

  const response = await doFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${data.toString('base64')}` } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Vision API returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const json = await response.json();
  const text = cleanModelOutput(json.choices?.[0]?.message?.content ?? '');
  if (!text) throw new Error('The vision model returned no notes.');

  // Validate now so a bad reading fails here, with the text available to fix by hand.
  try {
    tokenize(text);
  } catch (err) {
    const unreadable = text.includes('?') ? ' Some notes were marked ? (unreadable).' : '';
    const error = new Error(`${err.message}.${unreadable} Recognized text: ${text}`);
    error.recognized = text;
    throw error;
  }
  return text;
}
