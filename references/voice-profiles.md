# Hồ Sơ Giọng Nhân Vật — Novel Guardian v1.0

Tài liệu định nghĩa cấu trúc hồ sơ giọng (voice profile) cho mỗi nhân vật,
cách trích xuất và so sánh giọng giữa các nhân vật.

---

## 1. Lược Đồ Hồ Sơ Giọng

Lưu tại `data/voices/{character-id}.json`:

```json
{
  "schemaVersion": "1.0",
  "characterId": "tran-huyen-trang",
  "characterName": "Trần Huyền Trang",
  "isNarrator": true,

  "pronouns": {
    "self": "tao",
    "selfFormal": "bần tăng",
    "others": {
      "ton-ngo-khong": "con khỉ",
      "duong-thai-tong": "Bệ hạ"
    }
  },

  "vocabulary": {
    "level": "mixed",
    "formalWords": ["bần tăng", "A Di Đà Phật", "thí chủ", "thiện tai"],
    "casualWords": ["đéo", "mẹ nó", "lol", "ối giời ơi"],
    "modernWords": ["bug", "nerf", "buff", "meta", "speedrun"],
    "domainWords": ["Phật pháp", "kinh kệ", "tu luyện", "công đức"],
    "forbiddenWords": []
  },

  "speechPatterns": {
    "averageSentenceLength": 12,
    "shortSentenceRatio": 0.4,
    "questionFrequency": 0.15,
    "exclamationFrequency": 0.2,
    "ellipsisFrequency": 0.1,
    "emDashFrequency": 0.05
  },

  "humor": {
    "type": "dark-sarcastic",
    "frequency": "high",
    "targets": ["bản thân", "tình huống", "kẻ thù"],
    "avoids": ["nạn nhân yếu", "người vô tội"]
  },

  "catchphrases": [
    "A Di Đà Phật, mẹ nó",
    "Tu luyện cái đéo gì",
    "Kiếp trước tao code Python"
  ],

  "emotionalRange": {
    "anger": "controlled-sarcastic",
    "fear": "rational-planning",
    "joy": "subtle-smirk",
    "sadness": "philosophical",
    "surprise": "modern-slang-outburst"
  },

  "dialogueStyle": {
    "openingPatterns": ["Này", "Ê", "A Di Đà Phật"],
    "closingPatterns": ["...rồi sao?", "Thiện tai.", "Đi thôi."],
    "responseToThreat": "mocking-then-strategic",
    "responseToCompliment": "deflect-with-humor"
  },

  "sampleDialogues": [
    {
      "chapter": 3,
      "context": "Đối đầu yêu quái",
      "line": "A Di Đà Phật, thí chủ à, tao không muốn đánh nhau. Nhưng mà mày cứ đứng chắn đường thế thì... mẹ nó, đánh thôi.",
      "mood": "reluctant-combat"
    },
    {
      "chapter": 7,
      "context": "Nói chuyện với Ngộ Không",
      "line": "Con khỉ, mày tưởng tao không biết mày lén ăn đào hả? Kiếp trước tao có đọc script rồi.",
      "mood": "teasing"
    }
  ],

  "statistics": {
    "totalDialogues": 145,
    "totalWords": 8500,
    "uniqueWords": 1200,
    "analyzedChapters": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    "lastUpdated": "2026-03-10T17:33:00Z"
  },

  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

---

## 2. Các Trường Chi Tiết

### 2.1 Đại từ (`pronouns`)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `self` | string | Cách xưng hô chính (tao, ta, tôi, em, con...) |
| `selfFormal` | string | Xưng hô trang trọng (bần tăng, tiểu sinh...) |
| `others` | object | Cách gọi từng nhân vật khác `{ id: cách gọi }` |

### 2.2 Vốn từ (`vocabulary`)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `level` | enum | `"formal"` / `"casual"` / `"vulgar"` / `"mixed"` / `"archaic"` |
| `formalWords` | string[] | Từ trang trọng đặc trưng |
| `casualWords` | string[] | Từ thông tục, đời thường |
| `modernWords` | string[] | Từ hiện đại (nếu nhân vật xuyên không) |
| `domainWords` | string[] | Từ chuyên ngành (Phật pháp, võ thuật, y thuật...) |
| `forbiddenWords` | string[] | Từ nhân vật này KHÔNG BAO GIỜ nói |

### 2.3 Khuôn mẫu lời nói (`speechPatterns`)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `averageSentenceLength` | number | Số từ trung bình / câu trong đối thoại |
| `shortSentenceRatio` | number | Tỷ lệ câu ngắn (<8 từ) / tổng câu |
| `questionFrequency` | number | Tỷ lệ câu hỏi / tổng câu |
| `exclamationFrequency` | number | Tỷ lệ câu cảm thán |
| `ellipsisFrequency` | number | Tỷ lệ câu dùng dấu ba chấm |
| `emDashFrequency` | number | Tỷ lệ câu dùng gạch ngang |

### 2.4 Hài hước (`humor`)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `type` | string | Kiểu hài: `"dark-sarcastic"` / `"slapstick"` / `"wordplay"` / `"deadpan"` / `"none"` |
| `frequency` | enum | `"none"` / `"low"` / `"medium"` / `"high"` |
| `targets` | string[] | Đối tượng hài hước hướng tới |
| `avoids` | string[] | Đối tượng không đùa |

---

## 3. Quy Tắc Kiểm Tra Nhất Quán Giọng

### 3.1 Quy tắc CỨNG (vi phạm = CẢNH BÁO)

| Mã | Quy tắc | Mô tả |
|----|---------|-------|
| V01 | Đại từ sai | Nhân vật dùng đại từ không phải của mình |
| V02 | Từ cấm | Nhân vật nói từ trong `forbiddenWords` |
| V03 | Đổi giọng đột ngột | `vocabulary.level` đổi từ formal→vulgar không có lý do |
| V04 | Trùng giọng | 2 nhân vật có ≥70% overlap trong `catchphrases` + `vocabulary` |
| V05 | Mất khẩu ngữ | Nhân vật không dùng `catchphrases` trong ≥5 chương liên tiếp |

### 3.2 Quy tắc MỀM (vi phạm = GHI CHÚ)

| Mã | Quy tắc | Mô tả |
|----|---------|-------|
| V06 | Độ dài câu lệch | `averageSentenceLength` lệch ≥30% so với hồ sơ |
| V07 | Tần suất hỏi lệch | `questionFrequency` lệch ≥50% so với hồ sơ |
| V08 | Thiếu từ chuyên ngành | Nhân vật chuyên môn nhưng không dùng `domainWords` |
| V09 | Hài hước biến mất | Nhân vật `humor.frequency: high` nhưng 3+ chương không hài |

---

## 4. Ma Trận Tương Đồng Giọng

So sánh mỗi cặp nhân vật, tính điểm tương đồng 0–100:

```
Ma Trận Tương Đồng Giọng
═══════════════════════════════════════════
              Huyền Trang  Ngộ Không  Bát Giới  Sa Tăng
