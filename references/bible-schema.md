# Lược Đồ Kinh Điển — Novel Guardian v1.0

Tài liệu định nghĩa cấu trúc dữ liệu JSON cho Kinh Điển Nhân Vật (Character Bible)
và Kinh Điển Thế Giới (World Bible). Mọi mô-đun trong Novel Guardian đều đọc/ghi
theo lược đồ này.

---

## Phiên Bản Lược Đồ

```json
{
  "schemaVersion": "1.0",
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

Khi lược đồ thay đổi → tăng `schemaVersion` → script di chuyển dữ liệu tự động.

---

## 1. Nhân Vật (Character)

### Lược đồ đầy đủ

```json
{
  "schemaVersion": "1.0",
  "id": "tran-huyen-trang",
  "type": "character",
  "name": "Trần Huyền Trang",
  "aliases": ["Đường Tam Tạng", "Huyền Trang", "Tam Tạng"],
  "status": "alive",
  "gender": "male",
  "firstAppearance": { "chapter": 1, "beat": 1 },
  "lastSeen": { "chapter": 20, "beat": 5 },

  "attributes": {
    "age": 22,
    "race": "human",
    "cultivation": "Luyện Khí kỳ tầng 3",
    "powerLevel": 3,
    "powerScale": "1-10",
    "faction": "Đại Đường",
    "role": "protagonist",
    "occupation": "Tăng nhân / Thỉnh kinh sứ giả",
    "appearance": "Cao ráo, mặt trắng, mắt sáng, tóc cạo trọc",
    "personality": ["thông minh", "mưu lược", "hài hước đen", "cứng đầu"],
    "skills": ["Phật pháp", "Y thuật cơ bản", "Thuyết pháp"],
    "weaknesses": ["Thể lực yếu", "Quá tự tin"],
    "items": ["Cà sa Quan Âm", "Tích trượng", "Kim bát"],
    "custom": {}
  },

  "relationships": [
    {
      "targetId": "ton-ngo-khong",
      "type": "master-disciple",
      "description": "Sư phụ - đồ đệ, nhưng thực chất là đối tác",
      "sinceChapter": 5,
      "status": "active"
    }
  ],

  "timeline": [
    {
      "chapter": 1,
      "beat": 1,
      "event": "Trọng sinh thành Trần Huyền Trang",
      "location": "Trường An",
      "significance": "high",
      "powerChange": null
    },
    {
      "chapter": 5,
      "beat": 3,
      "event": "Gặp Tôn Ngộ Không dưới Ngũ Hành Sơn",
      "location": "Ngũ Hành Sơn",
      "significance": "critical",
      "powerChange": null
    }
  ],

  "notes": [
    "Ký ức kiếp trước: hiện đại, IT, meme culture",
    "Biết trước cốt truyện Tây Du Ký nguyên bản"
  ],

  "tags": ["protagonist", "reincarnated", "modern-knowledge"],
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

### Trường bắt buộc
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | Mã định danh duy nhất, dạng slug (vd: `tran-huyen-trang`) |
| `type` | string | Luôn là `"character"` |
| `name` | string | Tên đầy đủ tiếng Việt có dấu |
| `status` | enum | `"alive"` / `"dead"` / `"unknown"` / `"sealed"` / `"transformed"` |
| `firstAppearance` | object | `{ chapter: number, beat: number }` |

### Trường tuỳ chọn
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `aliases` | string[] | Tên gọi khác |
| `gender` | string | Giới tính |
| `lastSeen` | object | Lần cuối xuất hiện |
| `attributes` | object | Thuộc tính chi tiết (xem trên) |
| `relationships` | array | Mối quan hệ với nhân vật khác |
| `timeline` | array | Các sự kiện quan trọng |
| `notes` | string[] | Ghi chú tự do |
| `tags` | string[] | Nhãn phân loại |
| `custom` | object | Trường mở rộng tuỳ ý |

### Quy tắc `status`
- `"alive"` → mặc định khi tạo mới
- `"dead"` → phải ghi `deathChapter` trong timeline
- `"sealed"` → bị phong ấn (vd: Tôn Ngộ Không dưới Ngũ Hành Sơn)
- `"transformed"` → biến đổi hình thái (vd: hiện nguyên hình)
- `"unknown"` → chưa rõ số phận

---

## 2. Địa Danh (Location)

```json
{
  "schemaVersion": "1.0",
  "id": "truong-an",
  "type": "location",
  "name": "Trường An",
  "aliases": ["Kinh đô Đại Đường", "Tây An"],
  "description": "Kinh đô triều Đại Đường, nơi khởi hành thỉnh kinh",
  "region": "Trung Nguyên",
  "terrain": "city",
  "controlledBy": "dai-duong",
  "significance": "major",
  "firstAppearance": { "chapter": 1, "beat": 1 },
  "connectedTo": [
    { "locationId": "ngu-hanh-son", "travelTime": "30 ngày", "route": "Tây tiến" }
  ],
  "events": [],
  "notes": [],
  "tags": ["capital", "starting-point"],
  "custom": {},
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

### Trường bắt buộc
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | Slug duy nhất |
| `type` | string | Luôn là `"location"` |
| `name` | string | Tên tiếng Việt có dấu |
| `significance` | enum | `"major"` / `"minor"` / `"mentioned"` |

---

## 3. Phe Phái (Faction)

```json
{
  "schemaVersion": "1.0",
  "id": "dai-duong",
  "type": "faction",
  "name": "Đại Đường",
  "aliases": ["Triều Đường", "Nhà Đường"],
  "description": "Triều đại cai trị Trung Nguyên, nơi Huyền Trang xuất phát",
  "leader": "duong-thai-tong",
  "alignment": "lawful",
  "headquarters": "truong-an",
  "members": ["tran-huyen-trang", "duong-thai-tong"],
  "allies": [],
  "enemies": [],
  "firstAppearance": { "chapter": 1, "beat": 1 },
  "notes": [],
  "tags": ["government", "human"],
  "custom": {},
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

---

## 4. Vật Phẩm (Item)

```json
{
  "schemaVersion": "1.0",
  "id": "ca-sa-quan-am",
  "type": "item",
  "name": "Cà Sa Quan Âm",
  "aliases": ["Miên Bá Cà Sa"],
  "description": "Cà sa do Quan Âm Bồ Tát ban tặng, chống chịu tà ma",
  "rarity": "legendary",
  "owner": "tran-huyen-trang",
  "previousOwners": ["quan-am-bo-tat"],
  "abilities": ["Tăng phòng ngự tâm linh", "Nhận diện bởi thần tiên"],
  "location": "truong-an",
  "firstAppearance": { "chapter": 2, "beat": 3 },
  "status": "active",
  "notes": [],
  "tags": ["divine", "armor", "quest-item"],
  "custom": {},
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

---

## 5. Sự Kiện Dòng Thời Gian (Timeline Event)

```json
{
  "schemaVersion": "1.0",
  "id": "evt-ch01-trong-sinh",
  "type": "event",
  "name": "Trọng sinh thành Trần Huyền Trang",
  "chapter": 1,
  "beat": 1,
  "timeOfDay": "morning",
  "dayIndex": 1,
  "location": "truong-an",
  "participants": ["tran-huyen-trang"],
  "description": "Nhân vật chính thức tỉnh dậy trong thân xác Huyền Trang",
  "consequences": ["Bắt đầu cuộc hành trình thỉnh kinh"],
  "significance": "critical",
  "tags": ["reincarnation", "inciting-incident"],
  "custom": {},
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

### Quy tắc `timeOfDay`
| Giá trị | Mô tả |
|---------|-------|
| `"dawn"` | Bình minh (5h-7h) |
| `"morning"` | Buổi sáng (7h-11h) |
| `"noon"` | Giữa trưa (11h-13h) |
| `"afternoon"` | Buổi chiều (13h-17h) |
| `"evening"` | Buổi tối (17h-20h) |
| `"night"` | Ban đêm (20h-23h) |
| `"midnight"` | Nửa đêm (23h-2h) |
| `"latenight"` | Khuya (2h-5h) |
| `"unspecified"` | Không rõ |

### Quy tắc `dayIndex`
- Ngày 1 = ngày đầu tiên trong truyện
- Tăng dần, KHÔNG BAO GIỜ giảm (trừ flashback có tag `"flashback"`)
- Nếu không rõ ngày cụ thể → ước tính dựa trên ngữ cảnh

### Quy tắc `significance`
| Giá trị | Mô tả |
|---------|-------|
| `"critical"` | Thay đổi hướng truyện, plot twist, chết/sống |
| `"high"` | Sự kiện quan trọng, ảnh hưởng nhiều nhân vật |
| `"medium"` | Sự kiện đáng chú ý, phát triển nhân vật |
| `"low"` | Chi tiết phụ, bối cảnh |

---

## 6. Tệp Chỉ Mục (Index)

Mỗi dự án có 1 tệp chỉ mục `data/index.json`:

```json
{
  "schemaVersion": "1.0",
  "projectName": "Trọng Sinh Đường Tam Tạng",
  "totalChapters": 20,
  "entities": {
    "characters": 15,
    "locations": 8,
    "factions": 5,
    "items": 12,
    "events": 45
  },
  "lastSync": "2026-03-10T17:33:00Z",
  "createdAt": "2026-03-10T17:33:00Z",
  "updatedAt": "2026-03-10T17:33:00Z"
}
```

---

## 7. Quy Tắc Đặt Tên Tệp

| Loại | Vị trí | Ví dụ |
|------|--------|-------|
| Nhân vật | `data/characters/{id}.json` | `data/characters/tran-huyen-trang.json` |
| Địa danh | `data/world/locations/{id}.json` | `data/world/locations/truong-an.json` |
| Phe phái | `data/world/factions/{id}.json` | `data/world/factions/dai-duong.json` |
| Vật phẩm | `data/world/items/{id}.json` | `data/world/items/ca-sa-quan-am.json` |
| Sự kiện | `data/timeline/{id}.json` | `data/timeline/evt-ch01-trong-sinh.json` |
| Chỉ mục | `data/index.json` | — |
| Giọng | `data/voices/{character-id}.json` | `data/voices/tran-huyen-trang.json` |
| Nhịp | `data/pacing/ch{N}.json` | `data/pacing/ch01.json` |
| Báo cáo | `data/reports/{type}-{date}.md` | `data/reports/continuity-2026-03-10.md` |

---

## 8. Quy Tắc Di Chuyển Dữ Liệu

Khi `schemaVersion` tăng:
1. Script đọc `schemaVersion` hiện tại trong mỗi tệp JSON
2. Nếu < phiên bản mới → chạy hàm di chuyển tương ứng
3. Cập nhật `schemaVersion` + `updatedAt`
4. KHÔNG xoá trường cũ — thêm trường mới, đánh dấu cũ là `deprecated`

```javascript
const migrations = {
  "1.0_to_1.1": (data) => {
    // Thêm trường mới, giữ nguyên trường cũ
    data.schemaVersion = "1.1";
    data.newField = data.newField || defaultValue;
    return data;
  }
};
```
