import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

// ══════════════════════════════════════════
// TIỆN ÍCH DÙNG CHUNG — Novel Guardian v1.0
// ══════════════════════════════════════════

/**
 * Tạo slug từ chuỗi tiếng Việt
 * "Trần Huyền Trang" → "tran-huyen-trang"
 */
export function slugify(text) {
  if (!text) return '';
  const map = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
    'ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
    'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'đ':'d',
    'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
    'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
    'ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
    'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
    'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
    'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
    'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y'
  };
  return text
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Lấy thời gian hiện tại dạng ISO
 */
export function dateNow() {
  return new Date().toISOString();
}

/**
 * Đảm bảo thư mục tồn tại (tạo nếu chưa có)
 */
export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Đọc file JSON, trả null nếu không tồn tại
 */
export function readJSON(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`⚠️ Lỗi đọc JSON: ${filePath} — ${err.message}`);
    return null;
  }
}

/**
 * Ghi file JSON (tự tạo thư mục cha)
 */
export function writeJSON(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

/**
 * Đọc file Markdown, trả chuỗi rỗng nếu không tồn tại
 */
export function readMarkdown(filePath) {
  if (!existsSync(filePath)) return '';
  return readFileSync(filePath, 'utf-8');
}

/**
 * Liệt kê tất cả file JSON trong thư mục
 */
export function listJSONFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter(f => extname(f) === '.json')
    .map(f => join(dirPath, f));
}

/**
 * Liệt kê tất cả file Markdown trong thư mục
 */
export function listMarkdownFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter(f => extname(f) === '.md')
    .sort((a, b) => {
      // Sắp xếp theo số chương nếu có
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    })
    .map(f => join(dirPath, f));
}

/**
 * Di chuyển file (dùng cho xoá mềm → archive)
 */
export function moveFile(from, to) {
  ensureDir(dirname(to));
  renameSync(from, to);
  return to;
}

/**
 * Tính thống kê cơ bản cho mảng số
 */
export function calculateStats(numbers) {
  if (!numbers || numbers.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, sum: 0, median: 0 };
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    sum,
    median
  };
}

/**
 * Đếm từ trong chuỗi tiếng Việt
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Đếm câu trong chuỗi (tách bằng . ! ?)
 */
export function countSentences(text) {
  if (!text) return 0;
  // Normalize ellipsis: … → . và ... → . trước khi split
  const normalized = text.replace(/…/g, '.').replace(/\.{2,}/g, '.');
  return normalized.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

/**
 * Tách đối thoại từ văn bản
 * Trả về mảng { line, speaker? }
 */
export function extractDialogues(text) {
  const dialogues = [];

  // Mẫu 1: Ngoặc kép (cả Unicode và ASCII)
  const quoteRegex = /["""]([^"""]+)["""]/g;
  let match;
  while ((match = quoteRegex.exec(text)) !== null) {
    const line = match[1].trim();
    if (line.length > 2) {
      // Tìm người nói trong 60 ký tự trước
      const before = text.substring(Math.max(0, match.index - 60), match.index);
      const speakerMatch = before.match(/([\p{L}][\p{L}\s]{1,15})\s*(?:nói|hỏi|gào|thét|cười|khẽ|lầm bầm|gằn giọng|thì thào|đáp|quát|rít|thở dài)/u);
      dialogues.push({
        line,
        speaker: speakerMatch ? speakerMatch[1].trim() : null,
        index: match.index
      });
    }
  }

  // Mẫu 2: Gạch đầu dòng
  const dashRegex = /^[—–]\s*(.+)$/gm;
  while ((match = dashRegex.exec(text)) !== null) {
    const line = match[1].trim();
    if (line.length > 2 && !dialogues.some(d => d.line === line)) {
      dialogues.push({
        line,
        speaker: null,
        index: match.index
      });
    }
  }

  return dialogues;
}

/**
 * Xác thực entity theo schema cơ bản
 * Trả về { valid: boolean, errors: string[] }
 */
export function validateEntity(entity, requiredFields) {
  const errors = [];
  for (const field of requiredFields) {
    if (entity[field] === undefined || entity[field] === null || entity[field] === '') {
      errors.push(`Thiếu trường bắt buộc: ${field}`);
    }
  }
  if (entity.id && !/^[a-z0-9-]+$/.test(entity.id)) {
    errors.push(`ID không hợp lệ: "${entity.id}" — chỉ cho phép a-z, 0-9, dấu gạch ngang`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Tạo entity mới với metadata
 */
export function createEntityBase(id, type) {
  const now = dateNow();
  return {
    schemaVersion: '1.0',
    id,
    type,
    createdAt: now,
    updatedAt: now
  };
}
