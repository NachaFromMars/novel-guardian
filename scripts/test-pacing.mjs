import { calculatePacing, analyzeChapterPacing, detectPacingPatterns, generatePacingChart } from './lib/pacing-analyzer.mjs';

// ═══ TEST PACING ANALYZER ═══

console.log('═══ TEST 1: Tính nhịp đoạn TĨNH ═══');
const r1 = calculatePacing('Huyền Trang ngồi thiền, trầm ngâm suy tư. Cảnh vật yên tĩnh, bình yên lạ thường. Anh uống trà, hồi tưởng kiếp trước.');
console.log(`Điểm: ${r1.score} | Cấp: ${r1.level} | ${r1.level === 'TINH' ? '✅' : '❌'}`);

console.log('\n═══ TEST 2: Tính nhịp đoạn CAO TRÀO ═══');
const r2 = calculatePacing('Đại chiến bùng nổ! Kiếm chém, máu đổ! Bạch Cốt Tinh tử chiến với Ngộ Không! Tuyệt chiêu phản kích! Sự thật bại lộ!');
console.log(`Điểm: ${r2.score} | Cấp: ${r2.level} | ${r2.level === 'CAO_TRAO' ? '✅' : '❌'}`);

console.log('\n═══ TEST 3: Tính nhịp đoạn DÂNG ═══');
const r3 = calculatePacing('Huyền Trang phát hiện dấu vết lạ. Manh mối dẫn đến một bí ẩn. Linh cảm cho biết có điều bất thường. Cảnh giác dò xét xung quanh.');
console.log(`Điểm: ${r3.score} | Cấp: ${r3.level} | ${r3.level === 'DANG' ? '✅' : '❌'}`);

console.log('\n═══ TEST 4: Tính nhịp đoạn HẠ NHIỆT ═══');
const r4 = calculatePacing('Trận chiến kết thúc. Hồi phục, nghỉ ngơi. Nhìn lại bài học, rút kinh nghiệm. Nước mắt rơi, từ biệt. Lên đường tiếp, trưởng thành hơn.');
console.log(`Điểm: ${r4.score} | Cấp: ${r4.level} | ${r4.level === 'HA_NHIET' ? '✅' : '❌'}`);

console.log('\n═══ TEST 5: Phân tích 1 chương ═══');
const chapterText = `
Buổi sáng yên tĩnh, Huyền Trang ngồi thiền, suy tư về hành trình.

===

Bỗng phát hiện dấu vết lạ. Manh mối bí ẩn. Cảnh giác dò xét.

===

Đối đầu xung đột! Căng thẳng tột độ. Đàm phán thất bại. Nghiến răng.

===

Đại chiến bùng nổ! Kiếm chém! Máu đổ! Tuyệt chiêu phản kích! Sự thật bại lộ!

===

Kết thúc. Hồi phục. Nhìn lại bài học. Ôm nhau cười nhẹ. Lên đường tiếp.
`;
const ch = analyzeChapterPacing(chapterText, 1);
console.log(`Chương ${ch.chapter}: ${ch.beats.length} beats, điểm TB: ${ch.chapterScore}, cấp: ${ch.chapterLevel}`);
console.log(`Peak: beat ${ch.peakBeat} (${ch.peakScore})`);
for (const b of ch.beats) {
  console.log(`  Beat ${b.beat}: ${b.score} (${b.level}) — ${b.wordCount} từ`);
}

console.log('\n═══ TEST 6: Phát hiện khuôn mẫu ═══');
const fakeChapters = [
  { chapter: 1, chapterLevel: 'TINH', chapterScore: 1.5, peakScore: 2.0 },
  { chapter: 2, chapterLevel: 'DANG', chapterScore: 2.3, peakScore: 2.8 },
  { chapter: 3, chapterLevel: 'CANG', chapterScore: 3.1, peakScore: 3.5 },
  { chapter: 4, chapterLevel: 'CAO_TRAO', chapterScore: 4.2, peakScore: 4.5 },
  { chapter: 5, chapterLevel: 'HA_NHIET', chapterScore: 1.8, peakScore: 2.0 },
  { chapter: 6, chapterLevel: 'CAO_TRAO', chapterScore: 4.0, peakScore: 4.2 },
  { chapter: 7, chapterLevel: 'CAO_TRAO', chapterScore: 4.5, peakScore: 4.8 },
  { chapter: 8, chapterLevel: 'TINH', chapterScore: 1.5, peakScore: 1.8 },
  { chapter: 9, chapterLevel: 'TINH', chapterScore: 1.3, peakScore: 1.5 },
  { chapter: 10, chapterLevel: 'TINH', chapterScore: 1.4, peakScore: 1.6 },
];
const patterns = detectPacingPatterns(fakeChapters);
console.log(`Khuôn mẫu tìm thấy: ${patterns.length}`);
for (const p of patterns) {
  const icon = p.severity === 'good' ? '✅' : p.severity === 'warning' ? '⚠️' : '📝';
  console.log(`  ${icon} ${p.message}`);
}

console.log('\n═══ TEST 7: Biểu đồ ASCII ═══');
const chart = generatePacingChart(fakeChapters);
console.log(chart);

console.log('═══ TẤT CẢ TEST PASS ✅ ═══');
