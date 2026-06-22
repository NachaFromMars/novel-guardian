# 🔗 Novel Guardian v1.0 — Integration Guide

Hướng dẫn tích hợp Novel Guardian với hệ sinh thái OpenClaw skills.

---

## 1. Tích Hợp Với Omni Forge Novel v2.0

Novel Guardian hoạt động như **lớp kiểm duyệt tự động** trong pipeline forge chương.

### Workflow: Forge + Guard

```
Omni Forge Novel (viết)  →  Novel Guardian (kiểm)  →  FINAL output
     FORGE+C 2.0               scan + pacing            chapter.md
```

### Chèn vào quy trình FORGE+C

Sau bước **Render** (beat → prose), thêm bước **Guard** trước khi ghi FINAL:

```bash
SCRIPT="skills/novel-guardian/scripts/novel-guardian.mjs"
PROJECT="/path/to/novel"

# Bước 1: Forge xong chương N → file tạm
# (Omni Forge Novel đã render 5 beats → chapter_N_draft.md)

# Bước 2: Copy draft vào chapters/ để Guardian quét
cp chapter_N_draft.md "$PROJECT/chapters/ch$(printf '%02d' $N).md"

# Bước 3: Quét liền mạch
node $SCRIPT scan --chapter $N --project "$PROJECT"

# Bước 4: Nếu có CRITICAL → sửa trước khi ghi FINAL
# Bước 5: Phân tích nhịp
node $SCRIPT pacing --chapter $N --project "$PROJECT"

# Bước 6: Cập nhật Bible nếu có entity mới
node $SCRIPT bible create character --name "Tên Mới" --status alive --project "$PROJECT"
```

### Trong Agent Context (Omni Forge Novel)

```
Sau mỗi chương forge:
1. exec: node skills/novel-guardian/scripts/novel-guardian.mjs scan --chapter N --project /path
2. Đọc output → nếu 🔴 CRITICAL → sửa prose → quét lại
3. exec: node ... pacing --chapter N --project /path
4. Nếu nhịp bất thường → điều chỉnh beat tiếp theo
5. exec: node ... bible create [type] --name "..." --project /path
6. PASS → ghi FINAL chapter
```

---

## 2. Tích Hợp Với mula-ralph (Self-Driving Loop)

Dùng Ralph loop để **tự động forge + guard nhiều chương liên tục**.

### Kịch bản: Auto-Forge 10 Chương

```bash
# Khởi tạo Ralph loop
node skills/mula-ralph/scripts/mula-ralph.mjs init \
  --mission "forge-chapters-11-20" \
  --prompt "Forge chương {i} của tiểu thuyết. Sau khi forge xong, chạy:
    node skills/novel-guardian/scripts/novel-guardian.mjs scan --chapter {i} --project /path/to/novel
    Nếu CRITICAL → sửa. Nếu PASS → trả <done>CHAPTER_{i}_COMPLETE</done>"
```

### Loop Flow

```
Ralph init → spawn sub-agent (forge ch.11)
  ↓
Sub-agent: forge beats → render prose → Guardian scan
  ↓
Scan OK? → <done>CHAPTER_11_COMPLETE</done> → Ralph iterate
  ↓
Scan FAIL? → sửa prose → scan lại → loop nội bộ
  ↓
Ralph detect promise → next iteration (ch.12)
  ↓
Stuck 3 lần? → inject warning
Circuit breaker 5 lần? → force exit
```

### Tích hợp trong prompt Ralph

```
QUY TRÌNH mỗi iteration:
1. Forge 5 beats (400-600 từ/beat) cho chương {current}
2. Ghi file chapters/ch{NN}.md
3. Chạy: node skills/novel-guardian/scripts/novel-guardian.mjs scan --chapter {current} --project {path}
4. Nếu score < 70 → sửa lỗi CRITICAL/WARNING → quét lại
5. Nếu score ≥ 70 → cập nhật Bible → trả <done>CH_{current}_DONE</done>
```

---

## 3. Tích Hợp Với mula-audit (Code Review)

Dùng mula-audit để **review chất lượng code** của Novel Guardian scripts.

### Audit Scripts Novel Guardian

```bash
# Init audit
node skills/mula-audit/scripts/mula-audit.mjs init \
  --target "skills/novel-guardian/scripts/" \
  --name "novel-guardian-audit"

# Spawn 6 reviewers (hoặc 3 quick mode)
# Agent orchestrate theo SKILL.md của mula-audit

# Focus areas cho novel-guardian:
# - bug-hunter: regex rules, edge cases Unicode tiếng Việt
# - test-auditor: coverage cho 5 test suites (35 tests)
# - silent-failure-hunter: file I/O errors, missing chapters
```

### Khi Nào Audit

- Sau khi thêm quy tắc mới vào `rules.mjs`
- Sau khi sửa `scanner.mjs` hoặc `pacing-analyzer.mjs`
- Trước release version mới
- PR từ contributor

---

## 4. Tích Hợp Với superbuild (Project Setup)

Dùng SuperBuild RPI khi **mở rộng Novel Guardian** (thêm module, refactor lớn).

### Quy Trình Mở Rộng

```
SuperBuild RPI:
  Research → "Thêm NER tự động có khả thi không?"
  Plan → Milestones, dependencies, timeline
  Implement → StepForge (4-6K/step, verify, gate)
```

### Ví dụ: Thêm Module Foreshadowing Tracker

