# Novel Guardian 🛡️

**Trình bảo vệ liền mạch cho tiểu thuyết tiếng Việt**

Quét mâu thuẫn nhân vật/thời gian/thế giới, phân tích nhịp truyện, kiểm tra giọng văn — tất cả trong <1 giây.

## Tính Năng

- **20 Continuity Rules** — phát hiện: nhân vật chết sống lại, dịch chuyển tức thời, vật phẩm trùng chủ
- **5-Level Pacing** — TĨNH→DÂNG→CĂNG→CAO TRÀO→HẠ NHIỆT + biểu đồ ASCII
- **Vietnamese Style** — từ vựng, giọng, lệch giọng detection
- **Bible Manager** — CRUD 5 entity types
- **8 CLI Commands** — init, scan, pacing, style, bible, status, report, help
- **Zero Dependencies** — Pure Node.js ESM

## Cài Đặt

```bash
npm install -g novel-guardian
ng --help
```

## Bắt Đầu Nhanh

```bash
ng init --name "Tiểu thuyết của bạn"
ng bible create character --name "Nhân Vật" --status alive
mkdir chapters && echo "Nội dung chương 1..." > chapters/ch01.md
ng scan --chapter 1
ng pacing
ng report
```

## Tài Liệu

- [SKILL.md](SKILL.md) — Hướng dẫn đầy đủ
- [INTEGRATION.md](INTEGRATION.md) — Tích hợp Omni Forge Novel
- [CHANGELOG.md](CHANGELOG.md) — Lịch sử phiên bản

## License

MIT — Xem [LICENSE](LICENSE)

---

*Protecting Vietnamese fiction from continuity chaos* 🦊
