/**
 * @fileoverview Convert legacy sprite strips in sprites/ to the pack format in public/packs/.
 *
 * Usage: npx tsx tools/convert-sprites-to-packs.ts
 *
 * Reads fighters.json (root) for character metadata, splits sprite strips into
 * individual frames, generates manifest.json + per-action animation.json / metadata.json,
 * and extracts profile pictures from existing idle/attack frames.
 */

import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

// =============================================================================
// Types (mirroring PackTypes.ts for the output JSONs)
// =============================================================================

interface FighterEntry {
  id: string;
  displayName: string;
  tagline: string;
  bio: string;
  motivation: string;
  basePath: string;
  frameWidth: number;
  frameHeight: number;
  actions: Record<string, string>;
}

interface FightersJson {
  fighters: FighterEntry[];
}

interface FrameData {
  index: number;
  delay: number;
  hitboxes: never[];
}

interface AnimationJson {
  name: string;
  frameCount: number;
  loop: 'loop' | 'once';
  frames: FrameData[];
}

interface MetadataFrame {
  filename: string;
  frame: { x: number; y: number; width: number; height: number };
  duration: number;
}

interface MetadataJson {
  frames: MetadataFrame[];
  meta: {
    image: string;
    size: { w: number; h: number };
    format: string;
    scale: number;
  };
}

interface ManifestAnimation {
  name: string;
  folder: string;
  frameCount: number;
  loop: 'loop' | 'once';
  totalDuration: number;
  frames: FrameData[];
  spriteSheet: string;
  gif: string;
}

interface ManifestProfilePic {
  type: string;
  filename: string;
}

interface Manifest {
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
  animations: ManifestAnimation[];
  profilePics: ManifestProfilePic[];
  exportedAt: string;
}

// =============================================================================
// Constants
// =============================================================================

const ROOT = path.resolve(import.meta.dirname, '..');
const FIGHTERS_JSON = path.join(ROOT, 'fighters.json');
const OUTPUT_DIR = path.join(ROOT, 'public', 'packs');

/**
 * Reverse of PACK_ACTION_MAP: game actionKey → pack folder name.
 * attack1→punch, attack2→kick, dead→ko
 */
const ACTION_TO_FOLDER: Record<string, string> = {
  attack1: 'punch',
  attack2: 'kick',
  dead: 'ko',
};

/**
 * Standard actions that every pack should have, with their fallbacks.
 * Key = pack folder name, value = { delay, loop, fallbackSource }
 */
const STANDARD_ACTIONS: Record<
  string,
  { delay: number; loop: 'loop' | 'once'; displayName: string }
> = {
  punch: { delay: 60, loop: 'loop', displayName: 'Punch' },
  kick: { delay: 70, loop: 'loop', displayName: 'Kick' },
  hurt: { delay: 80, loop: 'once', displayName: 'Hurt' },
  ko: { delay: 100, loop: 'once', displayName: 'KO' },
  idle: { delay: 150, loop: 'loop', displayName: 'Idle' },
  walk: { delay: 100, loop: 'loop', displayName: 'Walk' },
  jump: { delay: 100, loop: 'once', displayName: 'Jump' },
  run: { delay: 80, loop: 'loop', displayName: 'Run' },
  crouch: { delay: 80, loop: 'once', displayName: 'Crouch' },
  special: { delay: 80, loop: 'once', displayName: 'Special' },
  block: { delay: 60, loop: 'once', displayName: 'Block' },
  win: { delay: 100, loop: 'once', displayName: 'Win' },
  intro: { delay: 100, loop: 'once', displayName: 'Intro' },
};

/**
 * Map from legacy action keys that should be mapped to known pack folders
 * (beyond the standard ones that map 1:1 or via ACTION_TO_FOLDER).
 */
const SPECIAL_LEGACY_KEYS: Record<string, string> = {
  protection: 'block',
  protect: 'block',
};

// =============================================================================
// Helpers
// =============================================================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Map a legacy fighters.json action key to a pack folder name.
 * Returns the folder name, or null if it's a standard game action that maps 1:1.
 */
function legacyKeyToFolder(key: string): string {
  // Direct mappings from PACK_ACTION_MAP (reverse)
  if (key in ACTION_TO_FOLDER) return ACTION_TO_FOLDER[key]!;
  // Special legacy keys
  if (key in SPECIAL_LEGACY_KEYS) return SPECIAL_LEGACY_KEYS[key]!;
  // If the key is a standard action, use it as-is
  if (key in STANDARD_ACTIONS) return key;
  // Otherwise it's a character-specific action — use the key as folder name
  return key;
}

