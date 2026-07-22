import api from './api';

const CACHE_KEY = 'ai_translations';
const CACHE_BATCH_KEY = 'ai_translations_batch';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const getCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > CACHE_TTL) return {};
    return data.entries || {};
  } catch {
    return {};
  }
};

const setCache = (entries) => {
  try {
    const existing = getCache();
    const merged = { ...existing, ...entries };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), entries: merged }));
  } catch {}
};

const getCachedTranslation = (text, targetLang) => {
  const cache = getCache();
  const key = `${targetLang}:${text}`;
  return cache[key] || null;
};

const setCachedTranslation = (text, targetLang, translation) => {
  setCache({ [`${targetLang}:${text}`]: translation });
};

const OLLAMA_UNAVAILABLE = 'OLLAMA_UNAVAILABLE';
const ollamaStatus = { unavailable: false, checked: false };

const translateViaOllama = async (text, targetLang) => {
  if (ollamaStatus.unavailable) return null;
  try {
    const res = await api.post('/translation/translate', { text, targetLanguage: targetLang });
    return res.data?.translatedText || null;
  } catch (err) {
    if (err.response?.status === 503) {
      ollamaStatus.unavailable = true;
    }
    return null;
  }
};

const translateViaMyMemory = async (text, targetLang) => {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}&de=translator@smarthome.app`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.responseData?.translatedText || null;
  } catch {
    return null;
  }
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text || targetLang === sourceLang) return text;

  const cached = getCachedTranslation(text, targetLang);
  if (cached) return cached;

  for (const translateFn of [
    translateViaOllama,
    translateViaMyMemory,
  ]) {
    try {
      const translation = await translateFn(text, targetLang);
      if (translation) {
        setCachedTranslation(text, targetLang, translation);
        return translation;
      }
    } catch {}
  }
  return text;
};

export const translateBatch = async (entries, targetLang, onProgress) => {
  const results = {};
  const toFetch = [];

  for (const [key, text] of Object.entries(entries)) {
    const cached = getCachedTranslation(text, targetLang);
    if (cached) {
      results[key] = cached;
    } else {
      toFetch.push({ key, text });
    }
  }

  if (toFetch.length === 0) return results;

  // Try batch endpoint first (10 texts per call)
  if (!ollamaStatus.unavailable || !ollamaStatus.checked) {
    try {
      ollamaStatus.checked = true;
      const batchChunks = [];
      for (let i = 0; i < toFetch.length; i += 10) {
        batchChunks.push(toFetch.slice(i, i + 10));
      }

      let completed = 0;
      for (const chunk of batchChunks) {
        const batchRes = await api.post('/translation/batch', {
          texts: chunk.map(x => ({ key: x.key, text: x.text })),
          targetLanguage: targetLang
        }).catch(() => null);

        if (batchRes?.data?.translations) {
          for (const [k, translation] of Object.entries(batchRes.data.translations)) {
            results[k] = translation;
            setCachedTranslation(entries[k] || k, targetLang, translation);
          }
          completed += chunk.length;
          if (onProgress) onProgress(completed, toFetch.length);
        }
        await delay(100);
      }

      const remaining = toFetch.filter(x => !results[x.key]);
      if (remaining.length === 0) return results;
      toFetch.length = 0;
      toFetch.push(...remaining);
    } catch {}
  }

  // Fallback: individual requests via Ollama or MyMemory
  const CONCURRENCY = 5;
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async ({ key, text }) => {
        const translation = await translateText(text, targetLang);
        return { key, translation };
      })
    );
    for (const { key, translation } of batchResults) {
      results[key] = translation;
    }
    if (onProgress) onProgress(Math.min(i + CONCURRENCY, toFetch.length), toFetch.length);
    if (i + CONCURRENCY < toFetch.length) await delay(200);
  }

  return results;
};

export const clearTranslationCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_BATCH_KEY);
  } catch {}
};
