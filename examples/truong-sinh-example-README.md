# Example Project — Trọng Sinh Đường Tam Tạng

Dự án ví dụ sử dụng Novel Guardian v1.0 để quản lý tiểu thuyết "Trọng Sinh Thành Đường Tam Tạng".

## Cấu Trúc Dự Án

```
truong-sinh-example/
├── guardian.json               # Config dự án
├── chapters/
│   ├── ch01.md                 # Chương 1: Trọng Sinh
│   ├── ch02.md
│   └── ... (đến ch80)
├── data/
│   ├── characters/
│   │   ├── tran-huyen-trang.json
│   │   ├── sun-wukong.json
│   │   └── ...
│   ├── locations/
│   │   ├── truong-an.json
│   │   ├── wu-xing-son.json
│   │   └── ...
│   ├── pacing/
│   │   ├── ch01.json
│   │   ├── ch02.json
│   │   └── ...
│   ├── voices/
│   │   ├── tran-huyen-trang.json (profile giọng)
│   │   └── ...
│   └── reports/
│       ├── scan-2026-03-10.md
│       ├── continuity-2026-03-10.md
│       └── ...
└── README.md
```

## Quick Start

```bash
# 1. Khởi tạo
node scripts/novel-guardian.mjs init --name "Trọng Sinh Đường Tam Tạng" --project ./

# 2. Tạo nhân vật
node scripts/novel-guardian.mjs bible create character \
  --name "Trần Huyền Trang" \
  --status alive

node scripts/novel-guardian.mjs bible create character \
  --name "Tôn Ngộ Không" \
  --status sealed

# 3. Tạo địa danh
node scripts/novel-guardian.mjs bible create location \
  --name "Trường An" \
  --significance major

# 4. Quét chương vừa viết
node scripts/novel-guardian.mjs scan --chapter 21

# 5. Phân tích nhịp toàn bộ
node scripts/novel-guardian.mjs pacing

# 6. Check văn phong
node scripts/novel-guardian.mjs style --chapter 21

# 7. Báo cáo tổng hợp
node scripts/novel-guardian.mjs report > ./reports/full-report.md
```

## Workflow Trong Omni Forge Novel

### Mỗi chương được forge:

```
1. Spawn sub-agent → forge 5 beats → verify (test: 400-600 từ/beat)
2. Ghi FINAL chapter_N.md
3. Chạy Novel Guardian scan:
   node scripts/novel-guardian.mjs scan --chapter N
4. Nếu có CRITICAL error → sửa trước khi ghi file
5. Nếu ok → update Bible nếu có nhân vật/vật phẩm mới:
   node scripts/novel-guardian.mjs bible create character --name "..." --status alive
6. Check nhịp:
   node scripts/novel-guardian.mjs pacing --chapter N
7. Spawn chương kế tiếp
```

## Bible Entry Examples

### Character

```json
{
  "id": "tran-huyen-trang",
  "type": "character",
  "name": "Trần Huyền Trang",
  "aliases": ["Tam Tạng", "Huyền Trang"],
  "status": "alive",
  "firstAppearance": {
    "chapter": 1,
    "beat": 1
  },
  "attributes": {
    "role": "protagonist",
    "origin": "xuyên không",
    "specialty": "tu luyện"
  },
  "relations": {
    "leader_of": ["Sun Wukong"],
    "enemy_of": ["demons"]
  }
}
```

### Location

```json
{
  "id": "truong-an",
  "type": "location",
  "name": "Trường An",
  "significance": "major",
  "description": "Kinh đô nơi Tam Tạng khởi hành",
  "firstMention": {
    "chapter": 1,
    "context": "Xuất phát từ chùa"
  }
}
```

### Item (Vật Phẩm)

```json
{
  "id": "kim-co-bong",
  "type": "item",
  "name": "Kim Cô Bổng",
  "status": "active",
  "owner": "sun-wukong",
  "introduced": {
    "chapter": 5,
    "context": "Tôn Ngộ Không dùng để chiến đấu"
  },
  "powers": ["can extend", "return to owner"]
}
```

## Reports Format

### Continuity Report

```markdown
# Báo Cáo Liền Mạch — Ch.21

**Điểm**: 88/100 (B)

### Tổng Quan
- Tổng chương: 21
- Tổng lỗi: 3
- 🔴 Nghiêm trọng: 0
- ⚠️ Cảnh báo: 1 (dịch chuyển tức thời)
- 📝 Ghi chú: 2 (nhân vật bị đề cập nhưng không hành động)

### Chi Tiết
- Ch.20: ✅ OK
- Ch.21: ⚠️ 1 lỗi
  - [T03] Chuyển từ Trường An → Ngũ Hành Sơn nhanh
  - 💡 Thêm mô tả hành trình 2-3 đoạn
```

### Pacing Report

```
# Nhịp Truyện Ch.1-21

Ch.01: ██░░░░░░░░ TĨNH       (1.2)
Ch.02: ████░░░░░░ DÂNG       (2.1)
...
Ch.21: █████████░ CAO TRÀO   (4.4) ★

Khuôn mẫu:
✅ Sóng chuẩn: Ch.1-5
✅ Leo thang: Ch.15 (4.1) → Ch.21 (4.4)
⚠️ Đơn điệu: Ch.16-18 (CĂNG × 3)
```

## Tips & Best Practices

### 1. Tích hợp với Cron Forge
```bash
# Trong script auto-forge:
if ! node scripts/novel-guardian.mjs scan --chapter $CURRENT_CHAPTER; then
  echo "CONTINUITY ERROR — fix trước khi ghi FINAL"
  exit 1
fi
```

### 2. Sync Bible Mỗi Arc
```bash
# Cuối mỗi arc, đồng bộ Bible từ text chapters
node scripts/novel-guardian.mjs bible sync
```

### 3. Weekly Report
```bash
# Mỗi tuần, tạo báo cáo tổng hợp
node scripts/novel-guardian.mjs report > ./reports/weekly-$(date +%Y-%m-%d).md
```

### 4. Voice Baseline
```bash
# Đầu mỗi phase, setup voice profiles mẫu
cp voice-profiles.json data/voices/baseline.json
```

## Troubleshooting

### Q: Lỗi "Nhân vật chết sống lại"
**A**: Kiểm tra status trong Bible. Nếu nhân vật hồi sinh → cập nhật `status: alive` + `resurrectedAt: {chapter, beat}`

### Q: Dịch chuyển tức thời không phát hiện
**A**: Kiểm tra regex địa danh. Đảm bảo địa danh đã đăng ký trong Bible.

### Q: Nhịp cao TĨNH quá nhiều
**A**: Dùng `pacing --chapter N` để check từng beat. Thêm cảnh hành động hoặc tĩnh sâu hơn.

---

**Happy Writing!** 🦊