async function getFrameCount(
  spritePath: string,
  frameWidth: number
): Promise<number> {
  const metadata = await sharp(spritePath).metadata();
  if (!metadata.width) throw new Error(`Cannot read width: ${spritePath}`);
  return Math.floor(metadata.width / frameWidth);
}

async function extractFrames(
  spritePath: string,
  frameWidth: number,
  frameHeight: number,
  outDir: string
): Promise<number> {
  const frameCount = await getFrameCount(spritePath, frameWidth);
  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < frameCount; i++) {
    const framePath = path.join(
      outDir,
      `frame_${String(i).padStart(3, '0')}.png`
    );
    await sharp(spritePath)
      .extract({
        left: i * frameWidth,
        top: 0,
        width: frameWidth,
        height: frameHeight,
      })
      .toFile(framePath);
  }
  return frameCount;
}

function buildAnimationJson(
  displayName: string,
  frameCount: number,
  delay: number,
  loop: 'loop' | 'once'
): AnimationJson {
  return {
    name: displayName,
    frameCount,
    loop,
    frames: Array.from({ length: frameCount }, (_, i) => ({
      index: i,
      delay,
      hitboxes: [],
    })),
  };
}

function buildMetadataJson(
  frameCount: number,
  frameWidth: number,
  frameHeight: number,
  delay: number
): MetadataJson {
  return {
    frames: Array.from({ length: frameCount }, (_, i) => ({
      filename: `frame_${String(i).padStart(3, '0')}.png`,
      frame: {
        x: i * frameWidth,
        y: 0,
        width: frameWidth,
        height: frameHeight,
      },
      duration: delay,
    })),
    meta: {
      image: 'spritesheet.png',
      size: { w: frameCount * frameWidth, h: frameHeight },
      format: 'RGBA8888',
      scale: 1,
    },
  };
}

// =============================================================================
// Main conversion
// =============================================================================

async function processAction(
  spritePath: string,
  actionFolder: string,
  packDir: string,
  frameWidth: number,
  frameHeight: number,
  delay: number,
  loop: 'loop' | 'once',
  displayName: string
): Promise<ManifestAnimation> {
  const actionDir = path.join(packDir, actionFolder);
  fs.mkdirSync(actionDir, { recursive: true });

  // Copy spritesheet
  const sheetDest = path.join(actionDir, 'spritesheet.png');
  fs.copyFileSync(spritePath, sheetDest);

  // Extract frames
  const framesDir = path.join(actionDir, 'frames');
  const frameCount = await extractFrames(
    spritePath,
    frameWidth,
    frameHeight,
    framesDir
  );

  // Write animation.json
  const animJson = buildAnimationJson(displayName, frameCount, delay, loop);
  fs.writeFileSync(
    path.join(actionDir, 'animation.json'),
    JSON.stringify(animJson, null, 2)
  );

  // Write metadata.json
  const metaJson = buildMetadataJson(frameCount, frameWidth, frameHeight, delay);
  fs.writeFileSync(
    path.join(actionDir, 'metadata.json'),
    JSON.stringify(metaJson, null, 2)
  );

  const totalDuration = frameCount * delay;

  return {
    name: displayName,
    folder: actionFolder,
    frameCount,
    loop,
    totalDuration,
    frames: animJson.frames,
    spriteSheet: `${actionFolder}/spritesheet.png`,
    gif: `${actionFolder}/preview.gif`,
  };
}

