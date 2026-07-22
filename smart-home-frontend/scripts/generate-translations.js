/**
 * Pre-generation script for complete locale files.
 * Run: node scripts/generate-translations.js
 *
 * Calls the backend TranslationService (Ollama) to translate
 * all missing keys and writes complete JSON files.
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://localhost:7292/api';
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const LANGUAGES = ['hi', 'ta', 'ml'];
const CHUNK_SIZE = 10;

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
}

function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenKeys(val, path));
    } else if (typeof val === 'string') {
      result[path] = val;
    }
  }
  return result;
}

function unflattenKeys(flat) {
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

async function translateBatch(texts, targetLang) {
  const results = {};

  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE);
    console.log(`  Translating batch ${i / CHUNK_SIZE + 1}/${Math.ceil(texts.length / CHUNK_SIZE)} (${chunk.length} texts)...`);

    const combined = chunk.map(x => x.text).join('\n---\n');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_BASE}/translation/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: combined, targetLanguage: targetLang }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`  API returned ${res.status}, using fallback...`);
        chunk.forEach((x, idx) => { results[x.key] = x.text; });
        continue;
      }

      const data = await res.json();
      const translated = (data.translatedText || '').split('\n---\n').map(s => s.trim());

      chunk.forEach((x, idx) => {
        results[x.key] = translated[idx] && translated[idx].length > 0 ? translated[idx] : x.text;
      });
    } catch (err) {
      console.warn(`  Batch failed: ${err.message}, keeping original...`);
      chunk.forEach(x => { results[x.key] = x.text; });
    }

    await new Promise(r => setTimeout(r, 200));
  }

  return results;
}

async function main() {
  console.log('=== Smart Home Translation Generator ===\n');

  const en = loadJson('en.json');
  const enFlat = flattenKeys(en);
  console.log(`English keys: ${Object.keys(enFlat).length}\n`);

  for (const lang of LANGUAGES) {
    console.log(`--- Processing ${lang.toUpperCase()} ---`);
    const locale = loadJson(`${lang}.json`);
    const localeFlat = flattenKeys(locale);

    const missing = {};
    for (const key of Object.keys(enFlat)) {
      if (!localeFlat[key]) {
        missing[key] = enFlat[key];
      }
    }

    const missingKeys = Object.keys(missing);
    console.log(`  Existing: ${Object.keys(localeFlat).length}`);
    console.log(`  Missing: ${missingKeys.length}`);

    if (missingKeys.length === 0) {
      console.log('  ✓ Already complete!\n');
      continue;
    }

    const textsToTranslate = missingKeys.map(key => ({ key, text: missing[key] }));
    const translations = await translateBatch(textsToTranslate, lang);

    // Merge translations into locale
    const merged = mergeDeep(locale, unflattenKeys(translations));

    // Write result
    const outputPath = path.join(LOCALES_DIR, `${lang}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`  ✓ Written to ${lang}.json\n`);
  }

  console.log('=== All translations generated! ===');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
