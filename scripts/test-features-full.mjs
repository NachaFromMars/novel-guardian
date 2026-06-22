#!/usr/bin/env node
/**
 * FEATURE REVIEW — Novel Guardian v1.0
 * 44 tests covering Bible, Scanner, Pacing, Style, CLI
 */

import { BibleManager } from './lib/bible.mjs';
import { ContinuityScanner } from './lib/scanner.mjs';
import { calculatePacing, analyzeChapterPacing, detectPacingPatterns, generatePacingChart } from './lib/pacing-analyzer.mjs';
import { analyzeStyle, compareStyles, detectStyleDrift, buildBaseline } from './lib/style-analyzer.mjs';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// ─── Test Framework ───
let totalPass = 0;
let totalFail = 0;
const results = {};

function test(section, name, fn) {
  if (!results[section]) results[section] = [];
  try {
    const ok = fn();
    if (ok) {
      results[section].push({ name, pass: true, note: '' });
      totalPass++;
    } else {
      results[section].push({ name, pass: false, note: 'Assertion failed' });
      totalFail++;
    }
  } catch (err) {
    results[section].push({ name, pass: false, note: err.message.substring(0, 120) });
    totalFail++;
  }
}

function cleanDir(dir) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

// ═══════════════════════════════════════
// 1. BIBLE MANAGER (10 tests)
// ═══════════════════════════════════════

const bibleDir = '/tmp/ng-feat-bible';
cleanDir(bibleDir);
const bible = new BibleManager(bibleDir);

test('Bible Manager', 'Tạo character với name, status, aliases, firstAppearance', () => {
  const c = bible.create('character', {
    name: 'Trần Huyền Trang',
    aliases: ['Đường Tam Tạng', 'Tam Tạng'],
    status: 'alive',
    firstAppearance: { chapter: 1, beat: 1 },
    attributes: { role: 'protagonist', cultivation: 'Luyện Khí tầng 3' }
  });
  return c.id === 'tran-huyen-trang' && c.status === 'alive' && c.aliases.length === 2 && c.firstAppearance.chapter === 1;
});

test('Bible Manager', 'Tạo location với name, significance', () => {
  const l = bible.create('location', {
    name: 'Trường An',
    description: 'Kinh đô Đại Đường',
    significance: 'major'
  });
  return l.id === 'truong-an' && l.significance === 'major';
});

test('Bible Manager', 'Tạo faction, item, event', () => {
  const f = bible.create('faction', { name: 'Đại Đường', description: 'Triều đại phong kiến' });
  const i = bible.create('item', { name: 'Cà Sa Quan Âm', owner: 'tran-huyen-trang', status: 'active' });
  const e = bible.create('event', { name: 'Khởi hành thỉnh kinh', chapter: 5 });
  return f.type === 'faction' && i.type === 'item' && e.type === 'event' && e.chapter === 5;
});

test('Bible Manager', 'List entities (all + filtered by type)', () => {
  const all = bible.list();
  const chars = bible.list('character');
  const locs = bible.list('location');
  return all.length === 5 && chars.length === 1 && locs.length === 1;
});

test('Bible Manager', 'Search by keyword', () => {
  const r1 = bible.search('Đường');
  const r2 = bible.search('xyz-nonsense');
  return r1.length >= 2 && r2.length === 0;
});

test('Bible Manager', 'Get by type + id', () => {
  const c = bible.get('character', 'tran-huyen-trang');
  const l = bible.get('location', 'truong-an');
  return c.name === 'Trần Huyền Trang' && l.name === 'Trường An';
});

test('Bible Manager', 'Xử lý duplicate ID → error', () => {
  try {
    bible.create('character', { name: 'Trần Huyền Trang', status: 'alive' });
    return false; // should not reach
  } catch (err) {
    return err.message.includes('đã tồn tại');
  }
});

test('Bible Manager', 'Index cập nhật đúng', () => {
  const idx = bible.getIndex();
  return idx.entities.characters === 1 && idx.entities.locations === 1 &&
         idx.entities.factions === 1 && idx.entities.items === 1 && idx.entities.events === 1;
});

test('Bible Manager', 'Export markdown format', () => {
  const md = bible.exportBible('md');
  return typeof md === 'string' && md.includes('Kinh Điển') && md.includes('Trần Huyền Trang') && md.includes('Trường An');
});

