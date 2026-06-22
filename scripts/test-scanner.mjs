import { ContinuityScanner } from './lib/scanner.mjs';
import { BibleManager } from './lib/bible.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

// ═══ TEST SCANNER ═══
const dataDir = '/tmp/ng-scanner-test/data';
const chapDir = '/tmp/ng-scanner-test/chapters';
// Cleanup trước khi chạy — đảm bảo idempotent
rmSync('/tmp/ng-scanner-test', { recursive: true, force: true });
mkdirSync(chapDir, { recursive: true });

// Tạo Bible dữ liệu test
const bible = new BibleManager(dataDir);
bible.create('character', {
  name: 'Trần Huyền Trang', aliases: ['Tam Tạng'], status: 'alive',
  firstAppearance: { chapter: 1, beat: 1 }, attributes: { role: 'protagonist' }
});
bible.create('character', {
  name: 'Bạch Cốt Tinh', status: 'dead', firstAppearance: { chapter: 5, beat: 1 }
});
bible.create('location', { name: 'Trường An', significance: 'major' });
bible.create('location', { name: 'Ngũ Hành Sơn', significance: 'major' });

// Tạo file chương test
writeFileSync(`${chapDir}/ch01.md`, `
# Chương 1: Trọng Sinh
Buổi sáng, Trần Huyền Trang tỉnh dậy tại Trường An. 
Anh ta nhớ lại kiếp trước mình là một lập trình viên.
Buổi chiều, Tam Tạng ra phố.
Ban đêm, ngồi thiền.
`, 'utf-8');

writeFileSync(`${chapDir}/ch02.md`, `
# Chương 2: Nghi Ngờ
Buổi sáng, Tam Tạng phát hiện điều lạ.
Bỗng Bạch Cốt Tinh xuất hiện giữa chợ, mỉm cười.
Tại Trường An mọi thứ yên bình. Bỗng Ngũ Hành Sơn rung chuyển.
`, 'utf-8');

writeFileSync(`${chapDir}/ch03.md`, `
# Chương 3: Hành Trình
Buổi sáng, Tam Tạng lên đường.
Buổi chiều, đến một ngôi làng nhỏ.
Ban đêm, nghỉ chân bên suối.
`, 'utf-8');

console.log('═══ TEST 1: Quét 1 chương ═══');
const scanner = new ContinuityScanner(dataDir, chapDir);
const r1 = scanner.scanChapter(2);
console.log(`Chương ${r1.chapter}: ${r1.passed} pass / ${r1.failed} fail / ${r1.issues.length} issues`);
for (const i of r1.issues) {
  const icon = i.severity === 'critical' ? '🔴' : i.severity === 'warning' ? '⚠️' : '📝';
  console.log(`  ${icon} [${i.ruleId}] ${i.message}`);
}

console.log('\n═══ TEST 2: Quét tất cả ═══');
const r2 = scanner.scanAll();
console.log(`Tổng: ${r2.totalChapters} chương, ${r2.totalWords} từ`);
console.log(`Điểm: ${r2.summary.score}/100 (${r2.summary.grade})`);
console.log(`Lỗi: ${r2.summary.critical} critical, ${r2.summary.warnings} warning, ${r2.summary.notes} note`);

console.log('\n═══ TEST 3: Tạo báo cáo Markdown ═══');
const report = scanner.generateReport(r2);
console.log(`Báo cáo: ${report.length} ký tự`);
console.log(report.substring(0, 800));

console.log('\n═══ TEST 4: Quét khoảng ═══');
const r3 = scanner.scanRange(1, 2);
console.log(`Khoảng: ${r3.range}, ${r3.totalChapters} chương`);

console.log('\n═══ SCANNER TEST HOÀN TẤT ✅ ═══');
