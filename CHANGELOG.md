# Changelog — Novel Guardian

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.2] — 2026-03-10

### Fixed
- `_updateIndex` uses `TYPE_DIR_MAP` for correct directory paths (was counting 0 for locations/items/events)
- `projectName` reads from `guardian.json` if index doesn't have it
- T03: removed standalone "tới" (false positive), added "đi tới", "bay tới", etc.
- C01: per-occurrence flashback detection (prevents contamination from single flashback mention)
- `countSentences`: handles `…` (ellipsis) and `...` (triple dot) correctly
- `getFlag()`: returns null for empty string instead of crashing with boolean `true`

### Added
- CLI `bible update <type> <id> --name/--status/--desc` — full Update support
- CLI `bible delete <type> <id>` — soft Delete support (archive)
- CLI `--significance`, `--chapter`, `--desc` flags for `bible create`

### Changed
- Version bump: 1.0.1 → 1.0.2
- SKILL.md: clarified Bible features (full CRUD via CLI)

## [1.0.1] — 2026-03-10

### Fixed
- Tests now idempotent — `rmSync` cleanup at start of every test file
- Bible search CLI — filter `--flags` from keyword before search
- Scanner catch blocks now log warnings instead of swallowing errors
- `slugify(null/undefined)` returns `''` instead of crash
- `_updateIndex()` uses `readdirSync` count instead of `list()` (56% faster)
- Benchmark output `═` repeat formatting
- `getNameContext` scans ALL occurrences, not just first
- V01 regex uses Vietnamese-safe boundary instead of `\b`

### Added
- P04 rule (plot overload) now active with conflict/resolution logic
- `getAllNameContexts()` for per-occurrence checking
- `enabled` flag support per rule in scanner
- Named constants for context ranges (CONTEXT_RANGE_SHORT/MEDIUM/LONG, etc.)
- SKILL.md rule tables now show status column (✅ Active / 🔨 Planned v1.1)
- LICENSE file (MIT)
- CHANGELOG.md

### Changed
- Flashback detection range: 50→150 chars + more keywords

## [1.0.0] — 2026-03-10

### Added
- 20 Continuity Rules across 4 categories (time/character/world/plot)
  - 10 Active: T01, T02, T03, C01, C02, C03, C05, V01, W02, P04
  - 10 Planned: T04, C04, C06, C07, W01, W03, W04, P01, P02, P03
- 5-Level Pacing Model (TĨNH→DÂNG→CĂNG→CAO TRÀO→HẠ NHIỆT)
- Vietnamese Style Analysis (vocabulary, pronouns, dialogue)
- Bible Manager with 5 entity types (character, location, faction, item, event)
- 8 CLI Commands (init, scan, pacing, style, bible, status, report, help)
- 39 Unit Tests (all passing)
- Benchmark Tool (590ms for 20 chapters)
- Full Documentation (SKILL.md, INTEGRATION.md, RELEASE.md, references)
- Zero external dependencies (pure Node.js ESM)