test('Bible Manager', 'Export JSON format', () => {
  const json = bible.exportBible('json');
  return typeof json === 'object' && Array.isArray(json.characters) && json.characters.length === 1 &&
         Array.isArray(json.locations) && json.locations.length === 1;
});

// ═══════════════════════════════════════
// 2. CONTINUITY SCANNER (10 tests)
// ═══════════════════════════════════════

const scanBase = '/tmp/ng-feat-scan';
cleanDir(scanBase);
const scanData = join(scanBase, 'data');
const scanChaps = join(scanBase, 'chapters');
mkdirSync(scanChaps, { recursive: true });

// Setup Bible for scanner
const scanBible = new BibleManager(scanData);
scanBible.create('character', {
  name: 'Trần Huyền Trang', aliases: ['Tam Tạng'], status: 'alive',
  firstAppearance: { chapter: 1, beat: 1 }, attributes: { role: 'protagonist' }
});
scanBible.create('character', {
  name: 'Bạch Cốt Tinh', status: 'dead', firstAppearance: { chapter: 3, beat: 1 }
});
scanBible.create('character', {
  name: 'Ngộ Không', aliases: ['Tề Thiên'], status: 'sealed',
  firstAppearance: { chapter: 1, beat: 1 }
});
scanBible.create('location', { name: 'Trường An', significance: 'major' });
scanBible.create('location', { name: 'Ngũ Hành Sơn', significance: 'major' });
scanBible.create('item', {
  name: 'Thiết Bổng', owner: 'ngo-khong', status: 'active',
  aliases: ['Như Ý Kim Cô Bổng']
});

// Ch1: T01 test — time goes backward
writeFileSync(join(scanChaps, 'ch01.md'), `# Chương 1
Buổi chiều, Trần Huyền Trang đi dạo ở Trường An.
Rồi buổi sáng, anh lại ra chợ mua đồ.
Ban đêm, ngồi thiền luyện công.
`, 'utf-8');

// Ch2: T02 test — night→morning without transition
writeFileSync(join(scanChaps, 'ch02.md'), `# Chương 2
Ban đêm, Tam Tạng ngồi thiền một mình.
Đêm khuya lạnh lẽo.
Bình minh ló dạng, sáng sớm chim hót.
`, 'utf-8');

// Ch3: T03 test — instant teleport
writeFileSync(join(scanChaps, 'ch03.md'), `# Chương 3
Tại Trường An mọi thứ yên bình. Bỗng Ngũ Hành Sơn rung chuyển.
Buổi sáng, Tam Tạng lên đường.
`, 'utf-8');

// Ch4: C01 test — dead character appears
writeFileSync(join(scanChaps, 'ch04.md'), `# Chương 4
Bạch Cốt Tinh bước ra từ bóng tối, mỉm cười lạnh lùng.
Buổi sáng, mọi người hoảng loạn.
`, 'utf-8');

// Ch5: C01 flashback — dead character in flashback context (should NOT flag)
writeFileSync(join(scanChaps, 'ch05.md'), `# Chương 5
Tam Tạng nhớ lại ngày xưa, khi Bạch Cốt Tinh còn sống.
Anh kể về cuộc chiến năm ấy.
Buổi sáng, thiền định.
`, 'utf-8');

// Ch6: C02 test — sealed character acts
writeFileSync(join(scanChaps, 'ch06.md'), `# Chương 6
Ngộ Không đánh quát lên: "Để ta chiến đấu!"
Tề Thiên tấn công kẻ thù dữ dội.
`, 'utf-8');

// Ch7: W02 test — item wrong owner
writeFileSync(join(scanChaps, 'ch07.md'), `# Chương 7
Tam Tạng cầm Thiết Bổng lên, múa loạn xạ. Trần Huyền Trang vung Như Ý Kim Cô Bổng.
`, 'utf-8');

