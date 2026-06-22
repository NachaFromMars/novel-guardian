import { readMarkdown, countWords, writeJSON, readJSON, ensureDir, dateNow } from './utils.mjs';
import { listMarkdownFiles } from './utils.mjs';
import { join } from 'path';

// ══════════════════════════════════════════════════════════
// PHÂN TÍCH NHỊP TRUYỆN — Novel Guardian v1.0
// ══════════════════════════════════════════════════════════

// 5 cấp nhịp
const PACING_LEVELS = {
  TINH: { min: 1.0, max: 1.9, label: 'TĨNH', emoji: '░' },
  DANG: { min: 2.0, max: 2.9, label: 'DÂNG', emoji: '▒' },
  CANG: { min: 3.0, max: 3.9, label: 'CĂNG', emoji: '▓' },
  CAO_TRAO: { min: 4.0, max: 4.9, label: 'CAO TRÀO', emoji: '█' },
  HA_NHIET: { min: 5.0, max: 5.9, label: 'HẠ NHIỆT', emoji: '░' }
};

// Từ khoá theo cấp (đã mở rộng)
const KEYWORDS = {
  TINH: {
    words: ['bình thường', 'ngồi', 'nghĩ', 'nhớ', 'nằm', 'thở', 'yên tĩnh',
      'thiền', 'hồi tưởng', 'ngắm', 'lặng', 'bình yên', 'thư thái', 'thong thả',
      'nhàn', 'uống trà', 'tản bộ', 'mơ màng', 'trầm ngâm', 'suy tư',
      'ngủ', 'tỉnh dậy', 'ăn sáng', 'ăn cơm', 'nghỉ chân'],
    weight: 1.0
  },
  DANG: {
    words: ['phát hiện', 'lạ', 'nghi ngờ', 'theo dõi', 'tìm', 'manh mối',
      'dò xét', 'cảnh giác', 'bất thường', 'bí ẩn', 'tin đồn', 'khám phá',
      'điều tra', 'thăm dò', 'dấu vết', 'mùi tanh', 'linh cảm', 'rình',
      'đề phòng', 'có gì đó', 'không ổn', 'kỳ lạ'],
    weight: 2.0
  },
  CANG: {
    words: ['đối đầu', 'xung đột', 'quyết định', 'nguy hiểm', 'đe doạ',
      'tranh cãi', 'ép buộc', 'tức giận', 'căng thẳng', 'đàm phán', 'thách thức',
      'đòi', 'gằn giọng', 'nghiến răng', 'nắm chặt', 'lừa', 'phản bội',
      'áp lực', 'thúc ép', 'chọn lựa', 'tiến thoái lưỡng nan'],
    weight: 3.0
  },
  CAO_TRAO: {
    words: ['chiến đấu', 'giết', 'bùng nổ', 'twist', 'sốc', 'chết',
      'máu', 'kiếm', 'đánh', 'nổ', 'phá', 'tiêu diệt', 'quyết chiến',
      'sinh tử', 'bại lộ', 'tiết lộ', 'sự thật', 'phản kích', 'tuyệt chiêu',
      'biến', 'loạn', 'đại chiến', 'tử chiến', 'vỡ', 'sụp đổ'],
    weight: 4.0
  },
  HA_NHIET: {
    words: ['kết thúc', 'trở về', 'hiểu ra', 'tha thứ',
      'chữa', 'hồi phục', 'nghỉ ngơi', 'nhìn lại', 'rút kinh nghiệm',
      'trưởng thành', 'cảm ơn', 'nước mắt', 'ôm', 'cười nhẹ', 'bình minh',
      'lên đường tiếp', 'từ biệt', 'aftermath', 'bài học'],
    weight: 1.5 // Hạ nhiệt = nhịp THẤP, weight thấp → score thấp
  }
};

/**
 * Tính điểm nhịp cho 1 đoạn text
 */
