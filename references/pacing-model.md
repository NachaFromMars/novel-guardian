# Mô Hình Nhịp Truyện — Novel Guardian v1.0

Tài liệu định nghĩa hệ thống 5 cấp nhịp truyện (pacing) và quy tắc phân loại
từng nhịp đoạn (beat) trong chương.

---

## 1. Năm Cấp Nhịp Truyện

| Cấp | Tên | Giá trị | Mô tả | Ví dụ |
|-----|-----|---------|-------|-------|
| 1 | TĨNH | 1.0–1.9 | Đời thường, hội thoại nhẹ, suy tư nội tâm, mô tả cảnh vật | Huyền Trang ngồi thiền, hồi tưởng kiếp trước |
| 2 | DÂNG | 2.0–2.9 | Căng thẳng tăng dần, manh mối, nghi ngờ, khám phá | Phát hiện dấu vết yêu quái, tin đồn lạ |
| 3 | CĂNG | 3.0–3.9 | Xung đột rõ ràng, đối đầu, quyết định khó, áp lực | Đàm phán với yêu quái, tranh luận nội bộ |
| 4 | CAO TRÀO | 4.0–4.9 | Trận chiến, twist, tiết lộ lớn, cảm xúc đỉnh điểm | Đại chiến Bạch Cốt Tinh, bí mật bại lộ |
| 5 | HẠ NHIỆT | 5.0–5.9 | Hồi phục, aftermath, nhìn lại, trưởng thành nhân vật | Sau trận chiến, chữa thương, rút kinh nghiệm |

### Biểu đồ nhịp lý tưởng (mỗi cung 10 chương)

```
Cấp 5 |                    ★
Cấp 4 |              ╱  ╲   ╱  ╲
Cấp 3 |         ╱          ╲
Cấp 2 |    ╱                     ╲
Cấp 1 | ──                          ──
       └─────────────────────────────────
         C1  C2  C3  C4  C5  C6  C7  C8  C9  C10
```

---

## 2. Quy Tắc Phân Loại Nhịp Đoạn

### 2.1 Phân loại theo từ khoá

Mỗi cấp có danh sách từ khoá tiếng Việt. Đếm số lần xuất hiện trong beat → tính điểm.

```json
{
  "TINH": {
    "keywords": ["bình thường", "ngồi", "nghĩ", "nhớ", "nằm", "thở", "yên tĩnh",
      "thiền", "hồi tưởng", "ngắm", "lặng", "bình yên", "thư thái", "thong thả",
      "nhàn", "uống trà", "tản bộ", "mơ màng", "trầm ngâm", "suy tư"],
    "weight": 1.0
  },
  "DANG": {
    "keywords": ["phát hiện", "lạ", "nghi ngờ", "theo dõi", "tìm", "manh mối",
      "dò xét", "cảnh giác", "bất thường", "bí ẩn", "tin đồn", "khám phá",
      "điều tra", "thăm dò", "dấu vết", "mùi tanh", "linh cảm", "rình"],
    "weight": 2.0
  },
  "CANG": {
    "keywords": ["đối đầu", "xung đột", "quyết định", "nguy hiểm", "đe doạ",
      "tranh cãi", "ép buộc", "tức giận", "căng thẳng", "đàm phán", "thách thức",
      "đòi", "gằn giọng", "nghiến răng", "nắm chặt", "lừa", "phản bội"],
    "weight": 3.0
  },
  "CAO_TRAO": {
    "keywords": ["chiến đấu", "giết", "bùng nổ", "twist", "sốc", "chết",
      "máu", "kiếm", "đánh", "nổ", "phá", "tiêu diệt", "quyết chiến",
      "sinh tử", "bại lộ", "tiết lộ", "sự thật", "phản kích", "tuyệt chiêu",
      "biến", "loạn", "đại chiến", "tử chiến"],
    "weight": 4.0
  },
  "HA_NHIET": {
    "keywords": ["kết thúc", "bình yên", "trở về", "hiểu ra", "tha thứ",
      "chữa", "hồi phục", "nghỉ ngơi", "nhìn lại", "rút kinh nghiệm",
      "trưởng thành", "cảm ơn", "nước mắt", "ôm", "cười nhẹ", "bình minh",
      "lên đường tiếp", "từ biệt"],
    "weight": 5.0
  }
}
```

### 2.2 Phân loại theo cấu trúc

| Tín hiệu cấu trúc | Cấp gợi ý |
|---------------------|------------|
| Beat ngắn (<200 từ), nhiều đối thoại ngắn, dấu chấm than | CAO TRÀO |
| Beat dài (>500 từ), nhiều mô tả, ít đối thoại | TĨNH hoặc DÂNG |
| Nhiều dấu hỏi, câu ngắn liên tiếp | CĂNG |
| Nhiều dấu ba chấm, câu dài, giọng trầm | HẠ NHIỆT |
| Xen kẽ đối thoại ngắn + mô tả ngắn | DÂNG |

