/**
 * End-to-end LLM test script.
 * Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/test-llm.mjs
 *
 * Tests: streaming, completion, mind map JSON, concept card JSON.
 */

import Anthropic from '@anthropic-ai/sdk';

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error('❌  Set ANTHROPIC_API_KEY'); process.exit(1); }

const client = new Anthropic({ apiKey: key });
const MODEL = 'claude-haiku-4-5-20251001';

function pass(label) { console.log(`  ✅  ${label}`); }
function fail(label, err) { console.error(`  ❌  ${label}:`, err?.message ?? err); process.exitCode = 1; }

// ── Test 1: streaming ────────────────────────────────────────────────────────
console.log('\n1. Streaming (should print tokens as they arrive):');
try {
  let tokens = 0;
  let text = '';
  const s = client.messages.stream({
    model: MODEL, max_tokens: 80, temperature: 0.5,
    system: 'You are a helpful assistant.',
    messages: [{ role: 'user', content: 'Say "streaming works" and nothing else.' }],
  });
  for await (const chunk of s) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      process.stdout.write(chunk.delta.text);
      text += chunk.delta.text;
      tokens++;
    }
  }
  console.log();
  if (tokens > 0 && text.toLowerCase().includes('streaming')) pass('Streaming delivered tokens');
  else fail('Streaming', 'no valid tokens received');
} catch (e) { fail('Streaming', e); }

// ── Test 2: completion ───────────────────────────────────────────────────────
console.log('\n2. Completion (JSON round-trip):');
try {
  const res = await client.messages.create({
    model: MODEL, max_tokens: 60,
    system: 'Reply with exactly: {"ok":true}',
    messages: [{ role: 'user', content: 'go' }],
  });
  const text = res.content[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (parsed.ok === true) pass('Completion + JSON parse');
  else fail('Completion', `unexpected value: ${text}`);
} catch (e) { fail('Completion', e); }

// ── Test 3: mind map JSON ────────────────────────────────────────────────────
console.log('\n3. Mind map JSON generation:');
try {
  const res = await client.messages.create({
    model: MODEL, max_tokens: 400, temperature: 0.4,
    system: `Generate a mind map in strict JSON. Return ONLY the JSON object, no other text.
Schema: {"root":"string","branches":[{"label":"string","children":[{"label":"string"}]}]}
Rules: 3-4 branches, 2-3 children each, labels max 6 words.`,
    messages: [{ role: 'user', content: 'Topic: Python programming basics' }],
  });
  const text = res.content[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const map = JSON.parse(cleaned);
  if (!map.root || !Array.isArray(map.branches)) throw new Error('Missing root or branches');
  if (map.branches.length < 2) throw new Error('Too few branches');
  map.branches.forEach((b, i) => {
    if (!b.label) throw new Error(`Branch ${i} missing label`);
    if (!Array.isArray(b.children)) throw new Error(`Branch ${i} missing children`);
  });
  pass(`Mind map: "${map.root}" with ${map.branches.length} branches`);
  console.log('    Branches:', map.branches.map(b => b.label).join(', '));
} catch (e) { fail('Mind map JSON', e); }

// ── Test 4: concept card JSON ─────────────────────────────────────────────────
console.log('\n4. Concept card JSON generation:');
try {
  const res = await client.messages.create({
    model: MODEL, max_tokens: 200, temperature: 0.4,
    system: 'Return ONLY valid JSON: {"type":"concept","title":"string","body":"string","tags":["string"]}',
    messages: [{ role: 'user', content: 'Topic: Python variables' }],
  });
  const text = res.content[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const card = JSON.parse(cleaned);
  if (!card.title || !card.body || !Array.isArray(card.tags)) throw new Error('Missing title/body/tags');
  pass(`Card: "${card.title}" (${card.tags.length} tags)`);
} catch (e) { fail('Concept card JSON', e); }

console.log('\nDone.\n');
