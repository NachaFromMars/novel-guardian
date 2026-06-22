import { join } from 'path';
import { writeFileSync } from 'fs';
import { BibleManager } from './bible.mjs';
import { RULES } from './rules.mjs';
import { readMarkdown, listMarkdownFiles, countWords, dateNow, writeJSON, readJSON, ensureDir } from './utils.mjs';

// ══════════════════════════════════════════════════════════
// BỘ QUÉT LIỀN MẠCH — Novel Guardian v1.0
// Chạy toàn bộ quy tắc lên tất cả chương, tạo báo cáo
// ══════════════════════════════════════════════════════════

export class ContinuityScanner {
  /**
   * @param {string} dataDir - Thư mục data (chứa characters, world, timeline...)
   * @param {string} chaptersDir - Thư mục chứa file .md của các chương
   */
  constructor(dataDir, chaptersDir) {
    this.bible = new BibleManager(dataDir);
    this.chaptersDir = chaptersDir;
    this.voiceDir = join(dataDir, 'voices');
    this.reportsDir = join(dataDir, 'reports');
    ensureDir(this.reportsDir);
  }

  /**
   * Nạp 1 chương từ file markdown
   */
  _loadChapter(filePath) {
    const text = readMarkdown(filePath);
    const match = filePath.match(/(?:ch|chuong|chương)[._-]?(\d+)/i);
    const number = match ? parseInt(match[1]) : 0;
    return {
      number,
      text,
      filePath,
      wordCount: countWords(text)
    };
  }

  /**
   * Nạp tất cả chương
   */
  _loadAllChapters() {
    const files = listMarkdownFiles(this.chaptersDir);
    return files
      .map(f => this._loadChapter(f))
      .filter(ch => ch.number > 0)
      .sort((a, b) => a.number - b.number);
  }

