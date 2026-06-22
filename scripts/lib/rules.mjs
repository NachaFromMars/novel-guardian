import {
  readJSON, countWords, countSentences, extractDialogues
} from './utils.mjs';

// ══════════════════════════════════════════════════════════
// BỘ QUY TẮC KIỂM TRA LIỀN MẠCH — Novel Guardian v1.0
// 30+ quy tắc quét mâu thuẫn trong tiểu thuyết
// ══════════════════════════════════════════════════════════

// ─── CONSTANTS ───
const CONTEXT_RANGE_SHORT = 100;    // Ngữ cảnh ngắn (C01 flashback check)
const CONTEXT_RANGE_MEDIUM = 150;   // Ngữ cảnh trung (C02, flashback ext)
const CONTEXT_RANGE_LONG = 200;     // Ngữ cảnh dài (W02 proximity check)
const TELEPORT_THRESHOLD = 500;     // Khoảng cách ký tự tối thiểu giữa 2 địa danh (T03)
const DIALOGUE_PREVIEW = 60;        // Số ký tự preview dialogue trong lỗi

/**
 * Mỗi quy tắc:
 * {
 *   id: "T01",
 *   name: "Tên quy tắc",
 *   category: "time" | "character" | "world" | "plot",
 *   severity: "critical" | "warning" | "note",
 *   check: function(context) => { passed, issues[] }
 * }
 *
 * context = {
 *   bible: BibleManager,
 *   chapter: { number, text, beats[], dialogues[] },
 *   previousChapters: [{ number, text, beats[], dialogues[] }],
 *   allChapters: [...]
 * }
 */

// ─── DANH SÁCH QUY TẮC ───

export const RULES = [];

// ═══ NHÓM 1: THỜI GIAN (T01–T08) ═══

