#!/bin/bash

# Novel Guardian — Build Package Script
# Tạo tarball sẵn sàng distribute

set -e

PKG_VERSION="1.0.1"
PKG_NAME="novel-guardian"
BUILD_DIR="/tmp/ng-package-build"
DIST_DIR="/root/.openclaw/workspace/dist"

echo "📦 Building Novel Guardian v${PKG_VERSION}..."

# ─── Clean ───
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# ─── Copy Files (exclude tests, benchmarks, data/) ───
echo "📁 Copying files..."
mkdir -p "$BUILD_DIR/novel-guardian/scripts/lib"
mkdir -p "$BUILD_DIR/novel-guardian/references"
mkdir -p "$BUILD_DIR/novel-guardian/examples"

# Core files
cp ~/.openclaw/workspace/skills/novel-guardian/scripts/novel-guardian.mjs "$BUILD_DIR/novel-guardian/scripts/"
cp ~/.openclaw/workspace/skills/novel-guardian/scripts/lib/*.mjs "$BUILD_DIR/novel-guardian/scripts/lib/"

# References + examples
cp ~/.openclaw/workspace/skills/novel-guardian/references/*.md "$BUILD_DIR/novel-guardian/references/"
cp ~/.openclaw/workspace/skills/novel-guardian/examples/*.md "$BUILD_DIR/novel-guardian/examples/" 2>/dev/null || true

# Documentation
cp ~/.openclaw/workspace/skills/novel-guardian/SKILL.md "$BUILD_DIR/novel-guardian/"
cp ~/.openclaw/workspace/skills/novel-guardian/INTEGRATION.md "$BUILD_DIR/novel-guardian/"
cp ~/.openclaw/workspace/skills/novel-guardian/RELEASE.md "$BUILD_DIR/novel-guardian/"
cp ~/.openclaw/workspace/skills/novel-guardian/CHANGELOG.md "$BUILD_DIR/novel-guardian/"
cp ~/.openclaw/workspace/skills/novel-guardian/README.md "$BUILD_DIR/novel-guardian/"
cp ~/.openclaw/workspace/skills/novel-guardian/LICENSE "$BUILD_DIR/novel-guardian/"
cp ~/.openclaw/workspace/skills/novel-guardian/package.json "$BUILD_DIR/novel-guardian/"

# Set executable permission
chmod +x "$BUILD_DIR/novel-guardian/scripts/novel-guardian.mjs"

# ─── Create tarball ───
echo "📦 Creating tarball..."
cd "$BUILD_DIR"
tar -czf "$DIST_DIR/novel-guardian-${PKG_VERSION}.tar.gz" novel-guardian/
cd "$DIST_DIR"

# ─── Generate checksum ───
echo "🔐 Generating checksums..."
sha256sum "novel-guardian-${PKG_VERSION}.tar.gz" > "novel-guardian-${PKG_VERSION}.sha256"

# ─── Summary ───
echo ""
echo "═══════════════════════════════════════════"
echo "✅ PACKAGE READY — v${PKG_VERSION}"
echo "═══════════════════════════════════════════"
echo ""
echo "📦 Distribution files:"
ls -lh "$DIST_DIR/novel-guardian-${PKG_VERSION}"*
echo ""
echo "📁 Package contents:"
tar -tzf "$DIST_DIR/novel-guardian-${PKG_VERSION}.tar.gz" | head -20
echo ""
