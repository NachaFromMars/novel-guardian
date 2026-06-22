---
name: novel-guardian
description: "Trình bảo vệ liền mạch cho tiểu thuyết — quét mâu thuẫn, theo dõi nhịp truyện, kiểm tra giọng nhân vật, quản lý Kinh Điển. Tối ưu cho tiểu thuyết tiếng Việt."
version: "1.0.0"
author: "Tiểu Tâm × Nấng"
triggers:
  - novel guardian
  - kiểm tra liền mạch
  - quét mâu thuẫn
  - consistency check
  - character bible
  - kinh điển nhân vật
  - pacing analysis
  - nhịp truyện
  - voice profile
  - giọng nhân vật
  - continuity
  - plot hole
---

# 🛡️ Novel Guardian v1.0

**Trình bảo vệ liền mạch cho tiểu thuyết** — quét mâu thuẫn nhân vật/thời gian/thế giới, phân tích nhịp truyện, kiểm tra giọng văn, quản lý Kinh Điển Nhân Vật & Thế Giới.

> Tối ưu cho tiểu thuyết tiếng Việt. Không phụ thuộc API bên ngoài. Pure JavaScript (Node.js ESM).

## Tính Năng

| Module | Chức năng |
|--------|-----------|
| **Kinh Điển (Bible)** | Quản lý nhân vật, địa danh, phe phái, vật phẩm, sự kiện. Tìm kiếm, xuất Markdown/JSON. |
| **Quét liền mạch (Scanner)** | 20 quy tắc kiểm tra: thời gian, nhân vật, thế giới, mạch truyện. Quét 1 chương, khoảng, hoặc toàn bộ. |
| **Nhịp truyện (Pacing)** | 5 cấp nhịp (TĨNH→DÂNG→CĂNG→CAO TRÀO→HẠ NHIỆT). Biểu đồ ASCII. Phát hiện khuôn mẫu (đơn điệu, nhảy nhịp, sóng chuẩn...) |
| **Văn phong (Style)** | Thống kê từ vựng, câu, dấu câu. Phát hiện lệch giọng. Baseline tự động. |
| **Báo cáo (Report)** | Tổng hợp liền mạch + nhịp + văn phong. Markdown + JSON. |

## Cách Dùng

### Từ CLI

```bash
# Script nằm tại:
SCRIPT="skills/novel-guardian/scripts/novel-guardian.mjs"

# Khởi tạo dự án
node $SCRIPT init --name "Trọng Sinh Đường Tam Tạng" --project /path/to/novel

# Tạo nhân vật
node $SCRIPT bible create character --name "Trần Huyền Trang" --status alive --project /path/to/novel

# Quét mâu thuẫn
node $SCRIPT scan --project /path/to/novel
node $SCRIPT scan --chapter 5 --project /path/to/novel
node $SCRIPT scan --range 1-20 --project /path/to/novel

# Phân tích nhịp
node $SCRIPT pacing --project /path/to/novel
node $SCRIPT pacing --chapter 3 --project /path/to/novel

# Phân tích văn phong
node $SCRIPT style --project /path/to/novel

# Báo cáo tổng hợp
node $SCRIPT report --project /path/to/novel

# Quản lý Kinh Điển
node $SCRIPT bible list --project /path/to/novel
node $SCRIPT bible search "Huyền Trang" --project /path/to/novel
node $SCRIPT bible export --format md --project /path/to/novel
node $SCRIPT bible sync --project /path/to/novel
```

### Từ Agent (trong context forge)

Khi forge chương mới, chạy sau mỗi chương:

```
1. Quét liền mạch chương vừa viết:
   exec: node skills/novel-guardian/scripts/novel-guardian.mjs scan --chapter N --project /path

2. Nếu có lỗi CRITICAL → sửa trước khi ghi FINAL

3. Cập nhật Bible nếu có nhân vật/vật phẩm/sự kiện mới:
   exec: node ... bible create character --name "Tên" --status alive --project /path

4. Check nhịp:
   exec: node ... pacing --chapter N --project /path
```

## Cấu Trúc Thư Mục

