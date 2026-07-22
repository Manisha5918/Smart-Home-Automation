import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import ta from "./locales/ta.json";
import ml from "./locales/ml.json";
import { translateBatch } from "../services/aiTranslationService";

const STORAGE_KEY = "homemind_language";
const AI_CACHE_PREFIX = "i18n_ai_cache_";
const CACHE_VERSION_KEY = "i18n_cache_version";
const CACHE_VERSION = 3;

const savedLanguage = localStorage.getItem(STORAGE_KEY) || "en";

if (localStorage.getItem(CACHE_VERSION_KEY) !== String(CACHE_VERSION)) {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(AI_CACHE_PREFIX) || key === "ai_translations" || key === "ai_translations_batch")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION));
}

const supportedLanguages = ["en", "hi", "ta", "ml"];

const LANG_JSON = { en, hi, ta, ml };

const loadingLangs = {};

const getAiCache = (lang) => {
  try {
    const raw = localStorage.getItem(`${AI_CACHE_PREFIX}${lang}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > 7 * 24 * 60 * 60 * 1000) return null;
    return data.bundle;
  } catch {
    return null;
  }
};

const setAiCache = (lang, bundle) => {
  try {
    localStorage.setItem(`${AI_CACHE_PREFIX}${lang}`, JSON.stringify({ ts: Date.now(), bundle }));
  } catch {}
};

const findMissingKeys = (source, target) => {
  const missing = {};
  const walk = (obj, targetObj, prefix = "") => {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        walk(val, targetObj?.[key] || {}, path);
      } else if (typeof val === "string") {
        if (typeof targetObj?.[key] !== "string") {
          missing[path] = val;
        }
      }
    }
  };
  walk(source, target);
  return missing;
};

const mergeDeep = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

const loadAiTranslations = async (lang) => {
  if (loadingLangs[lang]) return;
  loadingLangs[lang] = true;
  try {
    const base = LANG_JSON[lang] || {};
    const missing = findMissingKeys(en, base);

    if (Object.keys(missing).length === 0) { loadingLangs[lang] = false; return; }

    const cached = getAiCache(lang);
    if (cached) {
      const merged = mergeDeep(base, cached);
      i18n.addResourceBundle(lang, "translation", merged, true, true);
      i18n.emit("languageChanged", lang);
      loadingLangs[lang] = false;
      return;
    }

    const aiTranslations = await translateBatch(missing, lang, (completed, total) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("i18n-progress", { detail: { lang, completed, total } }));
      }
    });

    setAiCache(lang, aiTranslations);

    const rebuildNested = (flat) => {
      const result = {};
      for (const key of Object.keys(flat)) {
        const parts = key.split(".");
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = flat[key];
      }
      return result;
    };

    const merged = mergeDeep(base, rebuildNested(aiTranslations));
    i18n.addResourceBundle(lang, "translation", merged, true, true);
    i18n.emit("languageChanged", lang);
  } finally {
    loadingLangs[lang] = false;
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta },
      ml: { translation: ml },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
  });

if (savedLanguage !== "en") {
  loadAiTranslations(savedLanguage);
}

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  if (lng !== "en") {
    const cached = getAiCache(lng);
    if (!cached) {
      setTimeout(() => loadAiTranslations(lng), 100);
    }
  }
});

export { loadAiTranslations, supportedLanguages };
export default i18n;
