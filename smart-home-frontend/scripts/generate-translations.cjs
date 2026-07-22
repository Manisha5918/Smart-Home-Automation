/**
 * Translation Generator — pre-generates complete locale files via Ollama.
 *
 * Prerequisites:
 *   1. Ollama running on http://localhost:11434
 *   2. A model pulled (e.g., qwen3:4b, llama3.2:3b)
 *
 * Run:
 *   node scripts/generate-translations.cjs
 *
 * This reads en.json, finds all missing keys in hi/ta/ml JSON,
 * translates them in batches via Ollama, and writes complete files.
 */

const fs = require('fs');
const path = require('path');

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen3:4b';
const CHUNK_SIZE = 15;

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const LANGUAGES = [
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ml', name: 'Malayalam' },
];

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
}

function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenKeys(val, p));
    } else if (typeof val === 'string') {
      result[p] = val;
    }
  }
  return result;
}

function unflatten(flat) {
  const result = {};
  for (const key of Object.keys(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = flat[key];
  }
  return result;
}

function mergeDeep(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

async function translateViaOllama(texts, langName) {
  const combined = texts.map((t, i) => `[${i}] ${t}`).join('\n');
  const prompt = `Translate the following smart home phrases from English to ${langName}.

Rules:
- Translate each phrase marked with [N] prefix
- Preserve device names, numbers, and units (W, kW, kWh, CO2, ₹)
- Return translations in order with the [N] prefix
- Return ONLY the translations, no explanations or extra text

Input:
${combined}`;

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, options: { temperature: 0.1 } }),
  });

  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

  const data = await res.json();
  const response = (data.response || '').trim();
  const lines = response.split('\n').filter(l => l.trim());

  const results = {};
  let currentIdx = -1;

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.*)/);
    if (match) {
      currentIdx = parseInt(match[1]);
      results[currentIdx] = match[2].trim();
    } else if (currentIdx >= 0 && results[currentIdx]) {
      results[currentIdx] += ' ' + line.trim();
    }
  }

  return results;
}

async function main() {
  console.log('=== Smart Home Translation Generator ===\n');

  const en = loadJson('en.json');
  const enFlat = flattenKeys(en);
  console.log(`English keys: ${Object.keys(enFlat).length}\n`);

  for (const { code, name } of LANGUAGES) {
    console.log(`─── ${name} (${code}) ───`);
    const locale = loadJson(`${code}.json`);
    const localeFlat = flattenKeys(locale);
    const existing = Object.keys(localeFlat).length;

    const missingEntries = [];
    for (const key of Object.keys(enFlat)) {
      if (!localeFlat[key]) {
        missingEntries.push({ key, text: enFlat[key] });
      }
    }

    console.log(`  Existing: ${existing}`);
    console.log(`  Missing:  ${missingEntries.length}`);

    if (missingEntries.length === 0) {
      console.log('  ✓ Already complete!\n');
      continue;
    }

    const translations = {};

    for (let i = 0; i < missingEntries.length; i += CHUNK_SIZE) {
      const chunk = missingEntries.slice(i, i + CHUNK_SIZE);
      const batchNum = Math.floor(i / CHUNK_SIZE) + 1;
      const totalBatches = Math.ceil(missingEntries.length / CHUNK_SIZE);
      console.log(`  Batch ${batchNum}/${totalBatches} (${chunk.length} texts)...`);

      try {
        const chunkTexts = chunk.map(x => x.text);
        const results = await translateViaOllama(chunkTexts, name);

        chunk.forEach((entry, idx) => {
          const translated = results[idx] || entry.text;
          translations[entry.key] = translated;
        });
      } catch (err) {
        console.warn(`  ✗ Batch failed: ${err.message}. Keeping originals.`);
        chunk.forEach(entry => { translations[entry.key] = entry.text; });
      }

      await new Promise(r => setTimeout(r, 300));
    }

    const merged = mergeDeep(locale, unflatten(translations));
    fs.writeFileSync(path.join(LOCALES_DIR, `${code}.json`), JSON.stringify(merged, null, 2), 'utf8');
    console.log(`  ✓ Written to ${code}.json (${Object.keys(flattenKeys(merged)).length} keys)\n`);
  }

  console.log('=== All translations generated! ===');
  console.log('Run: npm run build  to rebuild with complete translations.');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  console.error('Make sure Ollama is running on http://localhost:11434');
  process.exit(1);
});