```bash
# 1. Research
# Đọc references/context-engineering.md từ superbuild
# Đánh giá: scope, effort, dependencies

# 2. Plan → PLAN.md
# Milestone 1: Data model cho foreshadowing entries
# Milestone 2: Detection rules (P01 mở rộng)
# Milestone 3: Resolution tracker
# Milestone 4: Tests + integration

# 3. Implement theo StepForge
# Mỗi step 4-6K tokens, verify mỗi step, gate cứng
```

---

## 5. Pre-Commit Hooks (Auto-Scan Trước Ghi)

Tự động quét liền mạch trước khi commit chapter mới.

### Git Hook: `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Novel Guardian pre-commit hook
# Auto-scan chapters trước khi commit

SCRIPT="skills/novel-guardian/scripts/novel-guardian.mjs"
PROJECT="."  # Thay bằng path dự án

# Tìm chapter files đã staged
CHAPTERS=$(git diff --cached --name-only | grep -E 'chapters/ch[0-9]+\.md')

if [ -z "$CHAPTERS" ]; then
  exit 0  # Không có chapter thay đổi
fi

echo "🛡️ Novel Guardian: Quét liền mạch..."

for chapter_file in $CHAPTERS; do
  # Trích số chương từ filename
  ch_num=$(echo "$chapter_file" | grep -oP '\d+')
  
  # Quét
  result=$(node "$SCRIPT" scan --chapter "$ch_num" --project "$PROJECT" 2>&1)
  
  # Kiểm tra CRITICAL
  if echo "$result" | grep -q "🔴"; then
    echo "❌ CRITICAL error tại $chapter_file:"
    echo "$result" | grep "🔴"
    echo "Sửa lỗi trước khi commit."
    exit 1
  fi
done

echo "✅ Novel Guardian: PASS — commit được."
exit 0
```

### Cài đặt

```bash
# Copy hook
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Test
echo "Test chapter" > chapters/ch99.md
git add chapters/ch99.md
git commit -m "test"  # → Guardian sẽ quét
```

---

## 6. Environment Variables & Config

### guardian.json (Project Config)

```json
{
  "name": "Trọng Sinh Đường Tam Tạng",
  "version": "1.0.0",
  "chaptersDir": "chapters",
  "dataDir": "data",
  "settings": {
    "minScore": 70,
    "blockOnCritical": true,
    "autoSyncBible": false,
    "pacingWindow": 5,
    "styleBaseline": "auto"
  }
}
```

### Environment Variables

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `NG_PROJECT` | `.` | Đường dẫn dự án |
| `NG_MIN_SCORE` | `70` | Điểm tối thiểu để PASS |
| `NG_BLOCK_CRITICAL` | `true` | Chặn khi có lỗi CRITICAL |
| `NG_VERBOSE` | `false` | Log chi tiết |

```bash
# Ví dụ
NG_PROJECT=/path/to/novel NG_MIN_SCORE=80 node $SCRIPT scan
```

---

## 7. CI/CD Pipeline Template

### GitHub Actions: `.github/workflows/novel-guardian.yml`

```yaml
name: Novel Guardian CI

on:
  push:
    paths: ['chapters/**']
  pull_request:
    paths: ['chapters/**']

jobs:
  guardian-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Quét liền mạch
        run: |
          node skills/novel-guardian/scripts/novel-guardian.mjs scan --project .
          
      - name: Phân tích nhịp
        run: |
          node skills/novel-guardian/scripts/novel-guardian.mjs pacing --project .

      - name: Báo cáo tổng hợp
        run: |
          node skills/novel-guardian/scripts/novel-guardian.mjs report --project . > report.md

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: guardian-report
          path: report.md

      - name: Check threshold
        run: |
          SCORE=$(node skills/novel-guardian/scripts/novel-guardian.mjs scan --project . 2>&1 | grep -oP 'Score: \K\d+')
          if [ "$SCORE" -lt "${NG_MIN_SCORE:-70}" ]; then
            echo "❌ Score $SCORE < threshold"
            exit 1
          fi
```

---

## 8. Troubleshooting

### Lỗi thường gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| `Error: No chapters found` | Thư mục `chapters/` trống hoặc sai path | Kiểm tra `--project` path, đảm bảo file naming `ch01.md` |
| `guardian.json not found` | Chưa init project | Chạy `node $SCRIPT init --name "..." --project /path` |
| Regex không match tiếng Việt | Encoding file không phải UTF-8 | Chuyển sang UTF-8: `iconv -f WINDOWS-1252 -t UTF-8 file.md > file_utf8.md` |
| Bible sync bỏ sót nhân vật | Tên nhân vật có dấu đặc biệt | Thêm alias trong Bible: `"aliases": ["Tôn Ngộ Không", "Ngộ Không"]` |
| Pacing trả về toàn TĨNH | Chương quá ngắn (<300 từ) | Đảm bảo mỗi chương ≥500 từ để phân tích chính xác |
| Score = 0 dù không có lỗi | Lỗi parse output | Chạy với `NG_VERBOSE=true` để xem log chi tiết |

### Debug Mode

```bash
# Log chi tiết
NG_VERBOSE=true node $SCRIPT scan --chapter 5 --project /path

# Quét chương cụ thể
node $SCRIPT scan --chapter 5 --project /path

# Export Bible để kiểm tra
node $SCRIPT bible export --format json --project /path > bible-debug.json
```

### Tương thích

- **Node.js**: ≥18.0 (ESM required)
- **OS**: Linux, macOS, Windows (WSL recommended)
- **Encoding**: UTF-8 only
- **File naming**: `ch01.md`, `chuong-01.md`, `chương_01.md` (regex tự nhận)

---

*Tích hợp thêm? Mở issue hoặc PR tại repository.* 🛡️
