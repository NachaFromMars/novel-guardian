import { countWords, countSentences, extractDialogues } from './utils.mjs';

// ══════════════════════════════════════════════════════════
// PHÂN TÍCH VĂN PHONG TIẾNG VIỆT — Novel Guardian v1.0
// Thống kê + phát hiện lệch giọng nhân vật
// ══════════════════════════════════════════════════════════

/**
 * Phân tích thống kê văn phong 1 đoạn văn bản
 */
export function analyzeStyle(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const words = countWords(text);
  const sentences = countSentences(text);

  // Đếm dấu câu
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const ellipsis = (text.match(/\.{3}|…/g) || []).length;
  const emDashes = (text.match(/[—–]/g) || []).length;
  const commas = (text.match(/,/g) || []).length;

  // Tách câu và phân tích độ dài
  const sentenceTexts = text.split(/[.!?…]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentenceTexts.map(s => countWords(s));
  const shortSentences = sentenceLengths.filter(l => l <= 8).length;
  const longSentences = sentenceLengths.filter(l => l >= 25).length;

  // Tỷ lệ đối thoại vs tường thuật
  const dialogues = extractDialogues(text);
  const dialogueWords = dialogues.reduce((sum, d) => sum + countWords(d.line), 0);

  // Phát hiện từ vựng đặc biệt
  const modernWords = countPatternMatches(text, MODERN_WORDS);
  const archaicWords = countPatternMatches(text, ARCHAIC_WORDS);
  const vulgarWords = countPatternMatches(text, VULGAR_WORDS);
  const formalWords = countPatternMatches(text, FORMAL_WORDS);
  const humorWords = countPatternMatches(text, HUMOR_INDICATORS);

  return {
    wordCount: words,
    sentenceCount: sentences,
    avgSentenceLength: sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0,
    shortSentenceRatio: sentences > 0 ? Math.round((shortSentences / sentences) * 100) / 100 : 0,
    longSentenceRatio: sentences > 0 ? Math.round((longSentences / sentences) * 100) / 100 : 0,
    punctuation: {
      questionRatio: sentences > 0 ? Math.round((questions / sentences) * 100) / 100 : 0,
      exclamationRatio: sentences > 0 ? Math.round((exclamations / sentences) * 100) / 100 : 0,
      ellipsisRatio: sentences > 0 ? Math.round((ellipsis / sentences) * 100) / 100 : 0,
      emDashRatio: sentences > 0 ? Math.round((emDashes / sentences) * 100) / 100 : 0,
      commaRatio: sentences > 0 ? Math.round((commas / sentences) * 100) / 100 : 0
    },
    dialogue: {
      count: dialogues.length,
      wordRatio: words > 0 ? Math.round((dialogueWords / words) * 100) / 100 : 0,
      speakers: [...new Set(dialogues.map(d => d.speaker).filter(Boolean))]
    },
    vocabulary: {
      modernCount: modernWords,
      archaicCount: archaicWords,
      vulgarCount: vulgarWords,
      formalCount: formalWords,
      humorCount: humorWords,
      dominantTone: getDominantTone({ modernWords, archaicWords, vulgarWords, formalWords })
    }
  };
}

/**
 * So sánh 2 phong cách → điểm tương đồng 0–100
 */
export function compareStyles(styleA, styleB) {
  if (!styleA || !styleB) return 0;

  let score = 0;
  let factors = 0;

  // So sánh độ dài câu trung bình (trọng số: 20%)
  const lenDiff = Math.abs(styleA.avgSentenceLength - styleB.avgSentenceLength);
  score += (1 - Math.min(lenDiff / 15, 1)) * 20;
  factors += 20;

  // So sánh tỷ lệ câu ngắn (15%)
  const shortDiff = Math.abs(styleA.shortSentenceRatio - styleB.shortSentenceRatio);
  score += (1 - Math.min(shortDiff / 0.5, 1)) * 15;
  factors += 15;

  // So sánh dấu câu (20%)
  const pA = styleA.punctuation;
  const pB = styleB.punctuation;
  const puncScore =
    (1 - Math.min(Math.abs(pA.questionRatio - pB.questionRatio) / 0.3, 1)) * 5 +
    (1 - Math.min(Math.abs(pA.exclamationRatio - pB.exclamationRatio) / 0.3, 1)) * 5 +
    (1 - Math.min(Math.abs(pA.ellipsisRatio - pB.ellipsisRatio) / 0.3, 1)) * 5 +
    (1 - Math.min(Math.abs(pA.emDashRatio - pB.emDashRatio) / 0.3, 1)) * 5;
  score += puncScore;
  factors += 20;

  // So sánh tỷ lệ đối thoại (15%)
  const dlgDiff = Math.abs(styleA.dialogue.wordRatio - styleB.dialogue.wordRatio);
  score += (1 - Math.min(dlgDiff / 0.5, 1)) * 15;
  factors += 15;

  // So sánh tone (30%)
  const toneMatch = styleA.vocabulary.dominantTone === styleB.vocabulary.dominantTone ? 30 : 10;
  score += toneMatch;
  factors += 30;

  return Math.round((score / factors) * 100);
}

/**
 * Phát hiện lệch giọng giữa chapter hiện tại vs baseline
 * baseline = style trung bình của các chương trước
 */
export function detectStyleDrift(currentStyle, baselineStyle, threshold = 30) {
  if (!currentStyle || !baselineStyle) return { drifted: false, issues: [] };

  const similarity = compareStyles(currentStyle, baselineStyle);
  const issues = [];

  if (similarity < (100 - threshold)) {
    // Tìm nguyên nhân lệch
    const reasons = [];

    const lenDiff = Math.abs(currentStyle.avgSentenceLength - baselineStyle.avgSentenceLength);
    if (lenDiff > 5) {
      reasons.push(`Độ dài câu trung bình lệch ${lenDiff.toFixed(1)} từ (${currentStyle.avgSentenceLength} vs ${baselineStyle.avgSentenceLength})`);
    }

    const dlgDiff = Math.abs(currentStyle.dialogue.wordRatio - baselineStyle.dialogue.wordRatio);
    if (dlgDiff > 0.2) {
      reasons.push(`Tỷ lệ đối thoại lệch ${(dlgDiff * 100).toFixed(0)}% (${(currentStyle.dialogue.wordRatio * 100).toFixed(0)}% vs ${(baselineStyle.dialogue.wordRatio * 100).toFixed(0)}%)`);
    }

    if (currentStyle.vocabulary.dominantTone !== baselineStyle.vocabulary.dominantTone) {
      reasons.push(`Giọng văn đổi: ${baselineStyle.vocabulary.dominantTone} → ${currentStyle.vocabulary.dominantTone}`);
    }

    const qDiff = Math.abs(currentStyle.punctuation.questionRatio - baselineStyle.punctuation.questionRatio);
    if (qDiff > 0.15) {
      reasons.push(`Tần suất câu hỏi lệch ${(qDiff * 100).toFixed(0)}%`);
    }

    issues.push({
      type: 'style-drift',
      severity: similarity < 40 ? 'warning' : 'note',
      similarity,
      message: `Văn phong lệch ${100 - similarity}% so với baseline`,
      reasons
    });
  }

  return {
    drifted: issues.length > 0,
    similarity,
    issues
  };
}

/**
 * Tạo baseline từ nhiều chương
 */
export function buildBaseline(chapterStyles) {
  if (!chapterStyles || chapterStyles.length === 0) return null;

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    wordCount: Math.round(avg(chapterStyles.map(s => s.wordCount))),
    sentenceCount: Math.round(avg(chapterStyles.map(s => s.sentenceCount))),
    avgSentenceLength: Math.round(avg(chapterStyles.map(s => s.avgSentenceLength)) * 10) / 10,
    shortSentenceRatio: Math.round(avg(chapterStyles.map(s => s.shortSentenceRatio)) * 100) / 100,
    longSentenceRatio: Math.round(avg(chapterStyles.map(s => s.longSentenceRatio)) * 100) / 100,
    punctuation: {
      questionRatio: Math.round(avg(chapterStyles.map(s => s.punctuation.questionRatio)) * 100) / 100,
      exclamationRatio: Math.round(avg(chapterStyles.map(s => s.punctuation.exclamationRatio)) * 100) / 100,
      ellipsisRatio: Math.round(avg(chapterStyles.map(s => s.punctuation.ellipsisRatio)) * 100) / 100,
      emDashRatio: Math.round(avg(chapterStyles.map(s => s.punctuation.emDashRatio)) * 100) / 100,
      commaRatio: Math.round(avg(chapterStyles.map(s => s.punctuation.commaRatio)) * 100) / 100
    },
    dialogue: {
      count: Math.round(avg(chapterStyles.map(s => s.dialogue.count))),
      wordRatio: Math.round(avg(chapterStyles.map(s => s.dialogue.wordRatio)) * 100) / 100,
      speakers: []
    },
    vocabulary: {
      modernCount: Math.round(avg(chapterStyles.map(s => s.vocabulary.modernCount))),
      archaicCount: Math.round(avg(chapterStyles.map(s => s.vocabulary.archaicCount))),
      vulgarCount: Math.round(avg(chapterStyles.map(s => s.vocabulary.vulgarCount))),
      formalCount: Math.round(avg(chapterStyles.map(s => s.vocabulary.formalCount))),
      humorCount: Math.round(avg(chapterStyles.map(s => s.vocabulary.humorCount))),
      dominantTone: getMostCommonTone(chapterStyles)
    }
  };
}

