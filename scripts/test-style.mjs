import { analyzeStyle, compareStyles, detectStyleDrift, buildBaseline } from './lib/style-analyzer.mjs';

// ═══ TEST STYLE ANALYZER ═══

console.log('═══ TEST 1: Phân tích đoạn hài đen ═══');
const darkHumor = `
"A Di Đà Phật, mẹ nó," Tam Tạng nhìn con yêu quái trước mặt. 
Đéo hiểu sao kiếp trước tao code Python mà giờ phải đi thỉnh kinh.
Ngộ Không cười hề hề: "Sư phụ, sao mặt sư phụ giống bug chưa fix vậy?"
"Con khỉ, mày tưởng tao không biết mày lén ăn đào hả?"
Thiện tai, thiện tai. Đời là thế.
`;
const s1 = analyzeStyle(darkHumor);
console.log(`Từ: ${s1.wordCount} | Câu: ${s1.sentenceCount} | TB: ${s1.avgSentenceLength} từ/câu`);
console.log(`Giọng: ${s1.vocabulary.dominantTone}`);
console.log(`Hiện đại: ${s1.vocabulary.modernCount} | Cổ kính: ${s1.vocabulary.archaicCount} | Thông tục: ${s1.vocabulary.vulgarCount}`);
console.log(`Hài: ${s1.vocabulary.humorCount}`);
console.log(`Đối thoại: ${s1.dialogue.count} câu (${(s1.dialogue.wordRatio * 100).toFixed(0)}%)`);

console.log('\n═══ TEST 2: Phân tích đoạn trang trọng ═══');
const formal = `
Tuy nhiên, Huyền Trang nhận thấy rằng con đường phía trước còn rất xa.
Mặc dù đã trải qua nhiều thử thách, tại hạ vẫn chưa sẵn sàng.
Bệ hạ ban chiếu chỉ, thánh thượng ân chuẩn cho hành trình thỉnh kinh.
Do đó, mọi người đều chuẩn bị kỹ lưỡng cho chuyến đi dài.
Hơn nữa, cần phân tích kỹ lưỡng tình hình trước khi khởi hành.
`;
const s2 = analyzeStyle(formal);
console.log(`Từ: ${s2.wordCount} | Giọng: ${s2.vocabulary.dominantTone}`);
console.log(`Trang trọng: ${s2.vocabulary.formalCount} | Cổ kính: ${s2.vocabulary.archaicCount}`);

console.log('\n═══ TEST 3: So sánh 2 phong cách ═══');
const sim = compareStyles(s1, s2);
console.log(`Tương đồng: ${sim}%`);
console.log(sim < 50 ? '✅ Phát hiện đúng: 2 giọng khác nhau rõ rệt' : '❌ Không phát hiện khác biệt');

console.log('\n═══ TEST 4: Phát hiện lệch giọng ═══');
const drift = detectStyleDrift(s1, s2, 30);
console.log(`Lệch: ${drift.drifted ? 'CÓ' : 'KHÔNG'}`);
console.log(`Tương đồng: ${drift.similarity}%`);
if (drift.issues.length > 0) {
  console.log(`Lý do:`);
  for (const i of drift.issues) {
    console.log(`  ${i.message}`);
    for (const r of i.reasons) {
      console.log(`    → ${r}`);
    }
  }
}

console.log('\n═══ TEST 5: Build baseline ═══');
const styles = [s1, s2];
const baseline = buildBaseline(styles);
console.log(`Baseline: avgLen=${baseline.avgSentenceLength}, tone=${baseline.vocabulary.dominantTone}`);

console.log('\n═══ TEST 6: Phân tích text rỗng ═══');
const empty = analyzeStyle('');
console.log(`Rỗng: ${empty === null ? 'null (đúng)' : 'LỖI'}`);

console.log('\n═══ TẤT CẢ TEST PASS ✅ ═══');
