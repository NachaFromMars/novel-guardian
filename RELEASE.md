# 📦 Novel Guardian v1.0.0 — Release Notes

**Release Date:** 2026-03-10
**Author:** Tiểu Tâm × Nấng
**License:** MIT

---

## Version History

### v1.0.0 (2026-03-10) — Initial Release 🎉

Phiên bản đầu tiên với đầy đủ 5 module core:

**Tính năng chính:**
- ✅ **Kinh Điển (Bible Manager)** — CRUD 5 loại entity: character, location, faction, item, event
- ✅ **Quét Liền Mạch (Scanner)** — 20 quy tắc kiểm tra (4 thời gian, 8 nhân vật, 4 thế giới, 4 mạch truyện)
- ✅ **Nhịp Truyện (Pacing Analyzer)** — 5 cấp nhịp (TĨNH→DÂNG→CĂNG→CAO TRÀO→HẠ NHIỆT), biểu đồ ASCII
- ✅ **Văn Phong (Style Analyzer)** — Thống kê từ vựng, phát hiện lệch giọng, baseline tự động
- ✅ **Báo Cáo (Report)** — Tổng hợp Markdown + JSON, điểm liền mạch 0–100

**Hạ tầng:**
- ✅ 35 unit tests (5 test suites)
- ✅ Benchmark suite
- ✅ Example project (Trọng Sinh Đường Tam Tạng)
- ✅ 3 reference docs (Bible Schema, Pacing Model, Voice Profiles)
- ✅ Integration guide (Omni Forge, mula-ralph, mula-audit, superbuild)

**Số liệu:**
- 6 lib modules (~73KB source)
- 20 continuity rules
- 5 pacing levels + pattern detection
- Pure JavaScript ESM, zero dependencies

### Breaking Changes

**Không có** — đây là v1.0.0, chưa có API cũ nào để break.

### Deprecations

**Không có** — everything is fresh.

---

## Installation

### Yêu Cầu

- **Node.js** ≥ 18.0 (ESM support required)
- **Không** cần npm install — zero external dependencies
- **OS**: Linux, macOS, Windows (WSL recommended)

### Cách 1: Skill trong OpenClaw (Recommended)

```bash
# Clone/copy vào skills directory
cp -r novel-guardian ~/.openclaw/workspace/skills/

# Verify
node ~/.openclaw/workspace/skills/novel-guardian/scripts/novel-guardian.mjs --help
```

### Cách 2: Standalone

```bash
# Clone repository
git clone https://github.com/nacharium/novel-guardian.git
cd novel-guardian

# Chạy trực tiếp (không cần npm install)
node scripts/novel-guardian.mjs --help
```

### Cách 3: Trong dự án tiểu thuyết

```bash
# Từ root dự án tiểu thuyết
git submodule add https://github.com/nacharium/novel-guardian.git tools/guardian

# Khởi tạo
node tools/guardian/scripts/novel-guardian.mjs init --name "Tên Tiểu Thuyết" --project .
```

### Quick Verify

```bash
# Chạy tất cả tests
cd skills/novel-guardian/scripts
node test-bible.mjs && echo "✅ Bible: PASS"
node test-rules.mjs && echo "✅ Rules: PASS"
node test-scanner.mjs && echo "✅ Scanner: PASS"
node test-style.mjs && echo "✅ Style: PASS"
node test-pacing.mjs && echo "✅ Pacing: PASS"

# Chạy benchmark
node benchmark.mjs
```

---

## Package Info

| Field | Value |
|-------|-------|
| **Name** | `novel-guardian` |
| **Version** | `1.0.0` |
| **Type** | OpenClaw Skill |
| **Engine** | Node.js ≥ 18 (ESM) |
| **Dependencies** | None (zero deps) |
| **Author** | Tiểu Tâm × Nấng |
| **Repository** | `github.com/nacharium/novel-guardian` |
| **License** | MIT |

### Cấu Trúc Package

```
novel-guardian/
├── SKILL.md                    # Mô tả + YAML frontmatter
├── INTEGRATION.md              # Hướng dẫn tích hợp
├── RELEASE.md                  # File này
├── scripts/
│   ├── novel-guardian.mjs      # CLI chính (16.8KB)
│   ├── lib/
│   │   ├── utils.mjs           # Tiện ích (6.5KB)
│   │   ├── bible.mjs           # Bible Manager (12.2KB)
│   │   ├── rules.mjs           # 20 quy tắc (21.3KB)
│   │   ├── scanner.mjs         # Scanner engine (10.0KB)
│   │   ├── style-analyzer.mjs  # Phân tích văn phong (10.7KB)
│   │   └── pacing-analyzer.mjs # Phân tích nhịp (12.7KB)
│   ├── test-bible.mjs          # 11 tests
│   ├── test-rules.mjs          # 7 tests
│   ├── test-scanner.mjs        # 4 tests
│   ├── test-style.mjs          # 6 tests
│   ├── test-pacing.mjs         # 7 tests
│   └── benchmark.mjs           # Performance benchmark
├── data/                       # Template thư mục dữ liệu
│   ├── characters/
│   ├── pacing/
│   ├── reports/
│   ├── timeline/
│   ├── voices/
│   └── world/
├── examples/
│   └── truong-sinh-example-README.md
└── references/
    ├── bible-schema.md         # Lược đồ 5 entity types
    ├── pacing-model.md         # Mô hình 5 cấp nhịp
    └── voice-profiles.md       # Hồ sơ giọng nhân vật
```