// Ch8-12: P04 test — excessive open conflicts
writeFileSync(join(scanChaps, 'ch08.md'), `# Chương 8
Thù hận. Truy đuổi. Đối đầu. Tranh chấp. Bí ẩn chưa giải.
Phản bội. Chiến tranh. Mâu thuẫn. Kẻ thù. Đe doạ.
Truy sát. Trốn chạy. Phục kích. Thách đấu. Huyết thù.
`, 'utf-8');
writeFileSync(join(scanChaps, 'ch09.md'), `# Chương 9
Thù hận dâng trào. Truy đuổi không ngừng. Đối đầu kịch liệt.
Kẻ thù đe doạ. Phục kích. Huyết thù. Chiến tranh nổ ra.
`, 'utf-8');
writeFileSync(join(scanChaps, 'ch10.md'), `# Chương 10
Truy sát tiếp. Đối đầu. Tranh chấp. Đe doạ. Phản bội.
Kẻ thù mới xuất hiện. Thách đấu. Mâu thuẫn.
`, 'utf-8');
writeFileSync(join(scanChaps, 'ch11.md'), `# Chương 11
Huyết thù. Truy đuổi. Chiến tranh. Phục kích. Trốn chạy.
Kẻ thù bủa vây. Đối đầu tổng lực. Mâu thuẫn.
`, 'utf-8');
writeFileSync(join(scanChaps, 'ch12.md'), `# Chương 12
Thù hận chồng chất. Đe doạ. Truy sát. Phản bội. Phục kích.
`, 'utf-8');

const scanner = new ContinuityScanner(scanData, scanChaps);

test('Continuity Scanner', 'T01: Phát hiện thời gian lùi lại', () => {
  const r = scanner.scanChapter(1);
  const t01 = r.issues.filter(i => i.ruleId === 'T01');
  return t01.length > 0 && t01[0].message.includes('lùi lại');
});

test('Continuity Scanner', 'T02: Phát hiện nhảy ngày', () => {
  const r = scanner.scanChapter(2);
  const t02 = r.issues.filter(i => i.ruleId === 'T02');
  return t02.length > 0 && t02[0].message.includes('đêm sang sáng');
});

test('Continuity Scanner', 'T03: Phát hiện dịch chuyển tức thời', () => {
  const r = scanner.scanChapter(3);
  const t03 = r.issues.filter(i => i.ruleId === 'T03');
  return t03.length > 0 && t03[0].message.includes('Chuyển địa danh nhanh');
});

test('Continuity Scanner', 'C01: Phát hiện nhân vật chết sống lại', () => {
  const r = scanner.scanChapter(4);
  const c01 = r.issues.filter(i => i.ruleId === 'C01');
  return c01.length > 0 && c01[0].message.includes('Bạch Cốt Tinh') && c01[0].severity === 'critical';
});

test('Continuity Scanner', 'C01 flashback: KHÔNG báo lỗi khi flashback', () => {
  const r = scanner.scanChapter(5);
  const c01 = r.issues.filter(i => i.ruleId === 'C01');
  return c01.length === 0; // Should NOT flag in flashback context
});

test('Continuity Scanner', 'C02: Phát hiện phong ấn vẫn hành động', () => {
  const r = scanner.scanChapter(6);
  const c02 = r.issues.filter(i => i.ruleId === 'C02');
  return c02.length > 0 && c02[0].message.includes('phong ấn');
});

test('Continuity Scanner', 'W02: Phát hiện vật phẩm trùng chủ', () => {
  const r = scanner.scanChapter(7);
  const w02 = r.issues.filter(i => i.ruleId === 'W02');
  return w02.length > 0;
});

test('Continuity Scanner', 'P04: Phát hiện xung đột mở tràn', () => {
  const r = scanner.scanChapter(12);
  const p04 = r.issues.filter(i => i.ruleId === 'P04');
  return p04.length > 0 && p04[0].message.includes('xung đột');
});

test('Continuity Scanner', 'Scan all chapters → báo cáo tổng hợp', () => {
  const r = scanner.scanAll();
  return r.totalChapters === 12 && r.summary !== null && r.summary.totalIssues > 0 &&
         r.chapters.length === 12;
});

test('Continuity Scanner', 'Điểm liền mạch tính đúng', () => {
  const r = scanner.scanAll();
  const s = r.summary;
  // score = 100 - (critical*10 + warning*3 + note*1), clamped 0-100
  const expectedPenalty = s.critical * 10 + s.warnings * 3 + s.notes * 1;
  const expectedScore = Math.max(0, Math.min(100, 100 - expectedPenalty));
  return s.score === expectedScore && typeof s.grade === 'string' && ['A','B','C','D','F'].includes(s.grade);
});

