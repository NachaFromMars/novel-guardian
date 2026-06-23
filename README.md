# novel-guardian — Continuity guardian for long-form fiction

> Keep your novel internally consistent across every chapter. Five modules track characters, scan for contradictions, analyze pacing, monitor style drift, and compile unified reports.

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blueviolet)](https://github.com/NachaFromMars)

## Overview
novel-guardian is a continuity engine for novelists who need their world to hold together across hundreds of pages. It maintains a structured story bible, scans chapters against 20 consistency rules, charts emotional pacing across 5 intensity levels, and tracks prose style over time. Built in pure JavaScript (Node.js ESM), no external API dependencies. Optimized for Vietnamese fiction.

## Features
| Module | What it does |
|---|---|
| **Bible** | Manage characters, locations, factions, items, events — search + export MD/JSON |
| **Scanner** | 20 rules (timeline, character, world, plot) — scan 1 chapter, range, or full manuscript |
| **Pacing** | 5 levels: TĨNH→DÂNG→CĂNG→CAO TRÀO→HẠ NHIỆT — ASCII chart + pattern detection (monotone/jump/wave) |
| **Style** | Vocab/sentence/punctuation stats, drift detection, auto baseline |
| **Report** | Combined continuity+pacing+style output — Markdown + JSON |

## Usage / Quick Start
Pure Node.js ESM — no install needed beyond Node. Drive conversationally with the trigger keywords below or call the CLI directly.

## Trigger Keywords (OpenClaw)
novel guardian, kiểm tra liền mạch, quét mâu thuẫn, consistency check, character bible, pacing analysis, plot hole, continuity

## Related Skills
- [novel-master](https://github.com/NachaFromMars/novel-master) — full quality guardian + forge orchestrator
- [novelcore-ai](https://github.com/NachaFromMars/novelcore-ai) — AI novel writing system

---
Part of the [NachaFromMars](https://github.com/NachaFromMars) OpenClaw skill ecosystem.
