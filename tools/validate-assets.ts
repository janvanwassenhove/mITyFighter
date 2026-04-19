/**
 * @fileoverview Asset validation CLI tool for pack-based fighter assets
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/QUALITY_GATES.md - validate:assets script
 *
 * Run with: npm run validate:assets
 */

/* eslint-disable no-undef, no-console */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Constants
// =============================================================================

const PACKS_DIR = 'public/packs';
const PACKS_JSON = 'public/data/packs.json';
const BACKGROUNDS_DIR = 'public/backgrounds';

/** Standard pack actions that every fighter should have */
const REQUIRED_ACTIONS = [
  'idle', 'walk', 'run', 'jump', 'crouch', 'block',
  'hurt', 'ko', 'punch', 'kick', 'special', 'win', 'intro',
];

// =============================================================================
// Types
// =============================================================================

interface PackIndex {
  packs: string[];
}

interface PackManifest {
  name: string;
  version: string;
  character: {
    id: string;
    displayName: string;
    tagline: string;
    bio: string;
    motivation: string;
  };
  spriteSize: { width: number; height: number };
  animationCount: number;
  profilePicCount: number;
  animations: PackManifestAnimation[];
  profilePics: PackManifestProfilePic[];
  exportedAt: string;
}

interface PackManifestAnimation {
  name: string;
  folder: string;
  frameCount: number;
  loop: string;
  totalDuration: number;
  frames: Array<{ index: number; delay: number; hitboxes: unknown[] }>;
  spriteSheet: string;
  gif: string;
}

interface PackManifestProfilePic {
  type: string;
  filename: string;
}

interface BackgroundEntry {
  id: string;
  displayName: string;
  file: string;
}

// Empty for now - no backgrounds registered
const BACKGROUND_REGISTRY: Record<string, BackgroundEntry> = {};

// =============================================================================
// PNG Dimension Reader
// =============================================================================

/**
 * Read PNG dimensions from file header.
 * PNG files have dimensions at a fixed offset in the IHDR chunk.
 *
 * @returns Dimensions or null if unreadable
 */
function getPngDimensions(
  filePath: string
): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);

    // Check PNG signature
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!buffer.subarray(0, 8).equals(pngSignature)) {
      return null;
    }

    // IHDR chunk starts at byte 8
    // Width is at bytes 16-19, Height is at bytes 20-23 (big-endian)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
  } catch {
    return null;
  }
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationError {
  type: 'error' | 'warning';
  target: string;
  message: string;
}

let errors: ValidationError[] = [];

function logSuccess(message: string): void {
  console.log(`  ✓ ${message}`);
}

function logError(target: string, message: string): void {
  console.log(`  ✗ ${message}`);
  errors.push({ type: 'error', target, message });
}

function logWarning(target: string, message: string): void {
  console.log(`  ⚠ ${message}`);
  errors.push({ type: 'warning', target, message });
}

/**
 * Validate a single fighter pack.
 *
 * @param packId - Pack folder name
 */
