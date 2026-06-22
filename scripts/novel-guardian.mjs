#!/usr/bin/env node

/**
 * Novel Guardian CLI — v1.0
 * Trình bảo vệ liền mạch cho tiểu thuyết
 *
 * Lệnh:
 *   scan [--chapter N] [--range A-B]  Quét mâu thuẫn
 *   pacing [--chapter N]              Phân tích nhịp truyện
 *   style [--chapter N]               Phân tích văn phong
 *   bible <sub-command>               Quản lý Kinh Điển
 *   report                            Tạo báo cáo tổng hợp
 *   init                              Khởi tạo dự án mới
 *   status                            Trạng thái dự án
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { BibleManager } from './lib/bible.mjs';
import { ContinuityScanner } from './lib/scanner.mjs';
import { analyzeChapterPacing, analyzeProjectPacing, generatePacingChart, detectPacingPatterns } from './lib/pacing-analyzer.mjs';
import { analyzeStyle, compareStyles, detectStyleDrift, buildBaseline } from './lib/style-analyzer.mjs';
import { readMarkdown, listMarkdownFiles, countWords, dateNow, readJSON, writeJSON, ensureDir } from './lib/utils.mjs';

// ─── PARSE CLI ───

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  const val = args[idx + 1];
  // Trả về null nếu không có giá trị hoặc giá trị là flag khác
  if (val === undefined || val === null || val.startsWith('--')) return null;
  return val || null;  // empty string → null
}

function getProjectDir() {
  return getFlag('project') || getFlag('dir') || process.cwd();
}

// ─── MAIN ───

async function main() {
  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log('novel-guardian v1.0.2');
    return;
  }

  const projectDir = getProjectDir();

  switch (command) {
    case 'init': return cmdInit(projectDir);
    case 'status': return cmdStatus(projectDir);
    case 'scan': return cmdScan(projectDir);
    case 'pacing': return cmdPacing(projectDir);
    case 'style': return cmdStyle(projectDir);
    case 'bible': return cmdBible(projectDir, args.slice(1));
    case 'report': return cmdReport(projectDir);
    default:
      console.error(`❌ Lệnh không hợp lệ: "${command}"\nDùng: node novel-guardian.mjs help`);
      process.exit(1);
  }
}

// ─── LỆNH: INIT ───

function cmdInit(projectDir) {
  const dataDir = join(projectDir, 'data');
  const chapDir = join(projectDir, 'chapters');

  if (existsSync(join(dataDir, 'index.json'))) {
    console.log('⚠️ Dự án đã khởi tạo rồi.');
    return;
  }

  const bible = new BibleManager(dataDir);
  ensureDir(chapDir);

  // Tạo config
  const config = {
    schemaVersion: '1.0',
    projectName: getFlag('name') || 'Novel Project',
    language: 'vi',
    chaptersDir: 'chapters',
    dataDir: 'data',
    createdAt: dateNow()
  };
  writeJSON(join(projectDir, 'guardian.json'), config);

  console.log('✅ Đã khởi tạo Novel Guardian!');
  console.log(`   📁 ${projectDir}`);
  console.log(`   📖 Chương: ${chapDir}`);
  console.log(`   📊 Dữ liệu: ${dataDir}`);
  console.log('\nBước tiếp:');
  console.log('  1. Đặt file .md chương vào thư mục chapters/');
  console.log('  2. node novel-guardian.mjs bible create character --name "Tên NV" --status alive');
  console.log('  3. node novel-guardian.mjs scan');
}

// ─── LỆNH: STATUS ───

function cmdStatus(projectDir) {
  const config = readJSON(join(projectDir, 'guardian.json'));
  if (!config) {
    console.log('❌ Chưa khởi tạo. Chạy: node novel-guardian.mjs init');
    return;
  }

  const dataDir = join(projectDir, config.dataDir || 'data');
  const chapDir = join(projectDir, config.chaptersDir || 'chapters');
  const bible = new BibleManager(dataDir);
  const index = bible.getIndex();
  const chapters = listMarkdownFiles(chapDir);

  console.log(`📖 ${config.projectName}`);
  console.log(`═══════════════════════════════════`);
  console.log(`📚 Chương: ${chapters.length}`);
  console.log(`👤 Nhân vật: ${index.entities?.characters || 0}`);
  console.log(`🗺️ Địa danh: ${index.entities?.locations || 0}`);
  console.log(`⚔️ Phe phái: ${index.entities?.factions || 0}`);
  console.log(`💎 Vật phẩm: ${index.entities?.items || 0}`);
  console.log(`📅 Sự kiện: ${index.entities?.events || 0}`);
  console.log(`🔄 Cập nhật: ${index.lastSync || 'chưa'}`);
}

// ─── LỆNH: SCAN ───

function cmdScan(projectDir) {
  const config = readJSON(join(projectDir, 'guardian.json'));
  if (!config) { console.log('❌ Chưa khởi tạo.'); return; }

  const dataDir = join(projectDir, config.dataDir || 'data');
  const chapDir = join(projectDir, config.chaptersDir || 'chapters');
  const scanner = new ContinuityScanner(dataDir, chapDir);

  const chapterNum = getFlag('chapter');
  const range = getFlag('range');

  let result;
  if (chapterNum) {
    console.log(`🔍 Quét chương ${chapterNum}...`);
    result = scanner.scanChapter(parseInt(chapterNum));
    console.log(`\nKết quả: ${result.passed} pass / ${result.failed} fail`);
  } else if (range) {
    const [from, to] = range.split('-').map(Number);
    console.log(`🔍 Quét chương ${from}–${to}...`);
    result = scanner.scanRange(from, to);
  } else {
    console.log('🔍 Quét toàn bộ...');
    result = scanner.scanAll();
  }

  // In kết quả
  if (result.summary) {
    const s = result.summary;
    console.log(`\n═══ KẾT QUẢ ═══`);
    console.log(`Điểm: ${s.score}/100 (${s.grade})`);
    console.log(`🔴 Nghiêm trọng: ${s.critical}`);
    console.log(`⚠️ Cảnh báo: ${s.warnings}`);
    console.log(`📝 Ghi chú: ${s.notes}`);
  }

  if (result.issues) {
    for (const issue of result.issues) {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '⚠️' : '📝';
      console.log(`${icon} [${issue.ruleId}] ${issue.message}`);
      if (issue.suggestion) console.log(`   💡 ${issue.suggestion}`);
    }
  }

  if (result.chapters) {
    for (const ch of result.chapters) {
      if (ch.issueCount > 0) {
        console.log(`\n📖 Chương ${ch.chapter} — ${ch.issueCount} lỗi`);
        for (const i of ch.issues) {
          const icon = i.severity === 'critical' ? '🔴' : i.severity === 'warning' ? '⚠️' : '📝';
          console.log(`  ${icon} [${i.ruleId}] ${i.message}`);
        }
      }
    }
  }

  // Lưu báo cáo
  const report = scanner.generateReport(result);
  const reportPath = join(dataDir, 'reports', `scan-${dateNow().substring(0, 10)}.md`);
  ensureDir(join(dataDir, 'reports'));
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n📄 Báo cáo: ${reportPath}`);
}

// ─── LỆNH: PACING ───

function cmdPacing(projectDir) {
  const config = readJSON(join(projectDir, 'guardian.json'));
  if (!config) { console.log('❌ Chưa khởi tạo.'); return; }

  const chapDir = join(projectDir, config.chaptersDir || 'chapters');
  const pacingDir = join(projectDir, config.dataDir || 'data', 'pacing');
  const chapterNum = getFlag('chapter');

  if (chapterNum) {
    const files = listMarkdownFiles(chapDir);
    const file = files.find(f => f.match(/(?:ch|chuong|chương)[._-]?(\d+)/i)?.[1] === chapterNum);
    if (!file) { console.log(`❌ Không tìm thấy chương ${chapterNum}`); return; }

    const text = readMarkdown(file);
    const result = analyzeChapterPacing(text, parseInt(chapterNum));
    console.log(`📖 Chương ${result.chapter}: ${result.chapterLevel} (${result.chapterScore})`);
    console.log(`Peak: beat ${result.peakBeat} (${result.peakScore})`);
    for (const b of result.beats) {
      const bar = '█'.repeat(Math.round(b.score * 2)) + '░'.repeat(10 - Math.round(b.score * 2));
      console.log(`  Beat ${b.beat}: ${bar} ${b.level} (${b.score})`);
    }
  } else {
    console.log('📊 Phân tích nhịp toàn bộ...');
    const result = analyzeProjectPacing(chapDir, pacingDir);
    console.log(generatePacingChart(result.chapters));

    if (result.patterns.length > 0) {
      console.log('═══ KHUÔN MẪU ═══');
      for (const p of result.patterns) {
        const icon = p.severity === 'good' ? '✅' : p.severity === 'warning' ? '⚠️' : '📝';
        console.log(`${icon} ${p.message}`);
      }
    }
  }
}

// ─── LỆNH: STYLE ───

function cmdStyle(projectDir) {
  const config = readJSON(join(projectDir, 'guardian.json'));
  if (!config) { console.log('❌ Chưa khởi tạo.'); return; }

  const chapDir = join(projectDir, config.chaptersDir || 'chapters');
  const chapterNum = getFlag('chapter');

  const files = listMarkdownFiles(chapDir);
  if (files.length === 0) { console.log('❌ Không tìm thấy chương nào.'); return; }

  if (chapterNum) {
    const file = files.find(f => f.match(/(?:ch|chuong|chương)[._-]?(\d+)/i)?.[1] === chapterNum);
    if (!file) { console.log(`❌ Không tìm thấy chương ${chapterNum}`); return; }

    const text = readMarkdown(file);
    const style = analyzeStyle(text);
    printStyleReport(parseInt(chapterNum), style);
  } else {
    console.log('📊 Phân tích văn phong toàn bộ...\n');
    const styles = [];
    for (const file of files) {
      const match = file.match(/(?:ch|chuong|chương)[._-]?(\d+)/i);
      if (!match) continue;
      const text = readMarkdown(file);
      const style = analyzeStyle(text);
      if (style) {
        styles.push(style);
        console.log(`Ch.${match[1].padStart(2, '0')}: ${style.wordCount} từ | ${style.avgSentenceLength} từ/câu | Giọng: ${style.vocabulary.dominantTone} | Đối thoại: ${(style.dialogue.wordRatio * 100).toFixed(0)}%`);
      }
    }

    if (styles.length >= 2) {
      const baseline = buildBaseline(styles.slice(0, -1));
      const latest = styles[styles.length - 1];
      const drift = detectStyleDrift(latest, baseline);
      if (drift.drifted) {
        console.log(`\n⚠️ Lệch giọng phát hiện: tương đồng ${drift.similarity}%`);
        for (const i of drift.issues) {
          for (const r of i.reasons) console.log(`  → ${r}`);
        }
      } else {
        console.log(`\n✅ Văn phong nhất quán (tương đồng ${drift.similarity}%)`);
      }
    }
  }
}

function printStyleReport(chapterNum, style) {
  console.log(`📖 Chương ${chapterNum} — Phân Tích Văn Phong`);
  console.log(`═══════════════════════════════════`);
  console.log(`Từ: ${style.wordCount} | Câu: ${style.sentenceCount} | TB: ${style.avgSentenceLength} từ/câu`);
  console.log(`Câu ngắn: ${(style.shortSentenceRatio * 100).toFixed(0)}% | Câu dài: ${(style.longSentenceRatio * 100).toFixed(0)}%`);
  console.log(`Dấu câu: ? ${(style.punctuation.questionRatio * 100).toFixed(0)}% | ! ${(style.punctuation.exclamationRatio * 100).toFixed(0)}% | ... ${(style.punctuation.ellipsisRatio * 100).toFixed(0)}%`);
  console.log(`Đối thoại: ${style.dialogue.count} câu (${(style.dialogue.wordRatio * 100).toFixed(0)}%)`);
  console.log(`Giọng: ${style.vocabulary.dominantTone}`);
  console.log(`  Hiện đại: ${style.vocabulary.modernCount} | Cổ kính: ${style.vocabulary.archaicCount} | Thông tục: ${style.vocabulary.vulgarCount} | Trang trọng: ${style.vocabulary.formalCount}`);
}

// ─── LỆNH: BIBLE ───

function cmdBible(projectDir, subArgs) {
  const config = readJSON(join(projectDir, 'guardian.json'));
  if (!config) { console.log('❌ Chưa khởi tạo.'); return; }

  const dataDir = join(projectDir, config.dataDir || 'data');
  const bible = new BibleManager(dataDir);
  const sub = subArgs[0];

  switch (sub) {
    case 'list': {
      const type = getFlag('type');
      const entities = bible.list(type || null);
      console.log(`📋 ${entities.length} thực thể${type ? ` (${type})` : ''}:`);
      for (const e of entities) {
        console.log(`  [${e.type}] ${e.name} (${e.id})${e.status ? ` — ${e.status}` : ''}`);
      }
      break;
    }
    case 'get': {
      const type = getFlag('type');
      const id = getFlag('id');
      if (!type || !id) { console.log('❌ Cần: --type <loại> --id <id>'); return; }
      const entity = bible.get(type, id);
      console.log(JSON.stringify(entity, null, 2));
      break;
    }
    case 'create': {
      const type = subArgs[1];
      const name = getFlag('name');
      const status = getFlag('status') || 'alive';
      if (!type || !name) { console.log('❌ Cần: bible create <type> --name "Tên"'); return; }
      // Build entity data với tất cả flags có thể
      const data = { name, status };
      const significance = getFlag('significance');
      const chapter = getFlag('chapter');
      const description = getFlag('description') || getFlag('desc');
      if (significance) data.significance = significance;
      if (chapter) {
        data.chapter = parseInt(chapter);
        data.firstAppearance = { chapter: parseInt(chapter), beat: 1 };
      }
      if (description) data.description = description;
      try {
        const entity = bible.create(type, data);
        console.log(`✅ Đã tạo: [${entity.type}] ${entity.name} (${entity.id})`);
      } catch (err) {
        console.log(`❌ Lỗi: ${err.message}`);
      }
      break;
    }
    case 'search': {
      // Filter flags (--project, --dir, etc.) ra khỏi keyword
      const keywordParts = subArgs.slice(1).filter(a => !a.startsWith('--'));
      const keyword = keywordParts.join(' ') || getFlag('q');
      if (!keyword) { console.log('❌ Cần từ khoá'); return; }
      const results = bible.search(keyword);
      console.log(`🔍 "${keyword}" → ${results.length} kết quả:`);
      for (const r of results) {
        console.log(`  [${r.type}] ${r.name} (${r.id})`);
      }
      break;
    }
    case 'update': {
      const type = subArgs[1];
      const id = subArgs[2] || getFlag('id');
      if (!type || !id) { console.log('❌ Cần: bible update <type> <id> --name "Tên mới" [--status ...]'); return; }
      const updates = {};
      const name = getFlag('name');
      const status = getFlag('status');
      const significance = getFlag('significance');
      const description = getFlag('description') || getFlag('desc');
      if (name) updates.name = name;
      if (status) updates.status = status;
      if (significance) updates.significance = significance;
      if (description) updates.description = description;
      if (Object.keys(updates).length === 0) { console.log('❌ Cần ít nhất 1 trường cập nhật (--name, --status, --desc...)'); return; }
      try {
        const entity = bible.update(type, id, updates);
        console.log(`✅ Đã cập nhật: [${entity.type}] ${entity.name} (${entity.id})`);
      } catch (err) {
        console.log(`❌ Lỗi: ${err.message}`);
      }
      break;
    }
    case 'delete': {
      const type = subArgs[1];
      const id = subArgs[2] || getFlag('id');
      if (!type || !id) { console.log('❌ Cần: bible delete <type> <id>'); return; }
      try {
        bible.delete(type, id);
        console.log(`✅ Đã xoá (lưu trữ): [${type}] ${id}`);
      } catch (err) {
        console.log(`❌ Lỗi: ${err.message}`);
      }
      break;
    }
    case 'export': {
      const format = getFlag('format') || 'md';
      const output = bible.exportBible(format);
      if (format === 'json') {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(output);
      }
      break;
    }
    case 'sync': {
      const chapDir = join(projectDir, config.chaptersDir || 'chapters');
      const result = bible.syncBible(chapDir);
      console.log(`🔄 ${result.message}`);
      break;
    }
    default:
      console.log('Bible commands: list, get, create, search, export, sync');
  }
}

// ─── LỆNH: REPORT ───

function cmdReport(projectDir) {
  const config = readJSON(join(projectDir, 'guardian.json'));
  if (!config) { console.log('❌ Chưa khởi tạo.'); return; }

  const dataDir = join(projectDir, config.dataDir || 'data');
  const chapDir = join(projectDir, config.chaptersDir || 'chapters');

  console.log('📊 Tạo báo cáo tổng hợp...\n');

  // Quét liền mạch
  const scanner = new ContinuityScanner(dataDir, chapDir);
  const scanResult = scanner.scanAll();

  // Phân tích nhịp
  const pacingDir = join(dataDir, 'pacing');
  const pacingResult = analyzeProjectPacing(chapDir, pacingDir);

  // Phân tích văn phong
  const files = listMarkdownFiles(chapDir);
  const styles = [];
  for (const file of files) {
    const text = readMarkdown(file);
    const style = analyzeStyle(text);
    if (style) styles.push(style);
  }

  // In báo cáo
  console.log(scanner.generateReport(scanResult));
  console.log('\n' + generatePacingChart(pacingResult.chapters));

  if (pacingResult.patterns.length > 0) {
    console.log('\n═══ KHUÔN MẪU NHỊP ═══');
    for (const p of pacingResult.patterns) {
      const icon = p.severity === 'good' ? '✅' : '⚠️';
      console.log(`${icon} ${p.message}`);
    }
  }

  if (styles.length >= 2) {
    const baseline = buildBaseline(styles.slice(0, -1));
    const latest = styles[styles.length - 1];
    const drift = detectStyleDrift(latest, baseline);
    console.log(`\n═══ VĂN PHONG ═══`);
    console.log(drift.drifted
      ? `⚠️ Lệch ${100 - drift.similarity}% so với baseline`
      : `✅ Nhất quán (${drift.similarity}%)`);
  }
}

// ─── HELP ───

function printHelp() {
  console.log(`
🛡️ Novel Guardian v1.0 — Trình bảo vệ liền mạch cho tiểu thuyết

LỆNH:
  init                        Khởi tạo dự án mới
  status                      Trạng thái dự án
  scan [--chapter N]          Quét mâu thuẫn
  scan [--range 1-10]         Quét khoảng chương
  pacing [--chapter N]        Phân tích nhịp truyện
  style [--chapter N]         Phân tích văn phong
  bible list [--type X]       Liệt kê Kinh Điển
  bible create <type> --name  Tạo thực thể mới
  bible get --type X --id Y   Xem chi tiết
  bible search <từ khoá>      Tìm kiếm
  bible export [--format md]  Xuất Kinh Điển
  bible sync                  Đồng bộ từ chương
  report                      Báo cáo tổng hợp

TÙY CHỌN:
  --project <dir>             Thư mục dự án (mặc định: cwd)
  --name <tên>                Tên dự án (cho init)

VÍ DỤ:
  node novel-guardian.mjs init --name "Trọng Sinh Đường Tam Tạng"
  node novel-guardian.mjs bible create character --name "Trần Huyền Trang" --status alive
  node novel-guardian.mjs scan
  node novel-guardian.mjs pacing
  node novel-guardian.mjs report
`);
}

main().catch(err => {
  console.error(`❌ Lỗi: ${err.message}`);
  process.exit(1);
});