RULES.push({
  id: 'T01',
  name: 'Trình tự thời gian trong ngày',
  category: 'time',
  severity: 'warning',
  description: 'Thời gian trong ngày phải tiến về phía trước (sáng→chiều→tối). Nếu lùi lại mà không có flashback, là mâu thuẫn.',
  check(ctx) {
    const issues = [];
    const timeOrder = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'midnight', 'latenight'];

    // Tìm các mốc thời gian trong chương hiện tại
    const timeMarkers = extractTimeMarkers(ctx.chapter.text);
    let lastIdx = -1;
    let lastMarker = null;

    for (const marker of timeMarkers) {
      const idx = timeOrder.indexOf(marker.time);
      if (idx === -1) continue;

      if (idx < lastIdx && !marker.isFlashback) {
        issues.push({
          ruleId: 'T01',
          severity: 'warning',
          message: `Thời gian lùi lại: "${lastMarker.time}" (${timeLabel(lastMarker.time)}) → "${marker.time}" (${timeLabel(marker.time)})`,
          location: { chapter: ctx.chapter.number, position: marker.position },
          suggestion: 'Kiểm tra lại trình tự thời gian hoặc đánh dấu flashback'
        });
      }
      lastIdx = idx;
      lastMarker = marker;
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'T02',
  name: 'Nhảy ngày không tuyên bố',
  category: 'time',
  severity: 'note',
  description: 'Khi chuyển từ đêm sang sáng mà không có tín hiệu "ngày hôm sau" / "sáng hôm sau".',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;

    // Tìm chuyển đêm→sáng
    const nightPattern = /(?:ban đêm|đêm khuya|nửa đêm|giữa đêm)/gi;
    const morningPattern = /(?:bình minh|sáng sớm|buổi sáng|rạng đông)/gi;
    const transitionPattern = /(?:sáng hôm sau|ngày hôm sau|hôm sau|rạng sáng hôm sau|tỉnh dậy vào sáng|một đêm trôi qua)/gi;

    const hasNight = nightPattern.test(text);
    const hasMorning = morningPattern.test(text);
    const hasTransition = transitionPattern.test(text);

    if (hasNight && hasMorning && !hasTransition) {
      issues.push({
        ruleId: 'T02',
        severity: 'note',
        message: 'Chuyển từ đêm sang sáng mà không có tín hiệu chuyển ngày',
        location: { chapter: ctx.chapter.number },
        suggestion: 'Thêm "sáng hôm sau", "ngày mới", hoặc tín hiệu chuyển thời gian'
      });
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'T03',
  name: 'Nhân vật dịch chuyển tức thời',
  category: 'time',
  severity: 'warning',
  description: 'Nhân vật ở địa danh A đầu chương, bỗng ở địa danh B giữa chương mà không có hành trình.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;

    // Lấy danh sách địa danh đã biết
    const locations = bible.list('location');
    if (locations.length < 2) return { passed: true, issues: [] };

    // Tìm tất cả đề cập địa danh trong chương
    const mentions = [];
    for (const loc of locations) {
      const names = [loc.name, ...(loc.aliases || [])];
      for (const name of names) {
        let idx = text.indexOf(name);
        while (idx !== -1) {
          mentions.push({ locationId: loc.id, name: loc.name, position: idx });
          idx = text.indexOf(name, idx + 1);
        }
      }
    }

    mentions.sort((a, b) => a.position - b.position);

    // Kiểm tra nhảy địa danh không có từ di chuyển
    for (let i = 1; i < mentions.length; i++) {
      if (mentions[i].locationId !== mentions[i - 1].locationId) {
        const between = text.substring(mentions[i - 1].position, mentions[i].position);
        // Recreate regex each iteration to avoid lastIndex issues
        const travelCheck = /(?:đi đến|đi tới|lên đường|khởi hành|đến nơi|tới nơi|về tới|di chuyển|rời khỏi|bay đến|cưỡi[^.]{1,20}đến|phi[^.]{1,20}tới|dịch chuyển|vượt qua|lên đường tới|hướng về|tiến về|đến được|bay về|chạy đến|chạy tới|đi về phía|trở về|quay về)/i;
        if (!travelCheck.test(between) && between.length < TELEPORT_THRESHOLD) {
          // Trong khoảng ngắn (<500 ký tự) mà đổi địa danh không có từ di chuyển
          // Có thể là nhân vật dịch chuyển tức thời
          issues.push({
            ruleId: 'T03',
            severity: 'warning',
            message: `Chuyển địa danh nhanh: "${mentions[i - 1].name}" → "${mentions[i].name}" trong ${between.length} ký tự`,
            location: { chapter: ctx.chapter.number, position: mentions[i].position },
            suggestion: 'Thêm mô tả hành trình hoặc tín hiệu di chuyển'
          });
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'T04',
  name: 'Thời gian di chuyển phi lý',
  category: 'time',
  severity: 'warning',
  description: 'Khoảng cách giữa 2 địa danh đã ghi trong Bible, nhưng thời gian di chuyển trong truyện quá ngắn.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    const locations = bible.list('location');
    
    // Build travel time map from Bible
    const travelMap = new Map();
    for (const loc of locations) {
      if (loc.connectedTo) {
        for (const conn of loc.connectedTo) {
          if (conn.travelTime) {
            const key = [loc.id, conn.targetId].sort().join('↔');
            travelMap.set(key, { from: loc.name, to: conn.targetName || conn.targetId, time: conn.travelTime });
          }
        }
      }
    }
    
    if (travelMap.size === 0) return { passed: true, issues: [] };
    
    // Check if chapter mentions instant travel between locations with known travel times
    const instantPatterns = /(?:chớp mắt|tức thì|ngay lập tức|trong nháy mắt|vừa rời.*đã tới|vừa đi.*đã đến)/i;
    
    for (const [key, info] of travelMap) {
      const fromMentioned = text.includes(info.from);
      const toMentioned = text.includes(info.to);
      if (fromMentioned && toMentioned && instantPatterns.test(text)) {
        issues.push({
          ruleId: 'T04',
          severity: 'warning',
          message: `Di chuyển "${info.from}" → "${info.to}" (cần ${info.time}) có vẻ quá nhanh`,
          location: { chapter: ctx.chapter.number },
          suggestion: `Thêm mô tả hành trình hoặc điều chỉnh thời gian`
        });
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

// ═══ NHÓM 2: NHÂN VẬT (C01–C10) ═══

RULES.push({
  id: 'C01',
  name: 'Nhân vật chết sống lại',
  category: 'character',
  severity: 'critical',
  description: 'Nhân vật đã đánh dấu "dead" nhưng xuất hiện lại không có giải thích.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;

    const deadChars = bible.list('character').filter(c => c.status === 'dead');

    for (const char of deadChars) {
      const names = [char.name, ...(char.aliases || [])];
      for (const name of names) {
        // Tìm TẤT CẢ vị trí xuất hiện và kiểm tra TỪNG cái
        const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        let hasNonFlashback = false;
        while ((match = regex.exec(text)) !== null) {
          const start = Math.max(0, match.index - CONTEXT_RANGE_SHORT);
          const end = Math.min(text.length, match.index + name.length + CONTEXT_RANGE_SHORT);
          const localContext = text.substring(start, end);
          const isFlashback = /(?:nhớ lại|hồi tưởng|ngày xưa|kiếp trước|trong mơ|nhắc đến|kể về|hồi|lúc còn sống)/i.test(localContext);
          if (!isFlashback) {
            hasNonFlashback = true;
            break;
          }
        }

        if (hasNonFlashback) {
            issues.push({
              ruleId: 'C01',
              severity: 'critical',
              message: `Nhân vật "${char.name}" đã chết nhưng xuất hiện ở Chương ${ctx.chapter.number}`,
              location: { chapter: ctx.chapter.number },
              suggestion: 'Nếu hồi sinh: cập nhật status trong Bible. Nếu flashback: thêm ngữ cảnh rõ ràng.'
            });
            break;
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'C02',
  name: 'Nhân vật bị phong ấn vẫn hành động',
  category: 'character',
  severity: 'critical',
  description: 'Nhân vật status "sealed" nhưng nói chuyện, chiến đấu, di chuyển tự do.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;

    const sealedChars = bible.list('character').filter(c => c.status === 'sealed');

    for (const char of sealedChars) {
      const names = [char.name, ...(char.aliases || [])];
      for (const name of names) {
        if (!text.includes(name)) continue;
        const contexts = getAllNameContexts(text, name, CONTEXT_RANGE_MEDIUM);
        for (const { context } of contexts) {
          const isAction = /(?:đánh|chiến đấu|nói|hỏi|đi|chạy|bay|cười|quát|tấn công)/i.test(context);
          const isMention = /(?:nhắc đến|kể về|nhớ|nghĩ đến|nghe nói)/i.test(context);
          if (isAction && !isMention) {
            issues.push({
              ruleId: 'C02',
              severity: 'critical',
              message: `"${char.name}" đang bị phong ấn nhưng hành động tự do ở Chương ${ctx.chapter.number}`,
              location: { chapter: ctx.chapter.number },
              suggestion: 'Cập nhật status hoặc thêm cảnh giải phong ấn trước đó'
            });
            break;
          }
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'C03',
  name: 'Nhảy cấp lực lượng bất thường',
  category: 'character',
  severity: 'warning',
  description: 'powerLevel nhảy >2 cấp trong 1 chương mà không có sự kiện tu luyện/đột phá.',
  check(ctx) {
    const issues = [];
    const bible = ctx.bible;

    // So sánh powerLevel giữa chương trước và chương hiện tại
    // Cần data từ import: powerChange trong timeline
    const characters = bible.list('character');
    for (const char of characters) {
      if (!char.timeline || char.timeline.length < 2) continue;

      const events = char.timeline
        .filter(e => e.powerChange)
        .sort((a, b) => a.chapter - b.chapter);

      for (let i = 1; i < events.length; i++) {
        const jump = Math.abs(events[i].powerChange - events[i - 1].powerChange);
        if (jump > 2) {
          issues.push({
            ruleId: 'C03',
            severity: 'warning',
            message: `"${char.name}" nhảy ${jump} cấp lực lượng giữa Chương ${events[i - 1].chapter} và ${events[i].chapter}`,
            location: { chapter: events[i].chapter },
            suggestion: 'Thêm sự kiện tu luyện / đột phá / dùng bảo vật giữa 2 mốc'
          });
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'C04',
  name: 'Tên/biệt danh không nhất quán',
  category: 'character',
  severity: 'note',
  description: 'Nhân vật được gọi bằng tên không có trong Bible (có thể là typo hoặc alias chưa đăng ký).',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    const characters = bible.list('character');
    if (characters.length === 0) return { passed: true, issues: [] };
    
    // Collect all known names and aliases
    const knownNames = new Set();
    for (const char of characters) {
      knownNames.add(char.name);
      if (char.aliases) char.aliases.forEach(a => knownNames.add(a));
    }
    
    // Extract potential character names from dialogue speakers
    const dialogues = extractDialogues(text);
    for (const d of dialogues) {
      if (!d.speaker) continue;
      const speaker = d.speaker.trim();
      if (knownNames.has(speaker)) continue;
      
      // Check if speaker is similar to any known name (1-2 chars different)
      for (const known of knownNames) {
        if (Math.abs(speaker.length - known.length) > 2) continue;
        let diff = 0;
        const maxLen = Math.max(speaker.length, known.length);
        for (let i = 0; i < maxLen; i++) {
          if (speaker[i] !== known[i]) diff++;
          if (diff > 2) break;
        }
        if (diff > 0 && diff <= 2) {
          issues.push({
            ruleId: 'C04',
            severity: 'note',
            message: `Tên "${speaker}" gần giống "${known}" — có thể là typo?`,
            location: { chapter: ctx.chapter.number },
            suggestion: `Kiểm tra lại tên hoặc thêm "${speaker}" vào aliases trong Bible`
          });
          break;
        }
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'C05',
  name: 'Nhân vật biến mất',
  category: 'character',
  severity: 'note',
  description: 'Nhân vật quan trọng (role=protagonist|main) không xuất hiện trong ≥3 chương liên tiếp.',
  check(ctx) {
    const issues = [];
    const bible = ctx.bible;

    if (!ctx.allChapters || ctx.allChapters.length < 4) return { passed: true, issues: [] };

    const mainChars = bible.list('character')
      .filter(c => ['protagonist', 'main', 'deuteragonist'].includes(c.attributes?.role));

    for (const char of mainChars) {
      const names = [char.name, ...(char.aliases || [])];
      let consecutiveMissing = 0;
      let missingStart = 0;

      for (const ch of ctx.allChapters) {
        const found = names.some(name => ch.text.includes(name));
        if (!found) {
          if (consecutiveMissing === 0) missingStart = ch.number;
          consecutiveMissing++;
        } else {
          if (consecutiveMissing >= 3) {
            issues.push({
              ruleId: 'C05',
              severity: 'note',
              message: `"${char.name}" biến mất ${consecutiveMissing} chương liên tiếp (Ch.${missingStart}–Ch.${ch.number - 1})`,
              location: { chapter: missingStart },
              suggestion: 'Nhắc đến hoặc giải thích lý do vắng mặt'
            });
          }
          consecutiveMissing = 0;
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'C06',
  name: 'Quan hệ mâu thuẫn',
  category: 'character',
  severity: 'warning',
  description: 'Nhân vật A gọi B là "sư đệ" nhưng Bible ghi B là "sư phụ" của A.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    const characters = bible.list('character');
    
    // Map relationship terms to types
    const relTerms = {
      'sư phụ': 'master', 'thầy': 'master', 'sư tôn': 'master',
      'đồ đệ': 'disciple', 'sư đệ': 'junior_brother', 'sư huynh': 'senior_brother',
      'sư tỷ': 'senior_sister', 'sư muội': 'junior_sister',
      'cha': 'father', 'phụ thân': 'father', 'ba': 'father',
      'mẹ': 'mother', 'mẫu thân': 'mother', 'má': 'mother',
      'anh': 'elder_brother', 'huynh': 'elder_brother',
      'em': 'younger_sibling', 'đệ': 'younger_brother'
    };
    
    const dialogues = extractDialogues(text);
    for (const d of dialogues) {
      if (!d.speaker || !d.line) continue;
      const speakerChar = characters.find(c => 
        c.name === d.speaker || c.aliases?.includes(d.speaker)
      );
      if (!speakerChar || !speakerChar.relationships?.length) continue;
      
      // Check each relationship term in dialogue
      for (const [term, relType] of Object.entries(relTerms)) {
        const termRegex = new RegExp(`(?:gọi|xưng|kêu)\\s+(?:là\\s+)?${term}|${term}\\s+(?:ơi|à|a)`, 'i');
        if (!termRegex.test(d.line)) continue;
        
        // Find who they're addressing
        for (const char of characters) {
          if (char.id === speakerChar.id) continue;
          const charNames = [char.name, ...(char.aliases || [])];
          const mentionedInLine = charNames.some(n => d.line.includes(n));
          if (!mentionedInLine) continue;
          
          // Check Bible relationship
          const bibleRel = speakerChar.relationships.find(r => r.targetId === char.id);
          if (bibleRel && bibleRel.type !== relType) {
            issues.push({
              ruleId: 'C06',
              severity: 'warning',
              message: `"${speakerChar.name}" gọi "${char.name}" là "${term}" nhưng Bible ghi quan hệ: "${bibleRel.type}"`,
              location: { chapter: ctx.chapter.number },
              suggestion: 'Kiểm tra quan hệ trong Bible hoặc cập nhật nếu đã thay đổi'
            });
          }
        }
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'C07',
  name: 'Ngoại hình thay đổi không giải thích',
  category: 'character',
  severity: 'note',
  description: 'Mô tả ngoại hình nhân vật mâu thuẫn giữa các chương.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    const characters = bible.list('character');
    
    // Appearance keywords
    const appearancePatterns = {
      hair: /(?:tóc\s+)(đen|trắng|bạc|đỏ|vàng|nâu|xanh|dài|ngắn|buộc|xõa|cắt)/gi,
      eyes: /(?:mắt\s+)(đen|nâu|xanh|đỏ|vàng|một|mù|sáng|mờ)/gi,
      scar: /(?:sẹo|vết thương)\s+(?:trên|ở)\s+(mặt|tay|ngực|lưng|trán)/gi,
      build: /(?:người\s+)(cao|thấp|gầy|mập|to|nhỏ|vạm vỡ|mảnh khảnh)/gi
    };
    
    for (const char of characters) {
      if (!char.attributes?.appearance) continue;
      const charNames = [char.name, ...(char.aliases || [])];
      
      // Find character descriptions in this chapter
      for (const name of charNames) {
        if (!text.includes(name)) continue;
        const contexts = getAllNameContexts(text, name, 200);
        
        for (const { context } of contexts) {
          // Check hair
          if (char.attributes.appearance.hair) {
            const hairMatch = context.match(/tóc\s+(đen|trắng|bạc|đỏ|vàng|nâu|xanh|dài|ngắn)/i);
            if (hairMatch && !char.attributes.appearance.hair.toLowerCase().includes(hairMatch[1].toLowerCase())) {
              issues.push({
                ruleId: 'C07',
                severity: 'note',
                message: `"${char.name}" — tóc ghi "${char.attributes.appearance.hair}" nhưng chương này viết "tóc ${hairMatch[1]}"`,
                location: { chapter: ctx.chapter.number },
                suggestion: 'Cập nhật appearance trong Bible nếu đã thay đổi, hoặc sửa text'
              });
            }
          }
        }
        break; // Only check first matching name
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

// ═══ NHÓM 3: THẾ GIỚI (W01–W06) ═══

RULES.push({
  id: 'W01',
  name: 'Quy tắc thế giới bị phá vỡ',
  category: 'world',
  severity: 'critical',
  description: 'Hệ thống phép thuật, vật phẩm, hoặc quy tắc thế giới mâu thuẫn với chương trước.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    
    // Check if Bible has world rules defined
    const factions = bible.list('faction');
    const items = bible.list('item');
    
    // Rule: items with restrictions
    for (const item of items) {
      if (!item.restrictions) continue;
      const itemNames = [item.name, ...(item.aliases || [])];
      for (const itemName of itemNames) {
        if (!text.includes(itemName)) continue;
        
        // Check restriction violations
        if (item.restrictions.onlyUser) {
          const allowedChar = bible.list('character').find(c => c.id === item.restrictions.onlyUser);
          if (allowedChar) {
            const context = getNameContext(text, itemName, 200);
            const allowedNames = [allowedChar.name, ...(allowedChar.aliases || [])];
            const userPresent = allowedNames.some(n => context.includes(n));
            if (!userPresent) {
              const actionNear = /(?:cầm|dùng|sử dụng|kích hoạt|rút|vung|phóng)/i.test(context);
              if (actionNear) {
                issues.push({
                  ruleId: 'W01',
                  severity: 'critical',
                  message: `"${item.name}" chỉ "${allowedChar.name}" mới dùng được, nhưng có người khác đang sử dụng`,
                  location: { chapter: ctx.chapter.number },
                  suggestion: 'Kiểm tra ai đang dùng vật phẩm hạn chế này'
                });
              }
            }
          }
        }
        break;
      }
    }
    
    // Rule: factions with forbidden actions
    for (const faction of factions) {
      if (!faction.rules) continue;
      const members = bible.list('character').filter(c => c.attributes?.faction === faction.id);
      
      for (const rule of faction.rules) {
        if (!rule.forbidden) continue;
        for (const member of members) {
          const memberNames = [member.name, ...(member.aliases || [])];
          for (const name of memberNames) {
            if (!text.includes(name)) continue;
            const context = getNameContext(text, name, 200);
            const regex = new RegExp(rule.forbidden, 'i');
            if (regex.test(context)) {
              issues.push({
                ruleId: 'W01',
                severity: 'critical',
                message: `"${member.name}" (${faction.name}) vi phạm: "${rule.description || rule.forbidden}"`,
                location: { chapter: ctx.chapter.number },
                suggestion: 'Kiểm tra xem hành vi có được giải thích/phá lệ trong cốt truyện không'
              });
            }
            break;
          }
        }
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'W02',
  name: 'Vật phẩm trùng chủ',
  category: 'world',
  severity: 'warning',
  description: 'Vật phẩm đã trao cho nhân vật A nhưng nhân vật B vẫn sử dụng.',
  check(ctx) {
    const issues = [];
    const bible = ctx.bible;
    const text = ctx.chapter.text;

    const items = bible.list('item').filter(i => i.status === 'active' && i.owner);

    for (const item of items) {
      const itemNames = [item.name, ...(item.aliases || [])];
      for (const itemName of itemNames) {
        if (!text.includes(itemName)) continue;

        // Kiểm tra ai dùng vật phẩm này trong chương
        const context = getNameContext(text, itemName, 200);
        const owner = bible.list('character').find(c => c.id === item.owner);
        if (!owner) continue;

        const ownerNames = [owner.name, ...(owner.aliases || [])];
        const ownerMentioned = ownerNames.some(n => context.includes(n));

        if (!ownerMentioned) {
          const otherChars = bible.list('character').filter(c => c.id !== item.owner);
          let foundOther = false;
          for (const other of otherChars) {
            const otherNames = [other.name, ...(other.aliases || [])];
            if (otherNames.some(n => context.includes(n))) {
              issues.push({
                ruleId: 'W02',
                severity: 'warning',
                message: `"${item.name}" thuộc "${owner.name}" nhưng "${other.name}" đang dùng?`,
                location: { chapter: ctx.chapter.number },
                suggestion: `Cập nhật chủ sở hữu nếu đã trao đổi, hoặc kiểm tra ngữ cảnh`
              });
              foundOther = true;
              break;
            }
          }
          // Fallback: item used with action verbs but owner absent (catches non-Bible characters)
          if (!foundOther) {
            const actionNearItem = /(?:rút|cầm|vung|sử dụng|dùng|phóng|ném|chém|đâm|bắn|kích hoạt|mở|đeo|mang)/i.test(context);
            if (actionNearItem) {
              issues.push({
                ruleId: 'W02',
                severity: 'note',
                message: `"${item.name}" (của "${owner.name}") được sử dụng nhưng "${owner.name}" không ở gần`,
                location: { chapter: ctx.chapter.number },
                suggestion: 'Kiểm tra ai đang dùng vật phẩm này'
              });
            }
          }
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'W03',
  name: 'Địa danh không tồn tại',
  category: 'world',
  severity: 'note',
  description: 'Đề cập địa danh mới chưa có trong Bible.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    const knownLocations = bible.list('location');
    const knownNames = new Set();
    for (const loc of knownLocations) {
      knownNames.add(loc.name);
      if (loc.aliases) loc.aliases.forEach(a => knownNames.add(a));
    }
    
    // Pattern: location-introducing phrases
    const locPatterns = [
      /(?:đến|tới|về|ở|tại|vào|rời|rời khỏi|đi qua|ngang qua)\s+([\p{Lu}][\p{L}]+(?:\s+[\p{Lu}][\p{L}]+){0,3})/gu,
      /(?:thành|núi|sông|hồ|đảo|động|hang|cung|điện|phủ|miếu|chùa|am|viện|các|đạo)\s+([\p{Lu}][\p{L}]+(?:\s+[\p{Lu}][\p{L}]+){0,2})/gu
    ];
    
    const potentialLocations = new Set();
    for (const pattern of locPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (name.length >= 2 && name.length <= 30) {
          potentialLocations.add(name);
        }
      }
    }
    
    // Filter: remove known names, character names, common words
    const characters = bible.list('character');
    const charNames = new Set();
    for (const c of characters) {
      charNames.add(c.name);
      if (c.aliases) c.aliases.forEach(a => charNames.add(a));
    }
    
    const commonWords = new Set(['Đường', 'Thiên', 'Đại', 'Tiểu', 'Bắc', 'Nam', 'Đông', 'Tây']);
    
    for (const name of potentialLocations) {
      if (knownNames.has(name) || charNames.has(name) || commonWords.has(name)) continue;
      issues.push({
        ruleId: 'W03',
        severity: 'note',
        message: `Địa danh "${name}" chưa có trong Bible`,
        location: { chapter: ctx.chapter.number },
        suggestion: 'Nếu là địa danh mới: thêm vào Bible. Nếu không: bỏ qua.'
      });
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'W04',
  name: 'Phe phái mâu thuẫn',
  category: 'world',
  severity: 'warning',
  description: 'Nhân vật hành động ngược với phe phái đang thuộc mà không có giải thích.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    const bible = ctx.bible;
    const factions = bible.list('faction');
    const characters = bible.list('character');
    
    // Define faction alignment keywords
    const alignmentKeywords = {
      good: /(?:cứu người|giúp đỡ|từ bi|nhân nghĩa|bảo vệ|thiện lương|hành hiệp)/i,
      evil: /(?:giết người vô tội|tà đạo|hút máu|nguyền rủa|hại người|tàn sát|diệt môn)/i,
      neutral: null
    };
    
    for (const char of characters) {
      if (!char.attributes?.faction) continue;
      const faction = factions.find(f => f.id === char.attributes.faction);
      if (!faction?.alignment) continue;
      
      const charNames = [char.name, ...(char.aliases || [])];
      for (const name of charNames) {
        if (!text.includes(name)) continue;
        const context = getNameContext(text, name, 200);
        
        // Good faction member doing evil
        if (faction.alignment === 'good' && alignmentKeywords.evil?.test(context)) {
          issues.push({
            ruleId: 'W04',
            severity: 'warning',
            message: `"${char.name}" (${faction.name}, phe thiện) có hành vi tà ác`,
            location: { chapter: ctx.chapter.number },
            suggestion: 'Nếu có lý do: thêm giải thích. Nếu phản bội: cập nhật faction.'
          });
        }
        
        // Evil faction member being righteous
        if (faction.alignment === 'evil' && alignmentKeywords.good?.test(context)) {
          issues.push({
            ruleId: 'W04',
            severity: 'note',
            message: `"${char.name}" (${faction.name}, phe tà) có hành vi chính nghĩa`,
            location: { chapter: ctx.chapter.number },
            suggestion: 'Nếu cố ý (phát triển nhân vật): OK. Nếu vô tình: kiểm tra lại.'
          });
        }
        break;
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

// ═══ NHÓM 4: MẠCH TRUYỆN (P01–P08) ═══

RULES.push({
  id: 'P01',
  name: 'Lỗ hổng cốt truyện (foreshadowing bỏ quên)',
  category: 'plot',
  severity: 'warning',
  description: 'Manh mối/bí ẩn được đặt ra nhưng không bao giờ giải quyết.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    
    // Foreshadowing patterns
    const foreshadowPatterns = [
      /(?:rồi sẽ biết|sau này|sẽ có ngày|rồi sẽ hiểu|chuyện này.*chưa kết thúc|còn.*phải giải quyết)/gi,
      /(?:bí mật|bí ẩn|chưa ai biết|ẩn giấu|chưa đến lúc|chưa phải lúc)/gi,
      /(?:lời tiên tri|dự ngôn|điềm báo|ngày đó sẽ tới)/gi
    ];
    
    // Resolution patterns
    const resolutionPatterns = [
      /(?:hóa ra|thì ra|cuối cùng.*hiểu|bí mật.*phơi bày|sự thật.*lộ|giải đáp|đáp án|lời giải)/gi,
      /(?:lời tiên tri.*ứng nghiệm|dự ngôn.*thành|điềm báo.*đúng)/gi
    ];
    
    // Count foreshadows vs resolutions in recent chapters
    const recentChapters = [...(ctx.previousChapters || []).slice(-9), ctx.chapter];
    let totalForeshadow = 0;
    let totalResolution = 0;
    
    for (const ch of recentChapters) {
      for (const pattern of foreshadowPatterns) {
        const matches = ch.text.match(pattern);
        if (matches) totalForeshadow += matches.length;
      }
      for (const pattern of resolutionPatterns) {
        const matches = ch.text.match(pattern);
        if (matches) totalResolution += matches.length;
      }
    }
    
    // If many foreshadows but few resolutions over 10 chapters
    if (totalForeshadow > 5 && totalResolution < totalForeshadow * 0.2) {
      issues.push({
        ruleId: 'P01',
        severity: 'warning',
        message: `${totalForeshadow} manh mối/bí ẩn đặt ra trong 10 chương gần, chỉ ${totalResolution} được giải quyết`,
        location: { chapter: ctx.chapter.number },
        suggestion: 'Bắt đầu giải quyết một số tuyến bí ẩn cũ trước khi mở thêm mới'
      });
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'P02',
  name: 'Deus ex machina',
  category: 'plot',
  severity: 'note',
  description: 'Giải pháp xuất hiện đột ngột không có manh mối trước đó.',
  check(ctx) {
    const issues = [];
    const text = ctx.chapter.text;
    
    // Deus ex machina patterns: sudden rescue, power awakening without prior mention
    const deusPatterns = [
      /(?:đúng lúc.*nguy cấp.*xuất hiện|bỗng nhiên.*cứu|đột ngột.*sức mạnh|bất ngờ.*thức tỉnh)/gi,
      /(?:từ đâu.*xuất hiện.*cứu|vô cớ.*mạnh lên|không rõ vì sao.*có thể)/gi,
      /(?:may mắn thay|đúng lúc đó|bỗng dưng|tự dưng|không hiểu sao)/gi
    ];
    
    let deusCount = 0;
    const deusExamples = [];
    
    for (const pattern of deusPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        deusCount++;
        if (deusExamples.length < 3) {
          deusExamples.push(match[0].substring(0, 50));
        }
      }
    }
    
    if (deusCount >= 2) {
      issues.push({
        ruleId: 'P02',
        severity: 'note',
        message: `${deusCount} đoạn có dấu hiệu deus ex machina: "${deusExamples.join('", "')}"`,
        location: { chapter: ctx.chapter.number },
        suggestion: 'Thêm manh mối/foreshadowing ở chương trước để giải pháp không quá đột ngột'
      });
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'P03',
  name: 'Lặp cốt truyện',
  category: 'plot',
  severity: 'note',
  description: 'Cùng một cấu trúc xung đột-giải quyết lặp lại nhiều lần liên tiếp.',
  check(ctx) {
    const issues = [];
    if (!ctx.previousChapters || ctx.previousChapters.length < 2) return { passed: true, issues: [] };
    
    // Define plot beat patterns
    const plotBeats = {
      combat: /(?:chiến đấu|giao đấu|đánh nhau|tỉ thí|tấn công|xuất chiêu|đấu pháp)/gi,
      rescue: /(?:cứu người|giải cứu|cứu được|thoát nạn|thoát hiểm)/gi,
      training: /(?:tu luyện|luyện công|đột phá|tăng cấp|ngồi thiền|vận công)/gi,
      travel: /(?:lên đường|khởi hành|di chuyển|đi đến|rời khỏi)/gi,
      feast: /(?:yến tiệc|tiệc rượu|ăn uống|bữa cơm|mời rượu)/gi
    };
    
    // Get patterns for last 3 chapters + current
    const recentChapters = [...ctx.previousChapters.slice(-2), ctx.chapter];
    const chapterPatterns = recentChapters.map(ch => {
      const patterns = {};
      for (const [name, regex] of Object.entries(plotBeats)) {
        const matches = ch.text.match(regex);
        patterns[name] = matches ? matches.length : 0;
      }
      return { chapter: ch.number, patterns };
    });
    
    // Check for dominant repeating patterns
    if (chapterPatterns.length >= 3) {
      for (const [beatName] of Object.entries(plotBeats)) {
        const allHigh = chapterPatterns.every(cp => cp.patterns[beatName] >= 3);
        if (allHigh) {
          issues.push({
            ruleId: 'P03',
            severity: 'note',
            message: `Pattern "${beatName}" lặp lại nhiều trong ${chapterPatterns.length} chương liên tiếp (Ch.${chapterPatterns.map(c => c.chapter).join(', ')})`,
            location: { chapter: ctx.chapter.number },
            suggestion: 'Xen kẽ các loại cảnh khác nhau để tránh đơn điệu'
          });
        }
      }
    }
    
    return { passed: issues.length === 0, issues };
  }
});

RULES.push({
  id: 'P04',
  name: 'Xung đột chưa giải quyết tràn',
  category: 'plot',
  severity: 'warning',
  description: 'Quá nhiều tuyến xung đột mở cùng lúc (>5) mà chưa đóng tuyến nào.',
  check(ctx) {
    const issues = [];
    // Đếm xung đột mở bằng keyword: thù hận, truy đuổi, đối đầu, tranh chấp, bí ẩn, nghi ngờ, phản bội, chiến tranh
    const conflictKeywords = [
      'thù hận', 'truy đuổi', 'đối đầu', 'tranh chấp', 'bí ẩn chưa giải',
      'phản bội', 'chiến tranh', 'mâu thuẫn', 'kẻ thù', 'đe doạ',
      'truy sát', 'trốn chạy', 'phục kích', 'thách đấu', 'huyết thù'
    ];
    const resolutionKeywords = [
      'hoà giải', 'giải quyết', 'kết thúc', 'tha thứ', 'đầu hàng',
      'tiêu diệt', 'giết được', 'chiến thắng', 'bại lộ', 'sự thật phơi bày',
      'đoàn tụ', 'dàn xếp', 'thu phục', 'bình yên trở lại'
    ];

    // Check 5 chương gần nhất
    const recentChapters = [...(ctx.previousChapters || []).slice(-4), ctx.chapter];
    let openConflicts = 0;
    let resolutions = 0;

    for (const ch of recentChapters) {
      const lowerText = ch.text.toLowerCase();
      for (const kw of conflictKeywords) {
        const matches = lowerText.match(new RegExp(kw, 'gi'));
        if (matches) openConflicts += matches.length;
      }
      for (const kw of resolutionKeywords) {
        const matches = lowerText.match(new RegExp(kw, 'gi'));
        if (matches) resolutions += matches.length;
      }
    }

    const netConflicts = openConflicts - resolutions;
    if (netConflicts > 15) { // ~3+ per chapter = quá nhiều
      issues.push({
        ruleId: 'P04',
        severity: 'warning',
        message: `Phát hiện ${openConflicts} xung đột mở vs ${resolutions} giải quyết trong 5 chương gần nhất (dư ${netConflicts})`,
        location: { chapter: ctx.chapter.number },
        suggestion: 'Đóng bớt 1-2 tuyến xung đột trước khi mở thêm, tránh reader overload'
      });
    }

    return { passed: issues.length === 0, issues };
  }
});

// ═══ NHÓM 5: GIỌNG VĂN + ĐỐI THOẠI (V01-V05 — xem voice-profiles.md) ═══

RULES.push({
  id: 'V01',
  name: 'Đại từ sai',
  category: 'character',
  severity: 'warning',
  description: 'Nhân vật dùng đại từ không phải của mình (VD: Huyền Trang xưng "tôi" thay vì "tao"/"bần tăng").',
  check(ctx) {
    const issues = [];
    const bible = ctx.bible;
    const text = ctx.chapter.text;

    // Lấy voice profiles
    const characters = bible.list('character');
    const voiceDir = ctx.voiceDir;
    if (!voiceDir) return { passed: true, issues: [] };

    for (const char of characters) {
      const voicePath = `${voiceDir}/${char.id}.json`;
      const voice = readJSON(voicePath);
      if (!voice?.pronouns?.self) continue;

      // Trích đối thoại gán cho nhân vật này
      const dialogues = extractDialogues(text);
      const charNames = [char.name, ...(char.aliases || [])];

      for (const d of dialogues) {
        if (!d.speaker) continue;
        const isSpeaker = charNames.some(n =>
          d.speaker.includes(n) || n.includes(d.speaker)
        );
        if (!isSpeaker) continue;

        // Kiểm tra đại từ trong lời thoại
        const selfPronoun = voice.pronouns.self;
        const forbiddenPronouns = ['tao', 'ta', 'tôi', 'tớ', 'mình', 'bần tăng', 'lão', 'tiểu sinh']
          .filter(p => p !== selfPronoun && p !== voice.pronouns.selfFormal);

        for (const fp of forbiddenPronouns) {
          // Vietnamese-safe word boundary: (?<=\s|^|[,."'!?]) ... (?=\s|$|[,."'!?])
          const escaped = fp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?<=\\s|^|[,."'!?])${escaped}(?=\\s|$|[,."'!?])`, 'gi');
          if (regex.test(d.line)) {
            issues.push({
              ruleId: 'V01',
              severity: 'warning',
              message: `"${char.name}" xưng "${fp}" thay vì "${selfPronoun}" — "${d.line.substring(0, 60)}..."`,
              location: { chapter: ctx.chapter.number },
              suggestion: `Đổi "${fp}" → "${selfPronoun}" hoặc "${voice.pronouns.selfFormal || selfPronoun}"`
            });
          }
        }
      }
    }

    return { passed: issues.length === 0, issues };
  }
});

// ═══ HÀM HỖ TRỢ ═══

/**
 * Trích mốc thời gian từ văn bản
 */
function extractTimeMarkers(text) {
  const markers = [];
  const patterns = [
    { regex: /(?:bình minh|rạng đông|trời vừa sáng)/gi, time: 'dawn' },
    { regex: /(?:buổi sáng|sáng sớm|sáng hôm)/gi, time: 'morning' },
    { regex: /(?:giữa trưa|chính ngọ|giờ ngọ|buổi trưa)/gi, time: 'noon' },
    { regex: /(?:buổi chiều|chiều tà|xế chiều)/gi, time: 'afternoon' },
    { regex: /(?:buổi tối|hoàng hôn|nhá nhem|chiều muộn)/gi, time: 'evening' },
    { regex: /(?:ban đêm|đêm khuya|giữa đêm|nửa đêm)/gi, time: 'night' },
    { regex: /(?:canh ba|canh tư|canh năm)/gi, time: 'latenight' }
  ];

  for (const { regex, time } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const isFlashback = /(?:nhớ lại|hồi tưởng|ngày ấy|năm xưa|kiếp trước|trong mơ|kể về|lúc còn sống|trước kia)/.test(
        text.substring(Math.max(0, match.index - 150), match.index)
      );
      markers.push({
        time,
        position: match.index,
        matched: match[0],
        isFlashback
      });
    }
  }

  return markers.sort((a, b) => a.position - b.position);
}

/**
 * Lấy ngữ cảnh xung quanh TẤT CẢ occurrences của tên trong văn bản
 * Trả về mảng contexts (hoặc string gộp nếu chỉ cần check keyword)
 */
function getNameContext(text, name, range = 100) {
  const contexts = [];
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const idx = text.indexOf(name, searchFrom);
    if (idx === -1) break;
    const start = Math.max(0, idx - range);
    const end = Math.min(text.length, idx + name.length + range);
    contexts.push(text.substring(start, end));
    searchFrom = idx + name.length;
  }
  // Trả về gộp tất cả contexts — tương thích API cũ (string)
  return contexts.join(' … ');
}

/**
 * Lấy TẤT CẢ occurrences riêng lẻ (dùng khi cần check từng lần)
 */
function getAllNameContexts(text, name, range = 100) {
  const contexts = [];
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const idx = text.indexOf(name, searchFrom);
    if (idx === -1) break;
    const start = Math.max(0, idx - range);
    const end = Math.min(text.length, idx + name.length + range);
    contexts.push({ position: idx, context: text.substring(start, end) });
    searchFrom = idx + name.length;
  }
  return contexts;
}

/**
 * Nhãn tiếng Việt cho thời gian
 */
function timeLabel(time) {
  const labels = {
    dawn: 'Bình minh',
    morning: 'Buổi sáng',
    noon: 'Giữa trưa',
    afternoon: 'Buổi chiều',
    evening: 'Buổi tối',
    night: 'Ban đêm',
    midnight: 'Nửa đêm',
    latenight: 'Khuya'
  };
  return labels[time] || time;
}

export { extractTimeMarkers, getNameContext, timeLabel };