function validatePack(packId: string): void {
  const packDir = path.join(PACKS_DIR, packId);

  // Check manifest exists
  const manifestPath = path.join(packDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    logError(packId, `manifest.json not found in ${packDir}`);
    return;
  }

  let manifest: PackManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    logError(packId, `manifest.json is invalid JSON`);
    return;
  }

  console.log(`\nPack: ${manifest.character.displayName} (${packId})`);
  console.log(`  Frame size: ${manifest.spriteSize.width}x${manifest.spriteSize.height}`);

  const { width: fw, height: fh } = manifest.spriteSize;

  // Check required character fields
  if (!manifest.character.id || !manifest.character.displayName) {
    logError(packId, 'Missing character id or displayName');
  }

  // Track which standard action folders are present
  const presentFolders = new Set<string>();

  // Validate each animation
  for (const anim of manifest.animations) {
    presentFolders.add(anim.folder);
    const actionDir = path.join(packDir, anim.folder);

    if (!fs.existsSync(actionDir)) {
      logError(packId, `Animation folder not found: ${anim.folder}/`);
      continue;
    }

    // Check spritesheet
    const sheetPath = path.join(packDir, anim.spriteSheet);
    if (!fs.existsSync(sheetPath)) {
      logError(packId, `${anim.folder}: spritesheet.png not found`);
      continue;
    }

    const dims = getPngDimensions(sheetPath);
    if (!dims) {
      logError(packId, `${anim.folder}: could not read spritesheet dimensions`);
      continue;
    }

    // Validate height
    if (dims.height !== fh) {
      logError(packId, `${anim.folder}: height ${dims.height} != ${fh}`);
      continue;
    }

    // Validate width is multiple of frame width
    if (dims.width % fw !== 0) {
      logError(packId, `${anim.folder}: width ${dims.width} not multiple of ${fw}`);
      continue;
    }

    const actualFrames = dims.width / fw;

    // Validate frame count matches manifest
    if (actualFrames !== anim.frameCount) {
      logWarning(
        packId,
        `${anim.folder}: manifest says ${anim.frameCount} frames, spritesheet has ${actualFrames}`
      );
    }

    // Check animation.json exists
    if (!fs.existsSync(path.join(actionDir, 'animation.json'))) {
      logWarning(packId, `${anim.folder}: animation.json missing`);
    }

    // Check metadata.json exists
    if (!fs.existsSync(path.join(actionDir, 'metadata.json'))) {
      logWarning(packId, `${anim.folder}: metadata.json missing`);
    }

    // Check frames/ directory
    const framesDir = path.join(actionDir, 'frames');
    if (fs.existsSync(framesDir)) {
      const frameFiles = fs.readdirSync(framesDir).filter((f) => f.endsWith('.png'));
      if (frameFiles.length !== actualFrames) {
        logWarning(
          packId,
          `${anim.folder}: frames/ has ${frameFiles.length} PNGs, expected ${actualFrames}`
        );
      }
    }

    logSuccess(
      `${anim.folder}: ${dims.width}x${dims.height}, ${actualFrames} frames (${anim.loop})`
    );
  }

  // Check required standard actions are present
  for (const req of REQUIRED_ACTIONS) {
    if (!presentFolders.has(req)) {
      logWarning(packId, `Missing standard action: ${req}/`);
    }
  }

  // Validate profile pics
  for (const pic of manifest.profilePics) {
    const picPath = path.join(packDir, pic.filename);
    if (!fs.existsSync(picPath)) {
      logError(packId, `Profile pic not found: ${pic.filename}`);
    } else {
      logSuccess(`profile-pic: ${pic.type}`);
    }
  }

  if (manifest.profilePics.length === 0) {
    logWarning(packId, 'No profile pictures defined');
  }
}

/**
 * Validate a single background.
 *
 * @param backgroundId - Background identifier
 * @param background - Background entry data
 */
function validateBackground(
  backgroundId: string,
  background: BackgroundEntry
): void {
  console.log(`\nBackground: ${background.displayName} (${backgroundId})`);

  const filePath = path.join(BACKGROUNDS_DIR, background.file);

  if (!fs.existsSync(filePath)) {
    logWarning(
      backgroundId,
      `${background.file} not found (backgrounds are optional)`
    );
    return;
  }

  logSuccess(`${background.file} exists`);
}

/**
 * Main validation function.
 */
function main(): void {
  console.log('='.repeat(60));
  console.log('DevoxxFighter Asset Validation (Pack Format)');
  console.log('='.repeat(60));

  errors = [];

  // Load packs.json
  if (!fs.existsSync(PACKS_JSON)) {
    console.log(`✗ ${PACKS_JSON} not found`);
    process.exit(1);
  }

  const packsIndex: PackIndex = JSON.parse(fs.readFileSync(PACKS_JSON, 'utf-8'));
  console.log(`\nFound ${packsIndex.packs.length} packs in packs.json`);

  // Validate each pack
  console.log('\n--- Fighter Packs ---');

  for (const packId of packsIndex.packs) {
    const packDir = path.join(PACKS_DIR, packId);
    if (!fs.existsSync(packDir)) {
      logError(packId, `Pack folder not found: ${packDir}`);
      continue;
    }
    validatePack(packId);
  }

  // Check for orphaned packs (folders not in packs.json)
  if (fs.existsSync(PACKS_DIR)) {
    const packFolders = fs.readdirSync(PACKS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const folder of packFolders) {
      if (!packsIndex.packs.includes(folder)) {
        logWarning(folder, `Pack folder exists but not listed in packs.json`);
      }
    }
  }

  // Validate backgrounds
  console.log('\n--- Backgrounds ---');

  for (const [id, background] of Object.entries(BACKGROUND_REGISTRY)) {
    validateBackground(id, background);
  }

  // Summary
  console.log('\n' + '='.repeat(60));

  const errorCount = errors.filter((e) => e.type === 'error').length;
  const warningCount = errors.filter((e) => e.type === 'warning').length;

  if (errorCount === 0) {
    console.log('✓ All assets valid!');
    if (warningCount > 0) {
      console.log(`  (${warningCount} warnings)`);
    }
    process.exit(0);
  } else {
    console.log(`✗ Asset validation failed!`);
    console.log(`  ${errorCount} errors, ${warningCount} warnings`);
    process.exit(1);
  }
}

main();
