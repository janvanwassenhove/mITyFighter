/**
 * @fileoverview Asset validation CLI tool
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

const BACKGROUNDS_DIR = 'src/assets/backgrounds';

// =============================================================================
// Fighter Registry (duplicated from source for standalone execution)
// =============================================================================

interface FighterEntry {
  id: string;
  displayName: string;
  basePath: string;
  frameWidth: number;
  frameHeight: number;
  actions: Record<string, string>;
}

const FIGHTER_REGISTRY: Record<string, FighterEntry> = {
  fire_wizard: {
    id: 'fire_wizard',
    displayName: 'Fire Wizard',
    basePath: 'sprites/Fire Wizard',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
    },
  },
  gorgon_1: {
    id: 'gorgon_1',
    displayName: 'Gorgon 1',
    basePath: 'sprites/Gorgon_1',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
      special: 'Special.png',
    },
  },
  gorgon_2: {
    id: 'gorgon_2',
    displayName: 'Gorgon 2',
    basePath: 'sprites/Gorgon_2',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
      special: 'Special.png',
    },
  },
  gorgon_3: {
    id: 'gorgon_3',
    displayName: 'Gorgon 3',
    basePath: 'sprites/Gorgon_3',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
      special: 'Special.png',
    },
  },
  homeless_1: {
    id: 'homeless_1',
    displayName: 'Homeless 1',
    basePath: 'sprites/Homeless_1',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      special: 'Special.png',
    },
  },
  homeless_2: {
    id: 'homeless_2',
    displayName: 'Homeless 2',
    basePath: 'sprites/Homeless_2',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
    },
  },
  homeless_3: {
    id: 'homeless_3',
    displayName: 'Homeless 3',
    basePath: 'sprites/Homeless_3',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      special: 'Special.png',
    },
  },
  karasu_tengu: {
    id: 'karasu_tengu',
    displayName: 'Karasu Tengu',
    basePath: 'sprites/Karasu_tengu',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
    },
  },
  kitsune: {
    id: 'kitsune',
    displayName: 'Kitsune',
    basePath: 'sprites/Kitsune',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
    },
  },
  kunoichi: {
    id: 'kunoichi',
    displayName: 'Kunoichi',
    basePath: 'sprites/Kunoichi',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      cast: 'Cast.png',
      eating: 'Eating.png',
      // spine excluded - projectile sprite
    },
  },
  lightning_mage: {
    id: 'lightning_mage',
    displayName: 'Lightning Mage',
    basePath: 'sprites/Lightning Mage',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      lightball: 'Light_ball.png',
      lightcharge: 'Light_charge.png',
    },
  },
  ninja_monk: {
    id: 'ninja_monk',
    displayName: 'Ninja Monk',
    basePath: 'sprites/Ninja_Monk',
    frameWidth: 96,
    frameHeight: 96,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      blade: 'Blade.png',
      cast: 'Cast.png',
      // kunai excluded - projectile sprite
    },
  },
  ninja_peasant: {
    id: 'ninja_peasant',
    displayName: 'Ninja Peasant',
    basePath: 'sprites/Ninja_Peasant',
    frameWidth: 96,
    frameHeight: 96,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      // dart excluded - projectile sprite
      disguise: 'Disguise.png',
      shot: 'Shot.png',
    },
  },
  samurai: {
    id: 'samurai',
    displayName: 'Samurai',
    basePath: 'sprites/Samurai',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
      protection: 'Protection.png',
    },
  },
  samurai_archer: {
    id: 'samurai_archer',
    displayName: 'Samurai Archer',
    basePath: 'sprites/Samurai_Archer',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
      shot: 'Shot.png',
      // arrow excluded - projectile sprite
    },
  },
  samurai_commander: {
    id: 'samurai_commander',
    displayName: 'Samurai Commander',
    basePath: 'sprites/Samurai_Commander',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
      protect: 'Protect.png',
    },
  },
  wanderer_magician: {
    id: 'wanderer_magician',
    displayName: 'Wanderer Magician',
    basePath: 'sprites/Wanderer Magican',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      charge2: 'Charge_2.png',
      // charge1 excluded - width not multiple of frame size
      // magic_arrow excluded - projectile sprite
      // magic_sphere excluded - projectile sprite
    },
  },
  yamabushi_tengu: {
    id: 'yamabushi_tengu',
    displayName: 'Yamabushi Tengu',
    basePath: 'sprites/Yamabushi_tengu',
    frameWidth: 128,
    frameHeight: 128,
    actions: {
      idle: 'Idle.png',
      idle2: 'Idle_2.png',
      walk: 'Walk.png',
      run: 'Run.png',
      jump: 'Jump.png',
      hurt: 'Hurt.png',
      dead: 'Dead.png',
      attack1: 'Attack_1.png',
      attack2: 'Attack_2.png',
      attack3: 'Attack_3.png',
    },
  },
};

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
 * Validate a single fighter.
 */
function validateFighter(fighterId: string, fighter: FighterEntry): void {
  console.log(`\nFighter: ${fighter.displayName} (${fighterId})`);
  console.log(`  Frame size: ${fighter.frameWidth}x${fighter.frameHeight}`);

  // Check if folder exists
  const folderPath = fighter.basePath;
  if (!fs.existsSync(folderPath)) {
    logError(fighterId, `Folder not found: ${folderPath}`);
    return;
  }

  // Check each action
  for (const [actionId, filename] of Object.entries(fighter.actions)) {
    const filePath = path.join(folderPath, filename);

    if (!fs.existsSync(filePath)) {
      logError(fighterId, `${actionId}: ${filename} not found`);
      continue;
    }

    const dimensions = getPngDimensions(filePath);

    if (!dimensions) {
      logError(fighterId, `${actionId}: ${filename} - could not read dimensions`);
      continue;
    }

    const { width, height } = dimensions;

    // Validate height matches fighter's frame height
    if (height !== fighter.frameHeight) {
      logError(
        fighterId,
        `${actionId}: ${filename} - height ${height} != ${fighter.frameHeight}`
      );
      continue;
    }

    // Validate width is multiple of fighter's frame width
    if (width % fighter.frameWidth !== 0) {
      logError(
        fighterId,
        `${actionId}: ${filename} - width ${width} not multiple of ${fighter.frameWidth}`
      );
      continue;
    }

    const frameCount = width / fighter.frameWidth;
    logSuccess(`${actionId}: ${filename} (${width}x${height}, ${frameCount} frames)`);
  }
}

/**
 * Validate a single background.
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
  console.log('mITyFighter Asset Validation');
  console.log('='.repeat(60));

  errors = [];

  // Validate fighters
  console.log('\n--- Fighters ---');

  for (const [id, fighter] of Object.entries(FIGHTER_REGISTRY)) {
    validateFighter(id, fighter);
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