async function extractProfilePics(
  fighter: FighterEntry,
  packDir: string
): Promise<ManifestProfilePic[]> {
  const profileDir = path.join(packDir, 'profile-pics');
  fs.mkdirSync(profileDir, { recursive: true });

  const { frameWidth, frameHeight, actions, basePath } = fighter;
  const spritesBase = path.join(ROOT, basePath);
  const pics: ManifestProfilePic[] = [];

  // Helper to extract frame 0 (or specified) from a sprite strip
  async function extractFrame(
    actionFile: string,
    outName: string,
    frameIndex: number = 0
  ): Promise<boolean> {
    const srcPath = path.join(spritesBase, actionFile);
    if (!fs.existsSync(srcPath)) return false;
    const outPath = path.join(profileDir, outName);
    await sharp(srcPath)
      .extract({
        left: frameIndex * frameWidth,
        top: 0,
        width: frameWidth,
        height: frameHeight,
      })
      .toFile(outPath);
    return true;
  }

  // head-closeup: idle frame 0
  if (actions.idle) {
    const ok = await extractFrame(actions.idle, 'head-closeup.png', 0);
    if (ok) pics.push({ type: 'head-closeup', filename: 'profile-pics/head-closeup.png' });
  }

  // fighting-pose: attack1 frame 0
  if (actions.attack1) {
    const ok = await extractFrame(actions.attack1, 'fighting-pose.png', 0);
    if (ok) pics.push({ type: 'fighting-pose', filename: 'profile-pics/fighting-pose.png' });
  }

  // fighting-pose-alt: attack2 frame 0
  if (actions.attack2) {
    const ok = await extractFrame(actions.attack2, 'fighting-pose-alt.png', 0);
    if (ok) pics.push({ type: 'fighting-pose-alt', filename: 'profile-pics/fighting-pose-alt.png' });
  }

  // head-closeup-alt: idle2 frame 0 or idle frame 1
  if (actions.idle2) {
    const ok = await extractFrame(actions.idle2, 'head-closeup-alt.png', 0);
    if (ok) pics.push({ type: 'head-closeup-alt', filename: 'profile-pics/head-closeup-alt.png' });
  } else if (actions.idle) {
    // Check if idle has enough frames
    const idlePath = path.join(spritesBase, actions.idle);
    const count = await getFrameCount(idlePath, frameWidth);
    if (count > 1) {
      const ok = await extractFrame(actions.idle, 'head-closeup-alt.png', 1);
      if (ok) pics.push({ type: 'head-closeup-alt', filename: 'profile-pics/head-closeup-alt.png' });
    }
  }

  return pics;
}