  /**
   * Quét 1 chương qua tất cả quy tắc
   */
  scanChapter(chapterNumber) {
    const allChapters = this._loadAllChapters();
    const chapter = allChapters.find(ch => ch.number === chapterNumber);
    if (!chapter) {
      throw new Error(`Không tìm thấy chương ${chapterNumber}`);
    }

    const previousChapters = allChapters.filter(ch => ch.number < chapterNumber);
    const ctx = {
      bible: this.bible,
      chapter,
      previousChapters,
      allChapters,
      voiceDir: this.voiceDir
    };

    const results = [];
    for (const rule of RULES) {
      // Skip disabled rules
      if (rule.enabled === false) continue;
      try {
        const result = rule.check(ctx);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          passed: result.passed,
          issues: result.issues
        });
      } catch (err) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          passed: false,
          issues: [{
            ruleId: rule.id,
            severity: 'note',
            message: `Lỗi chạy quy tắc: ${err.message}`
          }]
        });
      }
    }

    return {
      chapter: chapterNumber,
      totalRules: RULES.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      issues: results.flatMap(r => r.issues),
      results,
      scannedAt: dateNow()
    };
  }

  /**
   * Quét TẤT CẢ chương
   */
  scanAll() {
    const allChapters = this._loadAllChapters();
    if (allChapters.length === 0) {
      return {
        totalChapters: 0,
        message: 'Không tìm thấy chương nào trong thư mục',
        chapters: [],
        summary: null
      };
    }

    const chapterResults = [];
    const allIssues = [];

    for (const chapter of allChapters) {
      const previousChapters = allChapters.filter(ch => ch.number < chapter.number);
      const ctx = {
        bible: this.bible,
        chapter,
        previousChapters,
        allChapters,
        voiceDir: this.voiceDir
      };

      const issues = [];
      for (const rule of RULES) {
        try {
          const result = rule.check(ctx);
          issues.push(...result.issues);
        } catch (err) {
          console.warn(`⚠️ Rule ${rule.id} lỗi tại ch.${chapter.number}: ${err.message}`);
        }
      }

      chapterResults.push({
        chapter: chapter.number,
        wordCount: chapter.wordCount,
        issueCount: issues.length,
        issues
      });

      allIssues.push(...issues.map(i => ({ ...i, chapter: chapter.number })));
    }

    // Tổng hợp
    const summary = this._buildSummary(allIssues, allChapters.length);

    return {
      totalChapters: allChapters.length,
      totalWords: allChapters.reduce((sum, ch) => sum + ch.wordCount, 0),
      chapters: chapterResults,
      summary,
      scannedAt: dateNow()
    };
  }

  /**
   * Quét 1 khoảng chương (từ → đến)
   */
  scanRange(fromChapter, toChapter) {
    const allChapters = this._loadAllChapters();
    const range = allChapters.filter(ch => ch.number >= fromChapter && ch.number <= toChapter);

    if (range.length === 0) {
      return { totalChapters: 0, message: `Không tìm thấy chương nào trong khoảng ${fromChapter}-${toChapter}` };
    }

    const chapterResults = [];
    const allIssues = [];

    for (const chapter of range) {
      const previousChapters = allChapters.filter(ch => ch.number < chapter.number);
      const ctx = {
        bible: this.bible,
        chapter,
        previousChapters,
        allChapters,
        voiceDir: this.voiceDir
      };

      const issues = [];
      for (const rule of RULES) {
        try {
          const result = rule.check(ctx);
          issues.push(...result.issues);
        } catch (err) {
          console.warn(`⚠️ Rule ${rule.id} lỗi khoảng scan: ${err.message}`);
        }
      }

      chapterResults.push({
        chapter: chapter.number,
        wordCount: chapter.wordCount,
        issueCount: issues.length,
        issues
      });

      allIssues.push(...issues.map(i => ({ ...i, chapter: chapter.number })));
    }

    return {
      range: `${fromChapter}-${toChapter}`,
      totalChapters: range.length,
      chapters: chapterResults,
      summary: this._buildSummary(allIssues, range.length),
      scannedAt: dateNow()
    };
  }

  /**
   * Tổng hợp kết quả
   */
  _buildSummary(issues, totalChapters) {
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    const notes = issues.filter(i => i.severity === 'note');

    // Đếm theo category
    const byCategory = {};
    for (const issue of issues) {
      const cat = issue.ruleId?.[0] || '?';
      const categoryName = { T: 'Thời gian', C: 'Nhân vật', W: 'Thế giới', P: 'Mạch truyện', V: 'Giọng văn' }[cat] || 'Khác';
      byCategory[categoryName] = (byCategory[categoryName] || 0) + 1;
    }

    // Điểm liền mạch (100 - penalty)
    const penalty = critical.length * 10 + warnings.length * 3 + notes.length * 1;
    const score = Math.max(0, Math.min(100, 100 - penalty));

    return {
      totalIssues: issues.length,
      critical: critical.length,
      warnings: warnings.length,
      notes: notes.length,
      byCategory,
      score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      totalChapters
    };
  }

  /**
   * Tạo báo cáo Markdown
   */
  generateReport(scanResult) {
    let md = `# Báo Cáo Liền Mạch — Novel Guardian\n`;
    md += `📅 ${scanResult.scannedAt}\n\n`;

    if (scanResult.summary) {
      const s = scanResult.summary;
      md += `## Tổng Quan\n`;
      md += `| Chỉ Số | Giá Trị |\n|--------|--------|\n`;
      md += `| Điểm liền mạch | **${s.score}/100** (${s.grade}) |\n`;
      md += `| Tổng chương | ${s.totalChapters} |\n`;
      if (scanResult.totalWords) md += `| Tổng số từ | ${scanResult.totalWords.toLocaleString()} |\n`;
      md += `| Tổng lỗi | ${s.totalIssues} |\n`;
      md += `| 🔴 Nghiêm trọng | ${s.critical} |\n`;
      md += `| ⚠️ Cảnh báo | ${s.warnings} |\n`;
      md += `| 📝 Ghi chú | ${s.notes} |\n\n`;

      if (Object.keys(s.byCategory).length > 0) {
        md += `### Phân Loại Lỗi\n`;
        for (const [cat, count] of Object.entries(s.byCategory)) {
          md += `- ${cat}: ${count}\n`;
        }
        md += '\n';
      }
    }

    // Chi tiết từng chương
    if (scanResult.chapters) {
      md += `## Chi Tiết Từng Chương\n\n`;
      for (const ch of scanResult.chapters) {
        if (ch.issueCount === 0) {
          md += `### Chương ${ch.chapter} ✅\n`;
          md += `${ch.wordCount} từ — Không phát hiện lỗi\n\n`;
        } else {
          md += `### Chương ${ch.chapter} ⚠️ (${ch.issueCount} lỗi)\n`;
          md += `${ch.wordCount} từ\n\n`;
          for (const issue of ch.issues) {
            const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '⚠️' : '📝';
            md += `- ${icon} **[${issue.ruleId}]** ${issue.message}\n`;
            if (issue.suggestion) {
              md += `  💡 ${issue.suggestion}\n`;
            }
          }
          md += '\n';
        }
      }
    }

    return md;
  }

  /**
   * Quét và lưu báo cáo
   */
  scanAndSave(mode = 'all', from = null, to = null) {
    let result;
    if (mode === 'chapter' && from) {
      result = this.scanChapter(from);
    } else if (mode === 'range' && from && to) {
      result = this.scanRange(from, to);
    } else {
      result = this.scanAll();
    }

    const report = this.generateReport(result);
    const today = dateNow().substring(0, 10);
    const reportPath = join(this.reportsDir, `continuity-${today}.md`);

    // Ghi report markdown
    writeFileSync(reportPath, report, 'utf-8');

    // Lưu JSON raw
    const jsonPath = join(this.reportsDir, `continuity-${today}.json`);
    writeJSON(jsonPath, result);

    return { result, reportPath, jsonPath };
  }
}