### 2.3 Công thức tính điểm nhịp

```
Điểm nhịp = (Σ keyword_weight × keyword_count) / total_keywords_found
```

- Nếu không tìm thấy từ khoá nào → mặc định TĨNH (1.5)
- Điểm cấu trúc bổ sung ±0.3 dựa trên tín hiệu trên
- Kết quả cuối: trung bình (từ khoá + cấu trúc), làm tròn 1 chữ số

---

## 3. Khuôn Mẫu Nhịp Cần Phát Hiện

### 3.1 Khuôn mẫu XẤU (cảnh báo)

| Khuôn mẫu | Điều kiện | Mức cảnh báo | Gợi ý |
|------------|-----------|--------------|-------|
| Đơn điệu | ≥3 chương liên tiếp cùng cấp | ⚠️ CẢNH BÁO | Thay đổi nhịp, thêm biến cố hoặc nghỉ |
| Thiếu hạ nhiệt | CAO TRÀO ngay sau CAO TRÀO, không có HẠ NHIỆT | ⚠️ CẢNH BÁO | Thêm chương hạ nhiệt giữa hai cao trào |
| Cung phẳng | ≥5 chương không có CAO TRÀO hoặc CĂNG | ⚠️ CẢNH BÁO | Nhịp truyện chậm, người đọc có thể mệt |
| Nhảy nhịp | Từ TĨNH nhảy thẳng CAO TRÀO (không qua DÂNG/CĂNG) | 📝 GHI CHÚ | Thiếu quá trình xây dựng căng thẳng |
| Mở đầu cao | Chương 1 của cung mới là CAO TRÀO | 📝 GHI CHÚ | Nên bắt đầu bằng TĨNH hoặc DÂNG |

### 3.2 Khuôn mẫu TỐT (ghi nhận)

| Khuôn mẫu | Điều kiện | Ghi nhận |
|------------|-----------|----------|
| Sóng chuẩn | TĨNH → DÂNG → CĂNG → CAO TRÀO → HẠ NHIỆT | ✅ Nhịp truyện mẫu mực |
| Leo thang | Mỗi CAO TRÀO sau cao hơn trước (trong 1 cung) | ✅ Xây dựng kịch tính tốt |
| Nhịp thở | Xen kẽ TĨNH/HẠ NHIỆT giữa các CĂNG/CAO TRÀO | ✅ Cho người đọc nghỉ đúng lúc |

---

## 4. Biểu Đồ Nhịp Dạng Ký Tự (ASCII)

Hiển thị trên Telegram/terminal:

```
# Nhịp Truyện — Trọng Sinh Đường Tam Tạng

Ch.01: ██░░░░░░░░ TĨNH      (1.5)
Ch.02: ████░░░░░░ DÂNG      (2.3)
Ch.03: ██████░░░░ CĂNG      (3.1)
Ch.04: █████████░ CAO TRÀO  (4.2)  ★
Ch.05: ███░░░░░░░ HẠ NHIỆT (1.8)
Ch.06: ████░░░░░░ DÂNG      (2.5)
Ch.07: ███████░░░ CĂNG      (3.5)
Ch.08: █████████░ CAO TRÀO  (4.5)  ★★
Ch.09: ██░░░░░░░░ HẠ NHIỆT (1.3)
Ch.10: ██████████ CAO TRÀO  (4.9)  ★★★ ARC CLIMAX

═══ Nhận xét ═══
✅ Khuôn mẫu sóng chuẩn (Ch.01-05)
✅ Leo thang (Ch.04 → Ch.08 → Ch.10)
⚠️ Ch.07-08-10: 3 chương CĂNG/CAO TRÀO gần nhau
```

---

## 5. Lược Đồ Dữ Liệu Nhịp (JSON)

Lưu tại `data/pacing/ch{N}.json`:

```json
{
  "schemaVersion": "1.0",
  "chapter": 1,
  "beats": [
    { "beat": 1, "score": 1.5, "level": "TINH", "keywords": ["thiền", "hồi tưởng"] },
    { "beat": 2, "score": 2.3, "level": "DANG", "keywords": ["phát hiện", "lạ"] },
    { "beat": 3, "score": 3.1, "level": "CANG", "keywords": ["đối đầu", "căng thẳng"] },
    { "beat": 4, "score": 4.2, "level": "CAO_TRAO", "keywords": ["chiến đấu", "tuyệt chiêu"] },
    { "beat": 5, "score": 1.8, "level": "HA_NHIET", "keywords": ["nghỉ ngơi", "nhìn lại"] }
  ],
  "chapterScore": 2.58,
  "chapterLevel": "DANG",
  "peakBeat": 4,
  "peakScore": 4.2,
  "analyzedAt": "2026-03-10T17:33:00Z"
}
```
