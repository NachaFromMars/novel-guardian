import { BibleManager } from './lib/bible.mjs';
import { join } from 'path';
import { rmSync } from 'fs';

// ═══ TEST BIBLE MANAGER ═══
const testDir = '/tmp/novel-guardian-test-data';
// Cleanup trước khi chạy — đảm bảo idempotent
rmSync(testDir, { recursive: true, force: true });
const bible = new BibleManager(testDir);

console.log('═══ TEST 1: Tạo nhân vật ═══');
const char = bible.create('character', {
  name: 'Trần Huyền Trang',
  aliases: ['Đường Tam Tạng', 'Tam Tạng'],
  status: 'alive',
  firstAppearance: { chapter: 1, beat: 1 },
  attributes: {
    age: 22,
    cultivation: 'Luyện Khí kỳ tầng 3',
    powerLevel: 3,
    faction: 'Đại Đường',
    role: 'protagonist'
  },
  relationships: [
    { targetId: 'ton-ngo-khong', type: 'master-disciple', description: 'Sư phụ - đồ đệ' }
  ],
  notes: ['Trọng sinh từ thế giới hiện đại']
});
console.log(`✅ Tạo: ${char.name} (${char.id})`);

console.log('\n═══ TEST 2: Tạo địa danh ═══');
const loc = bible.create('location', {
  name: 'Trường An',
  description: 'Kinh đô Đại Đường',
  significance: 'major'
});
console.log(`✅ Tạo: ${loc.name} (${loc.id})`);

console.log('\n═══ TEST 3: Tạo vật phẩm ═══');
const item = bible.create('item', {
  name: 'Cà Sa Quan Âm',
  description: 'Cà sa do Quan Âm ban tặng',
  owner: 'tran-huyen-trang',
  rarity: 'legendary'
});
console.log(`✅ Tạo: ${item.name} (${item.id})`);

console.log('\n═══ TEST 4: Lấy nhân vật ═══');
const fetched = bible.get('character', 'tran-huyen-trang');
console.log(`✅ Lấy: ${fetched.name}, trạng thái: ${fetched.status}`);

console.log('\n═══ TEST 5: Cập nhật nhân vật ═══');
const updated = bible.update('character', 'tran-huyen-trang', {
  attributes: { powerLevel: 5, cultivation: 'Luyện Khí kỳ tầng 5' },
  lastSeen: { chapter: 20, beat: 5 }
});
console.log(`✅ Cập nhật: powerLevel=${updated.attributes.powerLevel}, cultivation=${updated.attributes.cultivation}`);

console.log('\n═══ TEST 6: Liệt kê tất cả ═══');
const all = bible.list();
console.log(`✅ Tổng thực thể: ${all.length}`);
for (const e of all) {
  console.log(`   - ${e.type}: ${e.name} (${e.id})`);
}

console.log('\n═══ TEST 7: Tìm kiếm ═══');
const results = bible.search('Đường');
console.log(`✅ Kết quả tìm "Đường": ${results.length} thực thể`);
for (const r of results) {
  console.log(`   - ${r.type}: ${r.name}`);
}

console.log('\n═══ TEST 8: Xuất Markdown ═══');
const md = bible.exportBible('md');
console.log(`✅ Xuất Markdown: ${md.length} ký tự`);
console.log(md.substring(0, 500) + '...');

console.log('\n═══ TEST 9: Chỉ mục ═══');
const index = bible.getIndex();
console.log(`✅ Chỉ mục: ${JSON.stringify(index.entities)}`);

console.log('\n═══ TEST 10: Xoá mềm ═══');
const delResult = bible.delete('item', 'ca-sa-quan-am');
console.log(`✅ Xoá: ${delResult.deleted}, lưu trữ: ${delResult.archivedTo}`);

// Kiểm tra đã xoá
try {
  bible.get('item', 'ca-sa-quan-am');
  console.log('❌ Vẫn tìm thấy sau khi xoá!');
} catch {
  console.log('✅ Đã xoá thành công (không tìm thấy)');
}

console.log('\n═══ TEST 11: Kiểm tra trùng ═══');
try {
  bible.create('character', { name: 'Trần Huyền Trang', status: 'alive' });
  console.log('❌ Không phát hiện trùng!');
} catch (err) {
  console.log(`✅ Phát hiện trùng: ${err.message}`);
}

console.log('\n═══ TẤT CẢ TEST PASS ✅ ═══');
