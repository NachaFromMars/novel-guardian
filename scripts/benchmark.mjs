#!/usr/bin/env node

/**
 * Beat 12 — Benchmark Performance
 * Đo tốc độ xử lý toàn bộ Novel Guardian
 */

import { performance } from 'perf_hooks';
import { BibleManager } from './lib/bible.mjs';
import { ContinuityScanner } from './lib/scanner.mjs';
import { calculatePacing, analyzeProjectPacing } from './lib/pacing-analyzer.mjs';
import { analyzeStyle } from './lib/style-analyzer.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const testDir = '/tmp/ng-benchmark';
// Cleanup trước khi chạy — đảm bảo idempotent
rmSync(testDir, { recursive: true, force: true });
mkdirSync(testDir, { recursive: true });
mkdirSync(join(testDir, 'chapters'), { recursive: true });

console.log('🚀 BENCHMARK NOVEL GUARDIAN v1.0\n');

// ─── TEST 1: Bible Performance ───
console.log('📖 Test 1: Bible Manager Performance');
const t1Start = performance.now();
const bible = new BibleManager(join(testDir, 'data'));

// Tạo 100 nhân vật
for (let i = 1; i <= 100; i++) {
  bible.create('character', {
    name: `Nhân vật ${i}`,
    status: 'alive',
    firstAppearance: { chapter: Math.ceil(i / 10), beat: (i % 5) + 1 }
  });
}

// Tạo 50 địa danh
for (let i = 1; i <= 50; i++) {
  bible.create('location', {
    name: `Địa danh ${i}`,
    significance: i % 2 === 0 ? 'major' : 'minor'
  });
}

// Tìm kiếm 10 lần
for (let i = 0; i < 10; i++) {
  bible.search('vật');
}

const t1End = performance.now();
const t1Time = Math.round((t1End - t1Start) * 100) / 100;
console.log(`  ✅ ${t1Time}ms — 150 entities + 10 searches`);

// ─── TEST 2: Pacing Performance ───
console.log('\n🎯 Test 2: Pacing Analyzer Performance');
const t2Start = performance.now();

// 50 đoạn text (beats)
const pacingTexts = [];
for (let i = 0; i < 50; i++) {
  const level = i % 5;
  const keyword = [
    'bình yên thiền tĩnh ngồi',
    'phát hiện lạ manh mối điều tra',
    'xung đột căng thẳng tranh cãi',
    'chiến đấu nổ tuyệt chiêu bùng',
    'kết thúc hồi phục bình minh'
  ][level];
  const text = `${keyword} `.repeat(20); // ~100 từ
  pacingTexts.push(text);
  calculatePacing(text);
}

const t2End = performance.now();
const t2Time = Math.round((t2End - t2Start) * 100) / 100;
console.log(`  ✅ ${t2Time}ms — 50 pacing analyses`);

// ─── TEST 3: Style Performance ───
console.log('\n📝 Test 3: Style Analyzer Performance');
const t3Start = performance.now();

// 30 đoạn văn bản
for (let i = 0; i < 30; i++) {
  const text = `
    Huyền Trang đã trải qua nhiều thử thách trong cuộc sống.
    Tuy nhiên, anh ta vẫn giữ được những giá trị cơ bản.
    Với mỗi ngày trôi qua, anh ta học được những bài học mới.
    Đôi khi cuộc sống khó khăn, nhưng anh ta không bao giờ từ bỏ.
  `.repeat(5);
  analyzeStyle(text);
}

const t3End = performance.now();
const t3Time = Math.round((t3End - t3Start) * 100) / 100;
console.log(`  ✅ ${t3Time}ms — 30 style analyses`);

// ─── TEST 4: Scanner Performance ───
console.log('\n🔍 Test 4: Continuity Scanner Performance');

// Tạo 20 file chương test
for (let i = 1; i <= 20; i++) {
  const text = `
# Chương ${i}
${pacingTexts[Math.floor(Math.random() * pacingTexts.length)].repeat(10)}
  `;
  writeFileSync(
    join(testDir, 'chapters', `ch${String(i).padStart(2, '0')}.md`),
    text
  );
}

const t4Start = performance.now();
const scanner = new ContinuityScanner(join(testDir, 'data'), join(testDir, 'chapters'));
const scanResult = scanner.scanAll();
const t4End = performance.now();
const t4Time = Math.round((t4End - t4Start) * 100) / 100;
console.log(`  ✅ ${t4Time}ms — scan 20 chapters with 20 rules`);

// ─── SUMMARY ───
console.log('\n' + '═'.repeat(50));
console.log('📊 BENCHMARK SUMMARY\n');

const total = t1Time + t2Time + t3Time + t4Time;
console.log(`Total time: ${Math.round(total)}ms`);
console.log(`\nBreakdown:`);
console.log(`  Bible Manager .............. ${((t1Time/total)*100).toFixed(1)}% (${t1Time}ms)`);
console.log(`  Pacing Analyzer ............ ${((t2Time/total)*100).toFixed(1)}% (${t2Time}ms)`);
console.log(`  Style Analyzer ............ ${((t3Time/total)*100).toFixed(1)}% (${t3Time}ms)`);
console.log(`  Continuity Scanner ........ ${((t4Time/total)*100).toFixed(1)}% (${t4Time}ms)`);

console.log(`\nPerformance Grade:`);
if (total < 1000) {
  console.log('  ✅ EXCELLENT (<1s)');
} else if (total < 3000) {
  console.log('  ✅ GOOD (<3s)');
} else if (total < 5000) {
  console.log('  ⚠️ ACCEPTABLE (<5s)');
} else {
  console.log('  ❌ NEEDS OPTIMIZATION (>5s)');
}

console.log('\n' + '═'.repeat(50));
console.log('✅ BENCHMARK COMPLETE');
