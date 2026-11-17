import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cleanModelOutput, imageToScore } from '../src/vision.mjs';
import { convert } from '../src/ocarina.mjs';

function tempImage(name = 'score.png') {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ocarina-')), name);
  fs.writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return file;
}

function fakeFetch(content, { ok = true, status = 200 } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok,
      status,
      json: async () => ({ choices: [{ message: { content } }] }),
      text: async () => content,
    };
  };
  impl.calls = calls;
  return impl;
}

test('cleanModelOutput strips fences and labels', () => {
  assert.equal(cleanModelOutput('```\nE5 D5\nC5 B4\n```'), 'E5 D5 C5 B4');
  assert.equal(cleanModelOutput('Notes: E5 D5'), 'E5 D5');
});

test('imageToScore sends the image as a data URL and returns validated notes', async () => {
  const fetch = fakeFetch('```text\nE5 D5 C5 B4 | A4 G4\n```');
  const text = await imageToScore(tempImage(), { apiKey: 'test-key', baseUrl: 'https://example.test/v1/', fetch });

  assert.equal(text, 'E5 D5 C5 B4 | A4 G4');
  const { url, init } = fetch.calls[0];
  assert.equal(url, 'https://example.test/v1/chat/completions');
  assert.equal(init.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(init.body);
  assert.equal(body.temperature, 0);
  const image = body.messages[0].content.find((p) => p.type === 'image_url');
  assert.match(image.image_url.url, /^data:image\/png;base64,/);

  // The recognized text feeds straight into the converter.
  assert.equal(convert(text).events.filter((e) => e.type === 'note').length, 6);
});

test('imageToScore reports unreadable notes and keeps the recognized text', async () => {
  const fetch = fakeFetch('E5 ? C5');
  await assert.rejects(
    imageToScore(tempImage(), { apiKey: 'k', fetch }),
    (err) => /marked \?/.test(err.message) && err.recognized === 'E5 ? C5',
  );
});

test('imageToScore rejects missing key, bad type and API errors', async () => {
  const saved = { a: process.env.OCARINA_VISION_API_KEY, b: process.env.OPENAI_API_KEY };
  delete process.env.OCARINA_VISION_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await assert.rejects(imageToScore(tempImage(), { fetch: fakeFetch('E5') }), /No API key/);
  } finally {
    if (saved.a !== undefined) process.env.OCARINA_VISION_API_KEY = saved.a;
    if (saved.b !== undefined) process.env.OPENAI_API_KEY = saved.b;
  }
  await assert.rejects(imageToScore(tempImage('score.pdf'), { apiKey: 'k', fetch: fakeFetch('E5') }), /Unsupported image type/);
  await assert.rejects(
    imageToScore(tempImage(), { apiKey: 'k', fetch: fakeFetch('quota exceeded', { ok: false, status: 429 }) }),
    /returned 429/,
  );
});