// ═══ TỪ ĐIỂN PHÂN LOẠI ═══

const MODERN_WORDS = [
  'bug', 'nerf', 'buff', 'meta', 'speedrun', 'hack', 'game', 'level',
  'boss', 'server', 'wifi', 'online', 'trend', 'update', 'phiên bản',
  'lol', 'gg', 'ok', 'ko', 'wtf', 'omg', 'bruh'
];

const ARCHAIC_WORDS = [
  'ngài', 'ngươi', 'thưa', 'bẩm', 'phụ thân', 'mẫu thân', 'đại nhân',
  'tiểu nhân', 'bần tăng', 'thí chủ', 'thiện tai', 'A Di Đà Phật',
  'tại hạ', 'các hạ', 'bệ hạ', 'thánh thượng', 'chúa công'
];

const VULGAR_WORDS = [
  'đéo', 'đm', 'mẹ nó', 'chết mẹ', 'đồ chó', 'khốn', 'ngu',
  'con mẹ', 'địt', 'cứt', 'quỷ tha ma bắt', 'chó đẻ'
];

const FORMAL_WORDS = [
  'tuy nhiên', 'mặc dù', 'do đó', 'hơn nữa', 'ngoài ra',
  'nhận thấy', 'đánh giá', 'kết luận', 'phân tích', 'tổng quan'
];

const HUMOR_INDICATORS = [
  'ha ha', 'hề hề', 'hí hí', 'pfft', 'mặt dày', 'trêu',
  'cười ngặt', 'buồn cười', 'đùa', 'hài', 'lố bịch', 'nhạo'
];

// ═══ HÀM NỘI BỘ ═══

function countPatternMatches(text, patterns) {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const word of patterns) {
    const regex = new RegExp(word.toLowerCase(), 'gi');
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

function getDominantTone({ modernWords, archaicWords, vulgarWords, formalWords }) {
  const tones = [
    { name: 'hiện đại', count: modernWords },
    { name: 'cổ kính', count: archaicWords },
    { name: 'thông tục', count: vulgarWords },
    { name: 'trang trọng', count: formalWords }
  ];
  const max = tones.sort((a, b) => b.count - a.count)[0];
  if (max.count === 0) return 'trung tính';
  return max.name;
}

function getMostCommonTone(styles) {
  const tones = styles.map(s => s.vocabulary.dominantTone);
  const counts = {};
  for (const t of tones) {
    counts[t] = (counts[t] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'trung tính';
}