```
novel-guardian/
├── SKILL.md                    # File này
├── README.md                   # Giới thiệu ngắn (npm)
├── LICENSE                     # MIT License
├── CHANGELOG.md                # Lịch sử thay đổi
├── INTEGRATION.md              # Hướng dẫn tích hợp Omni Forge Novel
├── RELEASE.md                  # Versioning + contributing
├── package.json                # npm package config
├── scripts/
│   ├── novel-guardian.mjs      # CLI chính (8 commands + --version)
│   ├── lib/
│   │   ├── utils.mjs           # Tiện ích (slugify, file I/O, đếm từ...)
│   │   ├── bible.mjs           # BibleManager — CRUD Kinh Điển
│   │   ├── rules.mjs           # 20 quy tắc kiểm tra liền mạch
│   │   ├── scanner.mjs         # ContinuityScanner — chạy rules lên chapters
│   │   ├── style-analyzer.mjs  # Phân tích văn phong tiếng Việt
│   │   └── pacing-analyzer.mjs # Phân tích nhịp truyện
│   ├── test-bible.mjs          # Test CRUD (11 tests)
│   ├── test-rules.mjs          # Test quy tắc (8 tests)
│   ├── test-scanner.mjs        # Test scanner (4 tests)
│   ├── test-style.mjs          # Test văn phong (6 tests)
│   ├── test-pacing.mjs         # Test nhịp (7 tests)
│   ├── benchmark.mjs           # Benchmark hiệu năng
│   └── build-package.sh        # Build tarball
├── examples/
│   └── truong-sinh-example-README.md
└── references/
    ├── bible-schema.md         # Lược đồ Kinh Điển (5 entity types)
    ├── pacing-model.md         # Mô hình 5 cấp nhịp
    └── voice-profiles.md       # Hồ sơ giọng nhân vật
```

**📊 Rule Status: 10 Active ✅ / 10 Planned 🔨**

## 20 Quy Tắc Kiểm Tra

### Thời gian (T01–T04)
| Mã | Mô tả | Mức | Trạng thái |
|----|--------|-----|-----------|
| T01 | Thời gian trong ngày lùi lại | ⚠️ warning | ✅ Active |
| T02 | Nhảy ngày không tuyên bố | 📝 note | ✅ Active |
| T03 | Dịch chuyển tức thời giữa địa danh | ⚠️ warning | ✅ Active |
| T04 | Thời gian di chuyển phi lý | ⚠️ warning | 🔨 Planned v1.1 |

### Nhân vật (C01–C07, V01)
| Mã | Mô tả | Mức | Trạng thái |
|----|--------|-----|-----------|
| C01 | Nhân vật chết sống lại | 🔴 critical | ✅ Active |
| C02 | Nhân vật bị phong ấn vẫn hành động | 🔴 critical | ✅ Active |
| C03 | Nhảy cấp lực lượng bất thường | ⚠️ warning | 🔨 Planned v1.1 |
| C04 | Tên/biệt danh không nhất quán | 📝 note | 🔨 Planned v1.1 |
| C05 | Nhân vật chính biến mất ≥3 chương | 📝 note | ✅ Active |
| C06 | Quan hệ mâu thuẫn | ⚠️ warning | 🔨 Planned v1.1 |
| C07 | Ngoại hình thay đổi không giải thích | 📝 note | 🔨 Planned v1.1 |
| V01 | Đại từ sai (xưng hô lệch) | ⚠️ warning | ✅ Active |

### Thế giới (W01–W04)
| Mã | Mô tả | Mức | Trạng thái |
|----|--------|-----|-----------|
| W01 | Quy tắc thế giới bị phá vỡ | 🔴 critical | 🔨 Planned v1.1 |
| W02 | Vật phẩm trùng chủ | ⚠️ warning | ✅ Active |
| W03 | Địa danh chưa đăng ký | 📝 note | 🔨 Planned v1.1 |
| W04 | Phe phái mâu thuẫn | ⚠️ warning | 🔨 Planned v1.1 |

### Mạch truyện (P01–P04)
| Mã | Mô tả | Mức | Trạng thái |
|----|--------|-----|-----------|
| P01 | Foreshadowing bỏ quên | ⚠️ warning | 🔨 Planned v1.1 |
| P02 | Deus ex machina | 📝 note | 🔨 Planned v1.1 |
| P03 | Lặp cốt truyện | 📝 note | 🔨 Planned v1.1 |
| P04 | Quá nhiều xung đột mở | ⚠️ warning | ✅ Active |

## Yêu Cầu

- **Node.js 18+** (ESM)
- **Không** cần API key hay dependencies bên ngoài
- Chương lưu dạng `.md` trong thư mục `chapters/`
- File naming: `ch01.md`, `chuong-01.md`, hoặc `chương_01.md` (regex tự nhận)

## Điểm Liền Mạch

Mỗi lần quét, hệ thống tính **Điểm Liền Mạch 0–100**:

```
Penalty = (critical × 10) + (warning × 3) + (note × 1)
Score = max(0, 100 - penalty)

A: ≥90 | B: ≥80 | C: ≥70 | D: ≥60 | F: <60
```

## Roadmap v1.1

- [ ] NER tự động (nhận diện thực thể từ text)
- [ ] Foreshadowing tracker
- [ ] Voice evolution (giọng thay đổi theo arc)
- [ ] Tích hợp trực tiếp vào Omni Forge Novel
- [ ] Web UI dashboard