export function calculatePacing(text) {
  if (!text || text.trim().length === 0) return { score: 1.5, level: 'TINH' };

  const lowerText = text.toLowerCase();
  let totalWeight = 0;
  let totalCount = 0;
  const foundKeywords = {};

  for (const [level, { words, weight }] of Object.entries(KEYWORDS)) {
    let count = 0;
    for (const word of words) {
      const regex = new RegExp(word, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    if (count > 0) {
      foundKeywords[level] = count;
      totalWeight += weight * count;
      totalCount += count;
    }
  }

  // Điểm từ khoá
  let score = totalCount > 0 ? totalWeight / totalCount : 1.5;

  // Phát hiện HẠ NHIỆT đặc biệt: nếu chủ yếu HA_NHIET keywords
  // và ít CAO_TRAO/CANG → override thành score thấp
  const haHas = foundKeywords['HA_NHIET'] || 0;
  const caoHas = foundKeywords['CAO_TRAO'] || 0;
  const cangHas = foundKeywords['CANG'] || 0;
  if (haHas >= 3 && caoHas === 0 && cangHas === 0) {
    score = Math.min(score, 1.8); // Clamp xuống vùng TĨNH/HẠ NHIỆT
  }

  // Điểm cấu trúc bổ sung
  const structural = analyzeStructure(text);
  score += structural.bonus;

  // Clamp vào khoảng 1.0–5.0
  score = Math.max(1.0, Math.min(5.0, score));
  score = Math.round(score * 10) / 10;

  // Xác định cấp: HẠ NHIỆT riêng biệt
  const isHaNhiet = haHas >= 3 && caoHas === 0 && cangHas === 0;
  const level = isHaNhiet ? 'HA_NHIET' : scoreToLevel(score);

  return {
    score,
    level,
    keywords: foundKeywords,
    structural
  };
}

/**
 * Phân tích cấu trúc text
 */
function analyzeStructure(text) {
  const words = countWords(text);
  const sentences = text.split(/[.!?…]+/).filter(s => s.trim().length > 0);
  const avgLen = sentences.length > 0 ? words / sentences.length : 0;

  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const ellipsis = (text.match(/\.{3}|…/g) || []).length;
  const shortSentences = sentences.filter(s => countWords(s) <= 6).length;

  let bonus = 0;
  const signals = [];

  // Nhiều câu cảm thán + câu ngắn → căng/cao trào
  if (exclamations >= 3 && shortSentences / sentences.length > 0.4) {
    bonus += 0.3;
    signals.push('Nhiều cảm thán + câu ngắn → tăng nhịp');
  }

  // Nhiều câu hỏi liên tiếp → căng
  if (questions >= 3) {
    bonus += 0.2;
    signals.push('Nhiều câu hỏi → tăng nhịp');
  }

  // Beat dài + ít dấu câu → tĩnh
  if (words > 400 && exclamations < 2 && questions < 2) {
    bonus -= 0.2;
    signals.push('Beat dài + ít dấu → giảm nhịp');
  }

  // Nhiều dấu ba chấm → hạ nhiệt
  if (ellipsis >= 3) {
    bonus -= 0.15;
    signals.push('Nhiều ba chấm → giảm nhịp');
  }

  return { bonus: Math.round(bonus * 100) / 100, signals };
}

/**
 * Chuyển điểm → cấp
 */
function scoreToLevel(score) {
  // HẠ NHIỆT ≥5.0 thực ra là cấp riêng — xử lý đặc biệt
  // Vì keyword weight 5.0, nếu toàn HẠ NHIỆT keywords → score ~5.0
  if (score >= 5.0) return 'HA_NHIET';
  if (score >= 4.0) return 'CAO_TRAO';
  if (score >= 3.0) return 'CANG';
  if (score >= 2.0) return 'DANG';
  return 'TINH';
}

/**
 * Phân tích nhịp cho toàn bộ chương (tách theo beat)
 */
export function analyzeChapterPacing(text, chapterNumber = 0) {
  // Tách beats: dùng dấu ngắt đoạn hoặc chia đều
  const beats = splitIntoBeats(text);

  const beatResults = beats.map((beatText, idx) => {
    const pacing = calculatePacing(beatText);
    return {
      beat: idx + 1,
      score: pacing.score,
      level: pacing.level,
      keywords: Object.keys(pacing.keywords),
      wordCount: countWords(beatText)
    };
  });

  // Thống kê chương
  const scores = beatResults.map(b => b.score);
  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 1.5;

  const peakBeat = beatResults.reduce((max, b) => b.score > max.score ? b : max, beatResults[0]);

  return {
    chapter: chapterNumber,
    beats: beatResults,
    chapterScore: avgScore,
    chapterLevel: scoreToLevel(avgScore),
    peakBeat: peakBeat?.beat || 1,
    peakScore: peakBeat?.score || 1.5,
    wordCount: countWords(text),
    analyzedAt: dateNow()
  };
}

/**
 * Tách text thành beats (đoạn)
 * Ưu tiên: dấu ngắt cảnh (===, ---, ***) → đoạn trống → chia đều
 */
function splitIntoBeats(text) {
  // Thử tách bằng dấu ngắt cảnh
  const sceneBreaks = text.split(/\n\s*(?:[=*-]{3,})\s*\n/);
  if (sceneBreaks.length >= 3) {
    return sceneBreaks.filter(b => b.trim().length > 20);
  }

  // Thử tách bằng dòng trống đôi
  const paragraphs = text.split(/\n\s*\n\s*\n/);
  if (paragraphs.length >= 3) {
    return paragraphs.filter(b => b.trim().length > 20);
  }

  // Chia đều ~400-600 từ/beat
  const words = text.split(/\s+/);
  const beatSize = 500; // target từ/beat
  const beats = [];
  for (let i = 0; i < words.length; i += beatSize) {
    const beatWords = words.slice(i, i + beatSize);
    const beatText = beatWords.join(' ');
    if (beatText.trim().length > 20) {
      beats.push(beatText);
    }
  }

  return beats.length > 0 ? beats : [text];
}

/**
 * Phân tích toàn bộ project → biểu đồ nhịp
 */
export function analyzeProjectPacing(chaptersDir, pacingDir) {
  ensureDir(pacingDir);
  const files = listMarkdownFiles(chaptersDir);
  const results = [];

  for (const file of files) {
    const text = readMarkdown(file);
    const match = file.match(/(?:ch|chuong|chương)[._-]?(\d+)/i);
    const chapterNum = match ? parseInt(match[1]) : 0;
    if (chapterNum === 0) continue;

    const analysis = analyzeChapterPacing(text, chapterNum);
    results.push(analysis);

    // Lưu JSON
    writeJSON(join(pacingDir, `ch${chapterNum}.json`), analysis);
  }

  results.sort((a, b) => a.chapter - b.chapter);

  // Phát hiện khuôn mẫu
  const patterns = detectPacingPatterns(results);

  return { chapters: results, patterns };
}

/**
 * Phát hiện khuôn mẫu nhịp (xấu + tốt)
 */
export function detectPacingPatterns(chapterResults) {
  const patterns = [];
  const levels = chapterResults.map(c => c.chapterLevel);

  // Đơn điệu: ≥3 chương cùng cấp
  for (let i = 0; i <= levels.length - 3; i++) {
    if (levels[i] === levels[i + 1] && levels[i + 1] === levels[i + 2]) {
      patterns.push({
        type: 'monotone',
        severity: 'warning',
        chapters: [chapterResults[i].chapter, chapterResults[i + 2].chapter],
        message: `Đơn điệu: ${PACING_LEVELS[levels[i]]?.label || levels[i]} × 3 chương liên tiếp (Ch.${chapterResults[i].chapter}–${chapterResults[i + 2].chapter})`
      });
    }
  }

  // Thiếu hạ nhiệt: CAO_TRAO liên tiếp
  for (let i = 0; i < levels.length - 1; i++) {
    if (levels[i] === 'CAO_TRAO' && levels[i + 1] === 'CAO_TRAO') {
      patterns.push({
        type: 'missing-cooldown',
        severity: 'warning',
        chapters: [chapterResults[i].chapter, chapterResults[i + 1].chapter],
        message: `Thiếu hạ nhiệt: CAO TRÀO liên tiếp (Ch.${chapterResults[i].chapter}–${chapterResults[i + 1].chapter})`
      });
    }
  }

  // Nhảy nhịp: TĨNH → CAO_TRAO trực tiếp
  for (let i = 0; i < levels.length - 1; i++) {
    if (levels[i] === 'TINH' && levels[i + 1] === 'CAO_TRAO') {
      patterns.push({
        type: 'jump',
        severity: 'note',
        chapters: [chapterResults[i].chapter, chapterResults[i + 1].chapter],
        message: `Nhảy nhịp: TĨNH → CAO TRÀO (Ch.${chapterResults[i].chapter}→${chapterResults[i + 1].chapter})`
      });
    }
  }

  // Sóng chuẩn: TĨNH → DÂNG → CĂNG → CAO TRÀO → HẠ NHIỆT
  const wavePattern = ['TINH', 'DANG', 'CANG', 'CAO_TRAO', 'HA_NHIET'];
  for (let i = 0; i <= levels.length - 5; i++) {
    const slice = levels.slice(i, i + 5);
    if (JSON.stringify(slice) === JSON.stringify(wavePattern)) {
      patterns.push({
        type: 'perfect-wave',
        severity: 'good',
        chapters: [chapterResults[i].chapter, chapterResults[i + 4].chapter],
        message: `Sóng chuẩn: Ch.${chapterResults[i].chapter}–${chapterResults[i + 4].chapter} ✅`
      });
    }
  }

  // Leo thang: mỗi CAO_TRAO cao hơn trước
  const climaxes = chapterResults.filter(c => c.chapterLevel === 'CAO_TRAO');
  for (let i = 1; i < climaxes.length; i++) {
    if (climaxes[i].peakScore > climaxes[i - 1].peakScore) {
      patterns.push({
        type: 'escalation',
        severity: 'good',
        chapters: [climaxes[i - 1].chapter, climaxes[i].chapter],
        message: `Leo thang: Ch.${climaxes[i - 1].chapter} (${climaxes[i - 1].peakScore}) → Ch.${climaxes[i].chapter} (${climaxes[i].peakScore}) ✅`
      });
    }
  }

  return patterns;
}

/**
 * Tạo biểu đồ ASCII
 */
export function generatePacingChart(chapterResults) {
  let chart = '# Nhịp Truyện\n\n';

  for (const ch of chapterResults) {
    const barLength = Math.round(ch.chapterScore * 2);
    const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
    const levelInfo = PACING_LEVELS[ch.chapterLevel] || { label: ch.chapterLevel };
    const stars = ch.chapterLevel === 'CAO_TRAO'
      ? ' ★'.repeat(Math.min(3, Math.round(ch.peakScore - 3.5)))
      : '';

    chart += `Ch.${String(ch.chapter).padStart(2, '0')}: ${bar} ${levelInfo.label.padEnd(10)} (${ch.chapterScore})${stars}\n`;
  }

  return chart;
}