---

## License & Attribution

### MIT License

```
Copyright (c) 2026 Tiểu Tâm × Nấng (Nacharium)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

### Attribution

- **Omni Forge Novel v1.0** — Hệ thống forge nền tảng (Mr Nấng / Nacharium / Tiểu Tâm)
- **mula-ralph** — Self-driving loop pattern (fork từ Anthropic Ralph Loop)
- **mula-audit** — Multi-agent review pattern (fork từ Anthropic code-review)
- **superbuild** — RPI methodology (fork từ claude-code-best-practice)
- **OpenClaw** — Runtime platform

---

## Contributing Guidelines

### Cách Đóng Góp

1. **Fork** repository
2. **Branch** từ `main`: `git checkout -b feature/ten-tinh-nang`
3. **Code** theo StepForge (4-6K tokens/step, verify mỗi step)
4. **Test** — chạy tất cả 5 test suites, đảm bảo PASS
5. **PR** với mô tả rõ ràng (tiếng Việt hoặc English)

### Quy Tắc Code

- **ESM only** — `import/export`, không dùng `require`
- **Zero dependencies** — không thêm npm packages
- **UTF-8** — mọi file, mọi nơi
- **Vietnamese-first** — comments, docs, variable names tiếng Việt OK
- **Test coverage** — mỗi feature mới phải có test tương ứng

### Thêm Quy Tắc Kiểm Tra Mới

```javascript
// Trong scripts/lib/rules.mjs
// Thêm rule mới vào đúng category

export const T05_newTimeRule = {
  id: 'T05',
  category: 'time',
  severity: 'warning',  // 'critical' | 'warning' | 'note'
  name: 'Tên quy tắc',
  check(chapter, bible, context) {
    const issues = [];
    // Logic kiểm tra...
    // issues.push({ rule: 'T05', severity: 'warning', message: '...', chapter: N });
    return issues;
  }
};

// Đăng ký trong RULES array
// Viết test trong test-rules.mjs
```

### Report Issues

- **Bug**: Mô tả rõ input, expected, actual
- **Feature request**: Use case + proposed solution
- **Improvement**: Benchmark before/after nếu có

---

## Versioning Scheme

Dùng **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

| Phần | Khi nào tăng | Ví dụ |
|------|-------------|-------|
| **MAJOR** | Breaking change (thay đổi API, format data) | 2.0.0 |
| **MINOR** | Tính năng mới, backward-compatible | 1.1.0 |
| **PATCH** | Bug fix, cải thiện nhỏ | 1.0.1 |

### Pre-release

```
1.1.0-beta.1  → Beta testing
1.1.0-rc.1    → Release candidate
1.1.0         → Stable
```

### Planned Versions

| Version | Nội dung dự kiến |
|---------|-----------------|
| **1.1.0** | NER tự động, Foreshadowing tracker |
| **1.2.0** | Voice evolution, Web UI dashboard |
| **2.0.0** | Tích hợp trực tiếp Omni Forge Novel v2.0 |

---

## Deployment Checklist

Trước mỗi release, kiểm tra:

- [ ] Tất cả 35 tests PASS (`test-bible`, `test-rules`, `test-scanner`, `test-style`, `test-pacing`)
- [ ] Benchmark chạy không regression (so với version trước)
- [ ] SKILL.md version number cập nhật
- [ ] RELEASE.md có entry cho version mới
- [ ] INTEGRATION.md vẫn chính xác
- [ ] Example project chạy được end-to-end
- [ ] `guardian.json` schema không thay đổi (hoặc có migration)
- [ ] Git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] References docs cập nhật nếu có thay đổi schema

### Release Commands

```bash
# 1. Verify
cd skills/novel-guardian
node scripts/test-bible.mjs
node scripts/test-rules.mjs
node scripts/test-scanner.mjs
node scripts/test-style.mjs
node scripts/test-pacing.mjs
node scripts/benchmark.mjs

# 2. Tag
git add -A
git commit -m "release: Novel Guardian v1.0.0"
git tag -a v1.0.0 -m "Novel Guardian v1.0.0 — Initial Release"

# 3. Push
git push origin main --tags

# 4. Verify tag
git describe --tags
```

---

*Novel Guardian v1.0.0 — Bảo vệ liền mạch cho mọi tiểu thuyết.* 🛡️