// ═══════════════════════════════════════
// 3. PACING ANALYZER (8 tests)
// ═══════════════════════════════════════

test('Pacing Analyzer', 'Đoạn TĨNH → score 1.0-1.9', () => {
  const r = calculatePacing('Huyền Trang ngồi thiền, trầm ngâm suy tư. Cảnh vật yên tĩnh, bình yên lạ thường. Anh uống trà, nhàn nhã thong thả thư thái.');
  return r.score >= 1.0 && r.score <= 1.9 && r.level === 'TINH';
});

test('Pacing Analyzer', 'Đoạn DÂNG → score 2.0-2.9', () => {
  const r = calculatePacing('Phát hiện manh mối lạ. Nghi ngờ dấu vết bất thường. Cảnh giác dò xét bí ẩn. Linh cảm cho biết có điều không ổn. Theo dõi.');
  return r.score >= 2.0 && r.score <= 2.9 && r.level === 'DANG';
});

test('Pacing Analyzer', 'Đoạn CĂNG → score 3.0-3.9', () => {
  const r = calculatePacing('Đối đầu kịch liệt! Xung đột dữ dội! Căng thẳng tột độ! Đàm phán thất bại! Nghiến răng. Áp lực. Thách thức. Gằn giọng.');
  return r.score >= 3.0 && r.score <= 3.9 && r.level === 'CANG';
});

test('Pacing Analyzer', 'Đoạn CAO TRÀO → score 4.0-4.9', () => {
  const r = calculatePacing('Đại chiến bùng nổ! Kiếm chém! Máu đổ! Tử chiến! Tuyệt chiêu phản kích! Sự thật bại lộ! Tiêu diệt! Quyết chiến sinh tử!');
  return r.score >= 4.0 && r.score <= 4.9 && r.level === 'CAO_TRAO';
});

test('Pacing Analyzer', 'Đoạn HẠ NHIỆT → phát hiện đúng', () => {
  const r = calculatePacing('Trận chiến kết thúc. Hồi phục nghỉ ngơi. Nhìn lại bài học, rút kinh nghiệm. Nước mắt. Từ biệt. Lên đường tiếp. Trưởng thành.');
  return r.level === 'HA_NHIET';
});

test('Pacing Analyzer', 'Phân tích chương → beats + peak', () => {
  const text = `Ngồi thiền yên tĩnh bình yên thong thả nhàn nhã mơ màng.

===

Phát hiện manh mối lạ nghi ngờ cảnh giác dò xét bí ẩn bất thường.

===

Đối đầu xung đột căng thẳng đàm phán thất bại nghiến răng áp lực.

===

Đại chiến bùng nổ kiếm chém máu tử chiến tuyệt chiêu phản kích sốc!

===

Kết thúc hồi phục nghỉ ngơi nhìn lại bài học từ biệt lên đường tiếp.`;
  const r = analyzeChapterPacing(text, 1);
  return r.beats.length >= 3 && r.peakBeat > 0 && r.peakScore > 1.0 && r.chapterScore > 0;
});

test('Pacing Analyzer', 'Pattern: phát hiện đơn điệu', () => {
  const mono = [
    { chapter: 1, chapterLevel: 'TINH', chapterScore: 1.5, peakScore: 1.8 },
    { chapter: 2, chapterLevel: 'TINH', chapterScore: 1.4, peakScore: 1.7 },
    { chapter: 3, chapterLevel: 'TINH', chapterScore: 1.3, peakScore: 1.6 },
  ];
  const p = detectPacingPatterns(mono);
  return p.some(x => x.type === 'monotone');
});

test('Pacing Analyzer', 'Pattern: phát hiện sóng chuẩn', () => {
  const wave = [
    { chapter: 1, chapterLevel: 'TINH', chapterScore: 1.5, peakScore: 1.8 },
    { chapter: 2, chapterLevel: 'DANG', chapterScore: 2.3, peakScore: 2.8 },
    { chapter: 3, chapterLevel: 'CANG', chapterScore: 3.2, peakScore: 3.5 },
    { chapter: 4, chapterLevel: 'CAO_TRAO', chapterScore: 4.2, peakScore: 4.5 },
    { chapter: 5, chapterLevel: 'HA_NHIET', chapterScore: 1.8, peakScore: 2.0 },
  ];
  const p = detectPacingPatterns(wave);
  return p.some(x => x.type === 'perfect-wave');
});

