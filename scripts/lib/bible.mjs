import { join } from 'path';
import { readdirSync } from 'fs';
import {
  slugify, dateNow, ensureDir, readJSON, writeJSON,
  listJSONFiles, moveFile, validateEntity, createEntityBase,
  readMarkdown, listMarkdownFiles, extractDialogues
} from './utils.mjs';

// ══════════════════════════════════════════
// QUẢN LÝ KINH ĐIỂN — Novel Guardian v1.0
// ══════════════════════════════════════════

const SCHEMA_VERSION = '1.0';

// Trường bắt buộc theo loại thực thể
const REQUIRED_FIELDS = {
  character: ['id', 'type', 'name', 'status'],
  location: ['id', 'type', 'name', 'significance'],
  faction: ['id', 'type', 'name'],
  item: ['id', 'type', 'name'],
  event: ['id', 'type', 'name', 'chapter']
};

// Ánh xạ loại thực thể → thư mục con
const TYPE_DIR_MAP = {
  character: 'characters',
  location: 'world/locations',
  faction: 'world/factions',
  item: 'world/items',
  event: 'timeline'
};

// ─── LỚP BIBLE MANAGER ───

export class BibleManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.indexPath = join(dataDir, 'index.json');
    ensureDir(dataDir);
    // Tạo thư mục con
    for (const sub of Object.values(TYPE_DIR_MAP)) {
      ensureDir(join(dataDir, sub));
    }
    ensureDir(join(dataDir, 'voices'));
    ensureDir(join(dataDir, 'pacing'));
    ensureDir(join(dataDir, 'reports'));
    ensureDir(join(dataDir, 'archive'));
  }

  /**
   * Lấy đường dẫn file của entity
   */
  _entityPath(type, id) {
    const dir = TYPE_DIR_MAP[type];
    if (!dir) throw new Error(`Loại thực thể không hợp lệ: ${type}`);
    return join(this.dataDir, dir, `${id}.json`);
  }

  // ═══ CRUD ═══

  /**
   * Tạo thực thể mới
   * @param {string} type - character|location|faction|item|event
   * @param {object} data - Dữ liệu thực thể (phải có `name`)
   * @returns {object} Entity đã tạo
   */
  create(type, data) {
    if (!TYPE_DIR_MAP[type]) {
      throw new Error(`Loại không hợp lệ: "${type}". Chấp nhận: ${Object.keys(TYPE_DIR_MAP).join(', ')}`);
    }
    const id = data.id || slugify(data.name);
    const filePath = this._entityPath(type, id);

    // Kiểm tra trùng
    if (readJSON(filePath)) {
      throw new Error(`Thực thể đã tồn tại: ${type}/${id}`);
    }

    // Tạo entity với base + data
    const entity = {
      ...createEntityBase(id, type),
      ...data,
      id,
      type,
      schemaVersion: SCHEMA_VERSION
    };

    // Xác thực
    const { valid, errors } = validateEntity(entity, REQUIRED_FIELDS[type] || ['id', 'type', 'name']);
    if (!valid) {
      throw new Error(`Xác thực thất bại:\n${errors.join('\n')}`);
    }

    writeJSON(filePath, entity);
    this._updateIndex();
    return entity;
  }

  /**
   * Lấy thực thể theo ID
   */
  get(type, id) {
    const filePath = this._entityPath(type, id);
    const entity = readJSON(filePath);
    if (!entity) {
      throw new Error(`Không tìm thấy: ${type}/${id}`);
    }
    return entity;
  }

  /**
   * Cập nhật thực thể (merge patch)
   */
  update(type, id, patch) {
    const filePath = this._entityPath(type, id);
    const existing = readJSON(filePath);
    if (!existing) {
      throw new Error(`Không tìm thấy: ${type}/${id}`);
    }

    const updated = {
      ...existing,
      ...patch,
      id: existing.id, // Không cho đổi ID
      type: existing.type, // Không cho đổi type
      schemaVersion: existing.schemaVersion,
      createdAt: existing.createdAt,
      updatedAt: dateNow()
    };

    // Merge sâu cho attributes, relationships, timeline
    if (patch.attributes && existing.attributes) {
      updated.attributes = { ...existing.attributes, ...patch.attributes };
    }
    if (patch.relationships) {
      updated.relationships = patch.relationships; // Thay thế toàn bộ
    }
    if (patch.timeline && existing.timeline) {
      // Thêm sự kiện mới, không xoá cũ
      const existingIds = new Set(existing.timeline.map(e => `${e.chapter}-${e.beat}`));
      const newEvents = patch.timeline.filter(e => !existingIds.has(`${e.chapter}-${e.beat}`));
      updated.timeline = [...existing.timeline, ...newEvents];
    }

    writeJSON(filePath, updated);
    this._updateIndex();
    return updated;
  }

  /**
   * Xoá mềm (di chuyển vào archive)
   */
  delete(type, id) {
    const filePath = this._entityPath(type, id);
    if (!readJSON(filePath)) {
      throw new Error(`Không tìm thấy: ${type}/${id}`);
    }
    const archivePath = join(this.dataDir, 'archive', `${type}_${id}_${Date.now()}.json`);
    moveFile(filePath, archivePath);
    this._updateIndex();
    return { deleted: true, archivedTo: archivePath };
  }

  /**
   * Liệt kê thực thể theo loại (hoặc tất cả)
   */
  list(type = null) {
    if (type) {
      const dir = join(this.dataDir, TYPE_DIR_MAP[type]);
      return listJSONFiles(dir).map(f => readJSON(f)).filter(Boolean);
    }
    // Tất cả loại
    const all = [];
    for (const t of Object.keys(TYPE_DIR_MAP)) {
      const dir = join(this.dataDir, TYPE_DIR_MAP[t]);
      const entities = listJSONFiles(dir).map(f => readJSON(f)).filter(Boolean);
      all.push(...entities);
    }
    return all;
  }

  // ═══ TRUY VẤN ═══

  /**
   * Tìm kiếm từ khoá trong toàn bộ Kinh Điển
   */
  search(keyword) {
    const kw = keyword.toLowerCase();
    const all = this.list();
    return all.filter(entity => {
      const text = JSON.stringify(entity).toLowerCase();
      return text.includes(kw);
    });
  }

  /**
   * Lấy dòng thời gian (tất cả hoặc theo nhân vật)
   */
  getTimeline(characterId = null) {
    const events = this.list('event');

    if (characterId) {
      return events
        .filter(e => e.participants?.includes(characterId))
        .sort((a, b) => (a.chapter - b.chapter) || (a.beat || 0) - (b.beat || 0));
    }

    return events.sort((a, b) => (a.chapter - b.chapter) || (a.beat || 0) - (b.beat || 0));
  }

  /**
   * Lấy mối quan hệ của nhân vật
   */
  getRelationships(characterId) {
    const char = this.get('character', characterId);
    return char.relationships || [];
  }

  /**
   * Xuất Kinh Điển ra Markdown (để nạp ngữ cảnh)
   */
  exportBible(format = 'md') {
    const characters = this.list('character');
    const locations = this.list('location');
    const factions = this.list('faction');
    const items = this.list('item');

    if (format === 'json') {
      return { characters, locations, factions, items };
    }

    // Markdown
    let md = '# Kinh Điển — Tóm Tắt\n\n';

    md += '## Nhân Vật\n';
    for (const c of characters) {
      md += `### ${c.name}${c.aliases?.length ? ` (${c.aliases.join(', ')})` : ''}\n`;
      md += `- Trạng thái: ${c.status}\n`;
      if (c.attributes) {
        if (c.attributes.cultivation) md += `- Tu vi: ${c.attributes.cultivation}\n`;
        if (c.attributes.faction) md += `- Phe: ${c.attributes.faction}\n`;
        if (c.attributes.role) md += `- Vai trò: ${c.attributes.role}\n`;
      }
      if (c.relationships?.length) {
        md += `- Quan hệ:\n`;
        for (const r of c.relationships) {
          md += `  - ${r.targetId}: ${r.type} — ${r.description || ''}\n`;
        }
      }
      md += '\n';
    }

    md += '## Địa Danh\n';
    for (const l of locations) {
      md += `- **${l.name}**: ${l.description || ''} (${l.significance})\n`;
    }
    md += '\n';

    md += '## Phe Phái\n';
    for (const f of factions) {
      md += `- **${f.name}**: ${f.description || ''}\n`;
    }
    md += '\n';

    md += '## Vật Phẩm\n';
    for (const i of items) {
      md += `- **${i.name}**: ${i.description || ''} — Sở hữu: ${i.owner || 'không rõ'}\n`;
    }

    return md;
  }

  // ═══ NHẬP TỪ CHƯƠNG ═══

  /**
   * Nhập thực thể từ 1 chương Markdown
   * Trả về { characters: [], locations: [], events: [] }
   */
  importFromChapter(chapterPath, knownNames = null) {
    const text = readMarkdown(chapterPath);
    if (!text) return { characters: [], locations: [], events: [] };

    const chapterMatch = chapterPath.match(/(?:ch|chuong|chương)[._-]?(\d+)/i);
    const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : 0;

    const result = { characters: [], locations: [], events: [] };

    // Nếu có danh sách tên đã biết → tìm nhân vật xuất hiện
    if (knownNames) {
      for (const [id, names] of Object.entries(knownNames)) {
        for (const name of names) {
          if (text.includes(name)) {
            result.characters.push({ id, name, chapter: chapterNum });
            break;
          }
        }
      }
    }

    // Tìm mốc thời gian
    const timePatterns = [
      { regex: /(?:bình minh|rạng đông|trời sáng)/gi, time: 'dawn' },
      { regex: /(?:buổi sáng|sáng sớm|sáng hôm)/gi, time: 'morning' },
      { regex: /(?:giữa trưa|chính ngọ|giờ ngọ)/gi, time: 'noon' },
      { regex: /(?:buổi chiều|chiều tà|xế chiều)/gi, time: 'afternoon' },
      { regex: /(?:buổi tối|hoàng hôn|nhá nhem)/gi, time: 'evening' },
      { regex: /(?:ban đêm|đêm khuya|giữa đêm|nửa đêm)/gi, time: 'night' }
    ];

    for (const { regex, time } of timePatterns) {
      if (regex.test(text)) {
        result.events.push({
          chapter: chapterNum,
          timeOfDay: time,
          type: 'time-marker'
        });
      }
    }

    // Trích xuất đối thoại
    const dialogues = extractDialogues(text);
    result.dialogueCount = dialogues.length;
    result.speakers = [...new Set(dialogues.map(d => d.speaker).filter(Boolean))];

    return result;
  }

  /**
   * Đồng bộ toàn bộ chương vào Kinh Điển
   */
  syncBible(chaptersDir) {
    const files = listMarkdownFiles(chaptersDir);
    if (files.length === 0) {
      return { synced: 0, message: 'Không tìm thấy file .md nào' };
    }

    // Lấy danh sách tên đã biết
    const characters = this.list('character');
    const knownNames = {};
    for (const c of characters) {
      knownNames[c.id] = [c.name, ...(c.aliases || [])];
    }

    const results = [];
    for (const file of files) {
      const data = this.importFromChapter(file, Object.keys(knownNames).length > 0 ? knownNames : null);
      results.push({ file, ...data });

      // Cập nhật lastSeen cho nhân vật tìm thấy
      for (const char of data.characters) {
        try {
          const existing = this.get('character', char.id);
          if (!existing.lastSeen || existing.lastSeen.chapter < char.chapter) {
            this.update('character', char.id, {
              lastSeen: { chapter: char.chapter, beat: 0 }
            });
          }
        } catch { /* Nhân vật chưa có trong Bible — bỏ qua */ }
      }
    }

    this._updateIndex();
    return {
      synced: files.length,
      results,
      message: `Đã đồng bộ ${files.length} chương`
    };
  }

  // ═══ NỘI BỘ ═══

  /**
   * Cập nhật tệp chỉ mục
   */
  _updateIndex() {
    // Đếm trực tiếp từ filesystem thay vì gọi list() (tránh đọc nội dung từng file)
    const countDir = (type) => {
      const subDir = TYPE_DIR_MAP[type];
      if (!subDir) return 0;
      const dir = join(this.dataDir, subDir);
      try {
        return readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).length;
      } catch { return 0; }
    };

    const index = {
      schemaVersion: SCHEMA_VERSION,
      projectName: readJSON(join(this.dataDir, '..', 'guardian.json'))?.projectName
        || readJSON(this.indexPath)?.projectName
        || 'Chưa đặt tên',
      entities: {
        characters: countDir('character'),
        locations: countDir('location'),
        factions: countDir('faction'),
        items: countDir('item'),
        events: countDir('event')
      },
      lastSync: dateNow(),
      updatedAt: dateNow()
    };

    // Giữ createdAt nếu đã có
    const existing = readJSON(this.indexPath);
    if (existing?.createdAt) {
      index.createdAt = existing.createdAt;
    } else {
      index.createdAt = dateNow();
    }

    writeJSON(this.indexPath, index);
    return index;
  }

  /**
   * Lấy thông tin chỉ mục
   */
  getIndex() {
    return readJSON(this.indexPath) || this._updateIndex();
  }
}