async function convertFighter(fighter: FighterEntry): Promise<void> {
  const { id, displayName, tagline, bio, motivation, basePath, frameWidth, frameHeight, actions } = fighter;
  const spritesBase = path.join(ROOT, basePath);
  const packDir = path.join(OUTPUT_DIR, id);

  // eslint-disable-next-line no-console
  console.log(`\n=== Converting: ${displayName} (${id}) ===`);
  // eslint-disable-next-line no-console
  console.log(`  Source: ${spritesBase}`);
  // eslint-disable-next-line no-console
  console.log(`  Output: ${packDir}`);

  // Clean output dir if exists
  if (fs.existsSync(packDir)) {
    fs.rmSync(packDir, { recursive: true });
  }
  fs.mkdirSync(packDir, { recursive: true });

  // ===== Step 1: Classify all action keys =====

  // Map action keys to pack folders, tracking which standard actions are covered
  const coveredFolders = new Map<string, string>(); // folder → source sprite path
  const extraActions: Array<{ key: string; file: string; folder: string }> = [];

  for (const [key, file] of Object.entries(actions)) {
    const folder = legacyKeyToFolder(key);
    const srcPath = path.join(spritesBase, file);

    if (!fs.existsSync(srcPath)) {
      // eslint-disable-next-line no-console
      console.warn(`  WARNING: Missing sprite file: ${srcPath}`);
      continue;
    }

    if (folder in STANDARD_ACTIONS) {
      // Standard action — first one wins (e.g., if both attack3 and special map to special)
      if (!coveredFolders.has(folder)) {
        coveredFolders.set(folder, srcPath);
      }
    } else {
      // Character-specific action
      extraActions.push({ key, file, folder });
    }
  }

  // ===== Step 2: Handle special assignment =====
  // Priority: explicit 'special' key > 'attack3' > first character-specific sprite
  if (!coveredFolders.has('special')) {
    // Check for attack3 mapped to special
    if (actions.attack3) {
      const srcPath = path.join(spritesBase, actions.attack3);
      if (fs.existsSync(srcPath)) {
        coveredFolders.set('special', srcPath);
      }
    }
    // Still no special? Use first extra action
    if (!coveredFolders.has('special') && extraActions.length > 0) {
      const first = extraActions.shift()!;
      const srcPath = path.join(spritesBase, first.file);
      coveredFolders.set('special', srcPath);
      // eslint-disable-next-line no-console
      console.log(`  Mapped ${first.key} → special/`);
    }
  } else {
    // Remove attack3 from extras if special is already covered and attack3 is in extras
    const a3idx = extraActions.findIndex((e) => e.key === 'attack3');
    if (a3idx !== -1) {
      // attack3 stays as extra
    }
  }

  // ===== Step 3: Handle missing standard actions via reuse =====
  const reuseFallbacks: Array<{
    missing: string;
    sources: string[];
  }> = [
    { missing: 'crouch', sources: ['hurt'] },
    { missing: 'block', sources: ['idle'] },
    { missing: 'win', sources: ['idle'] },
    { missing: 'intro', sources: ['idle'] },
    { missing: 'jump', sources: ['idle'] },
    { missing: 'special', sources: ['idle'] },
  ];

  // Use idle2 for win/intro if available
  if (actions.idle2) {
    const idle2Path = path.join(spritesBase, actions.idle2);
    if (fs.existsSync(idle2Path)) {
      if (!coveredFolders.has('win')) {
        coveredFolders.set('win', idle2Path);
        // eslint-disable-next-line no-console
        console.log(`  Reused idle2 → win/`);
      }
      if (!coveredFolders.has('intro')) {
        coveredFolders.set('intro', idle2Path);
        // eslint-disable-next-line no-console
        console.log(`  Reused idle2 → intro/`);
      }
    }
  }

  for (const { missing, sources } of reuseFallbacks) {
    if (coveredFolders.has(missing)) continue;
    for (const src of sources) {
      if (coveredFolders.has(src)) {
        coveredFolders.set(missing, coveredFolders.get(src)!);
        // eslint-disable-next-line no-console
        console.log(`  Reused ${src} → ${missing}/`);
        break;
      }
    }
  }

  // ===== Step 4: Process all standard actions =====
  const manifestAnimations: ManifestAnimation[] = [];

  for (const [folder, props] of Object.entries(STANDARD_ACTIONS)) {
    const srcPath = coveredFolders.get(folder);
    if (!srcPath) {
      // eslint-disable-next-line no-console
      console.warn(`  SKIP: No source for ${folder}/`);
      continue;
    }

    const anim = await processAction(
      srcPath,
      folder,
      packDir,
      frameWidth,
      frameHeight,
      props.delay,
      props.loop,
      props.displayName
    );
    manifestAnimations.push(anim);

    // Hurt gets a duplicate entry with loop mode (matching ninja_jan pattern)
    if (folder === 'hurt') {
      manifestAnimations.push({ ...anim, loop: 'loop' });
    }
  }

  // ===== Step 5: Process extra character-specific actions =====
  for (const extra of extraActions) {
    const srcPath = path.join(spritesBase, extra.file);
    if (!fs.existsSync(srcPath)) continue;

    const anim = await processAction(
      srcPath,
      extra.folder,
      packDir,
      frameWidth,
      frameHeight,
      80,
      'once',
      capitalize(extra.key.replace(/_/g, ' '))
    );
    manifestAnimations.push(anim);
    // eslint-disable-next-line no-console
    console.log(`  Extra action: ${extra.key} → ${extra.folder}/`);
  }

  // ===== Step 6: Profile pictures =====
  const profilePics = await extractProfilePics(fighter, packDir);

  // ===== Step 7: Build and write manifest.json =====
  const manifest: Manifest = {
    name: displayName.toLowerCase(),
    version: '1.0.0',
    character: { id, displayName, tagline, bio, motivation },
    spriteSize: { width: frameWidth, height: frameHeight },
    animationCount: manifestAnimations.length,
    profilePicCount: profilePics.length,
    animations: manifestAnimations,
    profilePics,
    exportedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(packDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // eslint-disable-next-line no-console
  console.log(
    `  Done: ${manifestAnimations.length} animations, ${profilePics.length} profile pics`
  );
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('=== Sprite-to-Pack Converter ===');
  // eslint-disable-next-line no-console
  console.log(`Root: ${ROOT}`);

  // Load fighters.json
  const raw = fs.readFileSync(FIGHTERS_JSON, 'utf-8');
  const data: FightersJson = JSON.parse(raw);
  // eslint-disable-next-line no-console
  console.log(`Found ${data.fighters.length} fighters to convert`);

  for (const fighter of data.fighters) {
    await convertFighter(fighter);
  }

  // eslint-disable-next-line no-console
  console.log('\n=== All conversions complete! ===');

  // Update packs.json
  const packsJsonPath = path.join(ROOT, 'public', 'data', 'packs.json');
  const existingPacks: { packs: string[] } = JSON.parse(
    fs.readFileSync(packsJsonPath, 'utf-8')
  );
  const allIds = new Set(existingPacks.packs);
  for (const fighter of data.fighters) {
    allIds.add(fighter.id);
  }
  const updatedPacks = { packs: [...allIds].sort() };
  fs.writeFileSync(packsJsonPath, JSON.stringify(updatedPacks, null, 2) + '\n');
  // eslint-disable-next-line no-console
  console.log(`Updated packs.json: ${updatedPacks.packs.length} packs`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Conversion failed:', err);
  process.exit(1);
});