Huyền Trang       —            25        15        20
Ngộ Không        25            —         30        18
Bát Giới         15           30         —         35  ⚠️
Sa Tăng          20           18        35  ⚠️      —

⚠️ Bát Giới — Sa Tăng: 35% tương đồng (ngưỡng cảnh báo: 40%)
```

### Công thức tương đồng

```
similarity = (
  pronoun_match × 0.1 +
  vocabulary_overlap × 0.3 +
  sentence_pattern_similarity × 0.2 +
  humor_match × 0.1 +
  catchphrase_overlap × 0.3
) × 100

Ngưỡng cảnh báo: ≥40%
Ngưỡng nghiêm trọng: ≥60%
```

---

## 5. Trích Xuất Đối Thoại

### Quy tắc nhận diện đối thoại trong văn bản

1. **Dấu ngoặc kép:** `"..."` hoặc `"..."` (Unicode quotes)
2. **Dấu gạch đầu dòng:** `— Câu nói` hoặc `– Câu nói`
3. **Gán nhân vật:** Tìm tên/biệt danh trong câu dẫn trước hoặc sau đối thoại
4. **Ngữ cảnh:** Nếu không tìm thấy tên → gán theo nhân vật đang nói trong context gần nhất

### Mẫu regex trích xuất

```javascript
// Mẫu 1: Ngoặc kép
const QUOTE_PATTERN = /["""]([^"""]+)["""]/g;

// Mẫu 2: Gạch đầu dòng đối thoại
const DASH_PATTERN = /^[—–]\s*(.+)$/gm;

// Mẫu 3: Tìm người nói
const SPEAKER_PATTERN = /(\p{L}[\p{L}\s]{1,20})\s*(nói|hỏi|gào|thét|cười|khẽ|lầm bầm|gằn giọng|thì thào)/gu;
```
