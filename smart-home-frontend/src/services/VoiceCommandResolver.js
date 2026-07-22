import voiceConfig from '../config/voiceConfig';

const DEFAULT_CONFIDENCE_THRESHOLD = 0.85;
const STOP_WORDS = new Set(['the', 'a', 'an', 'my', 'please', 'could', 'would', 'can', 'i', 'want', 'to', 'need', 'make', 'do', 'that', 'this', 'for', 'in', 'at', 'on', 'of', 'is', 'it', 'with', 'and', 'or', 'but', 'not', 'no', 'yes', 'ok', 'okay', 'please', 'kindly']);

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function tokenize(text) {
  const norm = normalize(text);
  return norm.split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function pluralize(word) {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function hasSynonymMatch(word, entry, synonyms) {
  const wNorm = normalize(word);
  const pluralW = pluralize(wNorm);
  for (const [synonym, canonical] of Object.entries(synonyms)) {
    const sNorm = normalize(synonym);
    const cNorm = normalize(canonical);
    if (wNorm === sNorm || wNorm === cNorm || pluralW === sNorm || pluralW === cNorm) {
      if (cNorm === entry.nameNorm || cNorm === entry.typeNorm) return true;
      if (entry.nameNorm.includes(cNorm) || entry.typeNorm.includes(cNorm)) return true;
    }
  }
  return false;
}

function getSynonymsForWord(word, synonyms) {
  const wNorm = normalize(word);
  const pluralW = pluralize(wNorm);
  const results = [];
  for (const [synonym, canonical] of Object.entries(synonyms)) {
    const sNorm = normalize(synonym);
    const cNorm = normalize(canonical);
    if (wNorm === sNorm || wNorm === cNorm || pluralW === sNorm || pluralW === cNorm) {
      results.push({ synonym: sNorm, canonical: cNorm });
    }
  }
  return results;
}

function extractRoom(text, roomAliases) {
  const t = normalize(text);
  const roomPatterns = [
    { regex: /in\s+the\s+(.+)/i, group: 1 },
    { regex: /in\s+(.+)/i, group: 1 },
    { regex: /at\s+the\s+(.+)/i, group: 1 },
    { regex: /at\s+(.+)/i, group: 1 },
  ];

  for (const { regex, group } of roomPatterns) {
    const match = t.match(regex);
    if (match) {
      const raw = match[group].trim();
      const normRaw = normalize(raw);
      for (const [alias, canonical] of Object.entries(roomAliases)) {
        const aliasNorm = normalize(alias);
        if (normRaw === aliasNorm || normRaw.startsWith(aliasNorm)) {
          const before = t.slice(0, match.index).trim();
          const after = t.slice(match.index + match[0].length).trim();
          const remaining = normalize(before + (after ? ' ' + after : ''));
          return { room: canonical, roomMatch: raw, remainingText: remaining };
        }
      }
    }
  }
  return { room: null, roomMatch: null, remainingText: t };
}

function extractIntent(text, intents) {
  const norm = normalize(text);
  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (norm.includes(pattern)) {
        const idx = norm.indexOf(pattern);
        const before = norm.slice(0, idx).trim();
        const after = norm.slice(idx + pattern.length).trim();
        const remaining = normalize(before + (after ? ' ' + after : ''));
        return { action: intent.action, pattern, remainingText: remaining };
      }
    }
  }
  return { action: null, pattern: null, remainingText: norm };
}

class VoiceCommandResolver {
  constructor(devices = []) {
    this.setDevices(devices);
  }

  setDevices(devices) {
    this.devices = Array.isArray(devices) ? devices : [];
    this._buildIndex();
  }

  _buildIndex() {
    this.deviceIndex = this.devices.map(d => {
      const name = d.deviceName || d.name || '';
      const type = d.deviceType || d.type || '';
      const room = d.roomName || d.room || '';
      return {
        id: d.id,
        name,
        nameNorm: normalize(name),
        type,
        typeNorm: normalize(type),
        room,
        roomNorm: normalize(room),
        original: d,
      };
    });
  }