// ═══════════════════════════════════════
// 4. STYLE ANALYZER (8 tests)
// ═══════════════════════════════════════

test('Style Analyzer', 'Đếm từ đúng', () => {
  const s = analyzeStyle('Một hai ba bốn năm sáu bảy tám chín mười.');
  // "mười." counts as 1 token when split by whitespace → 10 tokens
  return s.wordCount === 10;
});

test('Style Analyzer', 'Đếm câu đúng', () => {
  const s = analyzeStyle('Câu một. Câu hai? Câu ba!');
  return s.sentenceCount === 3;
});

test('Style Analyzer', 'Tỷ lệ đối thoại đúng', () => {
  const s = analyzeStyle('"Xin chào" Tam Tạng nói. "Tạm biệt" Ngộ Không hỏi. Đoạn tường thuật dài dài dài dài.');
  return s.dialogue.count >= 1 && s.dialogue.wordRatio > 0 && s.dialogue.wordRatio < 1;
});

test('Style Analyzer', 'Phát hiện giọng hiện đại vs cổ kính', () => {
  const modern = analyzeStyle('Bug, nerf, buff, meta game, level boss server wifi online trend update lol gg ok. Bug nerf buff.');
  const archaic = analyzeStyle('Ngài, ngươi, thưa, bẩm, phụ thân, mẫu thân, đại nhân, tại hạ, các hạ, bệ hạ, thánh thượng. Ngài ngươi thưa bẩm.');
  return modern.vocabulary.dominantTone === 'hiện đại' && archaic.vocabulary.dominantTone === 'cổ kính';
});

test('Style Analyzer', 'Baseline tự động', () => {
  const s1 = analyzeStyle('Đoạn văn bình thường. Nhiều câu. Ngắn gọn? Có cảm thán! Và ba chấm...');
  const s2 = analyzeStyle('Thêm đoạn văn nữa. Cũng bình thường. Nhiều câu. Ngắn? Vâng! OK...');
  const baseline = buildBaseline([s1, s2]);
  return baseline !== null && typeof baseline.avgSentenceLength === 'number' && typeof baseline.vocabulary.dominantTone === 'string';
});

test('Style Analyzer', 'Drift detection (lệch ≥20%)', () => {
  const normal = analyzeStyle('Tuy nhiên, mặc dù, do đó, hơn nữa, ngoài ra. Nhận thấy rằng đánh giá tổng quan phân tích kết luận. Bệ hạ thánh thượng.');
  const wild = analyzeStyle('Đéo hiểu. Bug lol gg ok. Mẹ nó chết mẹ cứt. Ha ha pfft buồn cười. Trêu nhạo đùa hài lố bịch.');
  const drift = detectStyleDrift(wild, normal, 20);
  return drift.drifted === true && drift.similarity < 80;
});

test('Style Analyzer', 'compareStyles hoạt động', () => {
  const s1 = analyzeStyle('Huyền Trang ngồi thiền, yên lặng suy tư. Cảnh vật bình yên.');
  const s2 = analyzeStyle('Huyền Trang ngồi thiền, yên lặng suy tư. Cảnh vật bình yên.');
  const same = compareStyles(s1, s2);
  const s3 = analyzeStyle('Đéo hiểu bug lol. Ha ha pfft buồn cười! Ngu??? Mẹ nó!!!');
  const diff = compareStyles(s1, s3);
  return same > diff && same > 50;
});

test('Style Analyzer', 'Xử lý text trống không crash', () => {
  const empty = analyzeStyle('');
  const nil = analyzeStyle(null);
  return empty === null && nil === null;
});

// ═══════════════════════════════════════
// 5. CLI (8 tests)
// ═══════════════════════════════════════

const cliScript = join(process.cwd(), 'novel-guardian.mjs');
const cliProject = '/tmp/ng-feat-cli';
cleanDir(cliProject);

