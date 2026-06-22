import { BibleManager } from './lib/bible.mjs';
import { RULES, extractTimeMarkers, timeLabel } from './lib/rules.mjs';
import { rmSync } from 'fs';

// ═══ TEST BỘ QUY TẮC ═══
const testDir = '/tmp/ng-rules-test';
// Cleanup trước khi chạy — đảm bảo idempotent
rmSync(testDir, { recursive: true, force: true });
const bible = new BibleManager(testDir);

// Tạo dữ liệu test
bible.create('character', {
  name: 'Trần Huyền Trang',
  aliases: ['Tam Tạng'],
  status: 'alive',
  firstAppearance: { chapter: 1, beat: 1 },
  attributes: { role: 'protagonist' }
});

bible.create('character', {
  name: 'Bạch Cốt Tinh',
  status: 'dead',
  firstAppearance: { chapter: 10, beat: 1 }
});

bible.create('character', {
  name: 'Tôn Ngộ Không',
  aliases: ['Ngộ Không', 'Tề Thiên'],
  status: 'sealed',
  firstAppearance: { chapter: 1, beat: 3 }
});

bible.create('location', {
  name: 'Trường An',
  significance: 'major',
  description: 'Kinh đô'
});

bible.create('location', {
  name: 'Ngũ Hành Sơn',
  significance: 'major',
  description: 'Nơi phong ấn Ngộ Không'
});

bible.create('item', {
  name: 'Kim Cô Bổng',
  status: 'active',
  owner: 'ton-ngo-khong'
});

// ─── Test T01: Trình tự thời gian ───

console.log('═══ TEST T01: Trình tự thời gian ═══');
const textBadTime = `
Buổi sáng hôm đó, Tam Tạng ra khỏi chùa.
Gặp yêu quái vào buổi chiều.
Bỗng rạng đông hôm ấy, trời sáng rực.
`;
const ctx1 = { chapter: { number: 5, text: textBadTime }, bible };
const r1 = RULES.find(r => r.id === 'T01').check(ctx1);
console.log(`Kết quả: ${r1.passed ? 'PASS' : 'FAIL'}, Lỗi: ${r1.issues.length}`);
if (r1.issues.length > 0) {
  console.log(`   ⚠️ ${r1.issues[0].message}`);
}

// ─── Test T02: Nhảy ngày ───

console.log('\n═══ TEST T02: Nhảy ngày ═══');
const textDayJump = `
Ban đêm, Huyền Trang ngồi thiền.
Buổi sáng, mọi người lên đường.
`;
const ctx2 = { chapter: { number: 6, text: textDayJump }, bible };
const r2 = RULES.find(r => r.id === 'T02').check(ctx2);
console.log(`Kết quả: ${r2.passed ? 'PASS (có lỗi)' : 'FAIL'}, Lỗi: ${r2.issues.length}`);
if (r2.issues.length > 0) {
  console.log(`   📝 ${r2.issues[0].message}`);
}

// ─── Test C01: Nhân vật chết sống lại ───

console.log('\n═══ TEST C01: Nhân vật chết sống lại ═══');
const textDeadAlive = `
Bạch Cốt Tinh bước ra từ hang động, mỉm cười.
"Ta đã chờ ngươi lâu lắm rồi, Tam Tạng."
`;
const ctx3 = { chapter: { number: 15, text: textDeadAlive }, bible };
const r3 = RULES.find(r => r.id === 'C01').check(ctx3);
console.log(`Kết quả: ${r3.passed ? 'PASS' : 'PHÁT HIỆN LỖI'}, Lỗi: ${r3.issues.length}`);
if (r3.issues.length > 0) {
  console.log(`   🔴 ${r3.issues[0].message}`);
}

// ─── Test C01 (flashback — không nên báo lỗi) ───

console.log('\n═══ TEST C01b: Flashback (không báo lỗi) ═══');
const textFlashback = `
Huyền Trang nhớ lại ngày xưa, Bạch Cốt Tinh từng là mối đe doạ lớn.
`;
const ctx3b = { chapter: { number: 16, text: textFlashback }, bible };
const r3b = RULES.find(r => r.id === 'C01').check(ctx3b);
console.log(`Kết quả: ${r3b.passed ? 'PASS (đúng — flashback)' : 'FAIL (báo nhầm)'}, Lỗi: ${r3b.issues.length}`);

// ─── Test C02: Nhân vật bị phong ấn vẫn hành động ───

console.log('\n═══ TEST C02: Bị phong ấn vẫn hành động ═══');
const textSealed = `
Tôn Ngộ Không nhảy lên không trung, vung Kim Cô Bổng đánh yêu quái.
`;
const ctx4 = { chapter: { number: 3, text: textSealed }, bible };
const r4 = RULES.find(r => r.id === 'C02').check(ctx4);
console.log(`Kết quả: ${r4.passed ? 'PASS' : 'PHÁT HIỆN LỖI'}, Lỗi: ${r4.issues.length}`);
if (r4.issues.length > 0) {
  console.log(`   🔴 ${r4.issues[0].message}`);
}

// ─── Test T03: Dịch chuyển tức thời ───

console.log('\n═══ TEST T03: Dịch chuyển tức thời ═══');
const textTeleport = `
Tại Trường An, Huyền Trang đang uống trà. Bỗng nhiên tại Ngũ Hành Sơn, gió thổi mạnh.
`;
const ctx5 = { chapter: { number: 7, text: textTeleport }, bible };
const r5 = RULES.find(r => r.id === 'T03').check(ctx5);
console.log(`Kết quả: ${r5.passed ? 'PASS' : 'PHÁT HIỆN LỖI'}, Lỗi: ${r5.issues.length}`);
if (r5.issues.length > 0) {
  console.log(`   ⚠️ ${r5.issues[0].message}`);
}

// ─── Test W02: Vật phẩm trùng chủ ───

console.log('\n═══ TEST W02: Vật phẩm trùng chủ ═══');
const textItemSwap = `
Tam Tạng cầm Kim Cô Bổng lên, vung thử một cái.
`;
const ctx6 = { chapter: { number: 8, text: textItemSwap }, bible };
const r6 = RULES.find(r => r.id === 'W02').check(ctx6);
console.log(`Kết quả: ${r6.passed ? 'PASS' : 'PHÁT HIỆN LỖI'}, Lỗi: ${r6.issues.length}`);
if (r6.issues.length > 0) {
  console.log(`   ⚠️ ${r6.issues[0].message}`);
}

// ─── Thống kê quy tắc ───

console.log('\n═══ THỐNG KÊ QUY TẮC ═══');
console.log(`Tổng số quy tắc: ${RULES.length}`);
const byCategory = {};
for (const r of RULES) {
  byCategory[r.category] = (byCategory[r.category] || 0) + 1;
}
for (const [cat, count] of Object.entries(byCategory)) {
  console.log(`  ${cat}: ${count} quy tắc`);
}

console.log('\n═══ extractTimeMarkers test ═══');
const markers = extractTimeMarkers('Bình minh, Huyền Trang thức dậy. Buổi chiều gặp yêu quái. Ban đêm ngồi thiền.');
console.log(`Tìm thấy ${markers.length} mốc thời gian:`);
for (const m of markers) {
  console.log(`  ${timeLabel(m.time)} — "${m.matched}" tại vị trí ${m.position}`);
}

console.log('\n═══ TẤT CẢ TEST HOÀN TẤT ✅ ═══');