  resolve(text) {
    const result = { success: false, action: null, device: null, room: null, roomMatch: null, confidence: 0, needsClarification: false, noIntent: false, noDevice: false, candidates: [] };

    if (!text || !text.trim()) {
      result.noDevice = true;
      return result;
    }

    const intent = extractIntent(text, voiceConfig.intents);
    result.action = intent.action;

    if (!intent.action) {
      result.noIntent = true;
      return result;
    }

    const roomResult = extractRoom(intent.remainingText, voiceConfig.roomAliases);
    result.room = roomResult.room;
    result.roomMatch = roomResult.roomMatch;
    const searchText = roomResult.remainingText;

    if (!searchText) {
      result.noDevice = true;
      return result;
    }

    let candidates = this._findCandidates(searchText, result.room);

    candidates = candidates.map(c => ({
      ...c,
      score: this._scoreCandidate(c, searchText, result.room),
    }));

    candidates.sort((a, b) => b.score - a.score);
    result.candidates = candidates.filter(c => c.score > 0);

    if (result.candidates.length === 0) {
      result.noDevice = true;
      return result;
    }

    const top = result.candidates[0];

    if (result.candidates.length === 1 && top.score >= DEFAULT_CONFIDENCE_THRESHOLD) {
      result.success = true;
      result.device = top.original;
      result.confidence = top.score;
    } else if (result.candidates.length > 1 && top.score >= DEFAULT_CONFIDENCE_THRESHOLD && top.score > (result.candidates[1]?.score || 0) + 0.1) {
      result.success = true;
      result.device = top.original;
      result.confidence = top.score;
    } else {
      result.needsClarification = true;
      result.confidence = top.score;
    }

    return result;
  }

  _findCandidates(deviceWords, room) {
    if (room) {
      const filtered = this.deviceIndex.filter(e => normalize(e.room) === normalize(room));
      if (filtered.length > 0) return filtered;
      return this.deviceIndex.map(e => ({ ...e, _roomMismatch: true }));
    }
    return this.deviceIndex;
  }

  _scoreCandidate(entry, deviceWords, room) {
    if (!deviceWords) return 0;
    const tokens = tokenize(deviceWords);
    if (tokens.length === 0) return 0;
    let maxScore = 0;

    for (const token of tokens) {
      const tNorm = normalize(token);
      const tPlural = pluralize(tNorm);
      let score = 0;

      // 1. Exact name match
      if (tNorm === entry.nameNorm || tPlural === entry.nameNorm) score = Math.max(score, 1.0);

      // 2. Name includes token
      if (entry.nameNorm.includes(tNorm) || entry.nameNorm.includes(tPlural)) score = Math.max(score, 0.90);
      if (entry.typeNorm.includes(tNorm) || entry.typeNorm.includes(tPlural)) score = Math.max(score, 0.85);

      // 3. Synonym match
      if (score < 0.85) {
        const syns = getSynonymsForWord(token, voiceConfig.deviceSynonyms);
        for (const { synonym, canonical } of syns) {
          if (canonical === entry.nameNorm || canonical === entry.typeNorm) score = Math.max(score, 0.95);
          if (entry.nameNorm.includes(canonical) || entry.typeNorm.includes(canonical)) score = Math.max(score, 0.90);
          if (entry.nameNorm.includes(synonym) || entry.typeNorm.includes(synonym)) score = Math.max(score, 0.85);
        }
      }

      // 4. Token includes part of device name
      if (score < 0.75) {
        const nameParts = entry.nameNorm.split(/\s+/);
        for (const part of nameParts) {
          if (part.includes(tNorm) || tNorm.includes(part)) score = Math.max(score, 0.70);
          if (part.includes(tPlural) || tPlural.includes(part)) score = Math.max(score, 0.68);
        }
      }

      // 5. Fuzzy match
      if (score < 0.65) {
        const nameSim = similarity(tNorm, entry.nameNorm);
        const typeSim = similarity(tNorm, entry.typeNorm);
        const bestSim = Math.max(nameSim, typeSim);
        if (bestSim > 0.6) score = Math.max(score, bestSim * 0.75);
      }

      // Take best score across all tokens
      maxScore = Math.max(maxScore, score);
    }

    // Room bonus
    if (room && normalize(entry.room) === normalize(room)) {
      maxScore = Math.min(1.0, maxScore + 0.08);
    }
    if (entry._roomMismatch) {
      maxScore = Math.max(0, maxScore - 0.3);
    }

    return Math.round(maxScore * 100) / 100;
  }

  getCandidateNames(candidates) {
    return candidates.slice(0, 5).map(c => c.name || c.original?.deviceName || 'unknown');
  }

  getCandidateCount(candidates) {
    return candidates.length;
  }

  getSynonymFor(word) {
    const norm = normalize(word);
    for (const [synonym, canonical] of Object.entries(voiceConfig.deviceSynonyms)) {
      if (norm === normalize(synonym)) return canonical;
    }
    return null;
  }

  getRoomAliasFor(word) {
    const norm = normalize(word);
    for (const [alias, canonical] of Object.entries(voiceConfig.roomAliases)) {
      if (norm === normalize(alias)) return canonical;
    }
    return null;
  }
}

export { extractIntent, extractRoom, VoiceCommandResolver };
export default VoiceCommandResolver;