function runCLI(cmdArgs) {
  try {
    return execSync(`node ${cliScript} ${cmdArgs}`, {
      cwd: cliProject,
      encoding: 'utf-8',
      timeout: 15000,
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    });
  } catch (err) {
    return err.stdout || err.stderr || err.message;
  }
}

test('CLI', '`init` tạo đúng cấu trúc', () => {
  const out = runCLI('init --name "Test Novel"');
  const hasGuardian = existsSync(join(cliProject, 'guardian.json'));
  const hasData = existsSync(join(cliProject, 'data'));
  const hasChapters = existsSync(join(cliProject, 'chapters'));
  return out.includes('khởi tạo') && hasGuardian && hasData && hasChapters;
});

test('CLI', '`status` hiển thị thông tin', () => {
  const out = runCLI('status');
  return out.includes('Chương') && out.includes('Nhân vật');
});

// Add some data for other CLI tests
writeFileSync(join(cliProject, 'chapters', 'ch01.md'), `# Chương 1
Buổi sáng, Huyền Trang ngồi thiền yên tĩnh.
Buổi chiều, ra phố mua đồ.
Ban đêm, nghỉ ngơi.
`, 'utf-8');
writeFileSync(join(cliProject, 'chapters', 'ch02.md'), `# Chương 2
Phát hiện manh mối lạ! Nghi ngờ điều bất thường.
Theo dõi dấu vết bí ẩn.
`, 'utf-8');

test('CLI', '`scan` chạy và output', () => {
  const out = runCLI('scan');
  return out.includes('Quét') && (out.includes('Điểm') || out.includes('KẾT QUẢ'));
});

test('CLI', '`pacing` hiển thị chart', () => {
  const out = runCLI('pacing');
  return out.includes('Phân tích nhịp') || out.includes('Ch.');
});

test('CLI', '`style` phân tích văn phong', () => {
  const out = runCLI('style');
  return out.includes('Phân tích văn phong') || out.includes('từ/câu') || out.includes('Giọng');
});

test('CLI', '`bible list` liệt kê', () => {
  const out = runCLI('bible list');
  return out.includes('thực thể') || out.includes('0 thực thể');
});

test('CLI', '`bible create` tạo entity', () => {
  const out = runCLI('bible create character --name "Test Char" --status alive');
  return out.includes('Đã tạo') || out.includes('test-char');
});

test('CLI', '`report` tổng hợp', () => {
  const out = runCLI('report');
  return out.includes('báo cáo') || out.includes('Báo') || out.includes('Điểm') || out.includes('Nhịp');
});

// ═══════════════════════════════════════
// OUTPUT RESULTS
// ═══════════════════════════════════════

console.log('\n## Feature Review — Novel Guardian v1.0\n');

const sections = [
  { key: 'Bible Manager', max: 10 },
  { key: 'Continuity Scanner', max: 10 },
  { key: 'Pacing Analyzer', max: 8 },
  { key: 'Style Analyzer', max: 8 },
  { key: 'CLI', max: 8 },
];

for (const { key, max } of sections) {
  const items = results[key] || [];
  const passed = items.filter(i => i.pass).length;
  console.log(`### ${key}: ${passed}/${max}`);
  console.log('| Test | Kết quả | Ghi chú |');
  console.log('|------|---------|---------|');
  for (const item of items) {
    console.log(`| ${item.name} | ${item.pass ? '✅' : '❌'} | ${item.note} |`);
  }
  console.log('');
}

const total = totalPass + totalFail;
const pct = total > 0 ? Math.round((totalPass / total) * 100) : 0;
console.log(`**Tổng: ${totalPass}/${total} (${pct}%)**`);

let grade;
if (pct >= 95) grade = 'A';
else if (pct >= 85) grade = 'B';
else if (pct >= 75) grade = 'C';
else if (pct >= 65) grade = 'D';
else grade = 'F';
console.log(`**Grade: ${grade}**`);

// Issues found
const failedItems = Object.entries(results).flatMap(([section, items]) =>
  items.filter(i => !i.pass).map(i => `[${section}] ${i.name}: ${i.note}`)
);
if (failedItems.length > 0) {
  console.log('\n### Issues Found');
  for (const f of failedItems) console.log(`- ❌ ${f}`);
}

console.log(`\n### Verdict: ${pct >= 80 ? 'PASS' : 'FAIL'}`);
