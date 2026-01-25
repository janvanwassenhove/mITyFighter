/**
 * @fileoverview Fighter registry with typed definitions
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/ASSETS.md - Fighter asset conventions
 * @see docs/EXTENSIBILITY.md - How to add new fighters
 */

import type { ActionId } from './AssetKeys';

// =============================================================================
// Types
// =============================================================================

/**
 * Fighter registry entry type.
 */
export interface FighterRegistryEntry {
  /** Unique identifier (matches registry key) */
  readonly id: string;
  /** Display name for UI */
  readonly displayName: string;
  /** Character tagline */
  readonly tagline: string;
  /** Character bio/story */
  readonly bio: string;
  /** Character motivation */
  readonly motivation: string;
  /** Base path relative to assets folder */
  readonly basePath: string;
  /** Frame width in pixels (default 128) */
  readonly frameWidth: number;
  /** Frame height in pixels (default 128) */
  readonly frameHeight: number;
  /** Action to filename mapping */
  readonly actions: Partial<Record<ActionId, string>>;
}

// =============================================================================
// Registry
// =============================================================================

/**
 * Fighter registry.
 * Add new fighters here following EXTENSIBILITY.md guidelines.
 */
export const FIGHTER_REGISTRY = {
  bartholomew_blaze: {
    id: 'bartholomew_blaze',
    displayName: 'Bartholomew Blaze',
    tagline: "It's not arson if I announce it loudly beforehand.",
    bio: "Bartholomew is a wizard of flame, smoke, and deeply irresponsible enthusiasm. He once tried to toast bread using a meteor spell and accidentally invented a new desert. He is banned from libraries, haystacks, and most weddings.",
    motivation: 'To win the tournament and prove he\'s a "serious mage"… not just a walking bonfire with confidence issues.',
    basePath: 'sprites/bartholomew_blaze',
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
  sir_sparksalot: {
    id: 'sir_sparksalot',
    displayName: 'Sir Sparksalot',
    tagline: "I don't do small talk. I do large lightning.",
    bio: "Sir Sparksalot was struck by lightning as a child and responded by suing the weather. He now channels thunder like a professional, complete with dramatic hair and zero patience. He cannot enter a room quietly. Ever.",
    motivation: 'To claim the trophy and finally be promoted from "dangerous inconvenience" to "national treasure".',
    basePath: 'sprites/sir_sparksalot',
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
  serpentina_hissington: {
    id: 'serpentina_hissington',
    displayName: 'Lady Serpentina',
    tagline: "Smile politely. I can still petrify you.",
    bio: "Serpentina is an aristocrat with impeccable posture and a hair situation that legally counts as wildlife. She speaks five languages, none of them friendly. Her hobbies include etiquette, fencing, and turning rude people into tasteful garden décor.",
    motivation: "To win the trophy and use it as a centerpiece at tea parties where guests mysteriously stop moving.",
    basePath: 'sprites/serpentina_hissington',
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
  cassandra_coil: {
    id: 'cassandra_coil',
    displayName: 'Cassandra Coil',
    tagline: "I'm not toxic — I'm motivationally venomous.",
    bio: 'Cassandra is fast, chaotic, and emotionally supported by her extremely aggressive snake-hair. She once started a duel because someone sighed "too loudly in her direction." She treats combat like a dance — if the dance involved kicking someone into a wall.',
    motivation: "To win, become famous, and get a sponsor deal from a perfume brand called Eau de Panic.",
    basePath: 'sprites/cassandra_coil',
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
  meg_grimspire: {
    id: 'meg_grimspire',
    displayName: 'Meg Grimspire',
    tagline: "I was calm… until you existed near me.",
    bio: 'Meg is the legendary "quiet one" — and that\'s the most terrifying kind. She doesn\'t raise her voice. She raises eyebrows. Every statue in her garden used to be a critic.',
    motivation: 'To win the tournament because she heard someone say: "Medusas are overrated." No one remembers who said it. Which proves her point.',
    basePath: 'sprites/meg_grimspire',
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
  sir_budgetalot: {
    id: 'sir_budgetalot',
    displayName: 'Sir Budgetalot',
    tagline: "I fight for honour… and half a sandwich.",
    bio: 'Once a respected knight. Then came budget cuts, bad politics, and a tragic misunderstanding involving a goat. He now roams the lands wearing "armour" made from heroic intentions and whatever fits. He is polite, brave, and deeply allergic to comfort.',
    motivation: "To win prize money, buy a horse, and prove that dignity can survive anything… except rent.",
    basePath: 'sprites/sir_budgetalot',
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
  count_cardboardius: {
    id: 'count_cardboardius',
    displayName: 'Count Cardboardius III',
    tagline: "My castle is recyclable. My vengeance is not.",
    bio: 'A former noble who invested everything in "DragonCoin" and lost it overnight. Now he lives inside a structurally ambitious pile of boxes. He speaks like a king, fights like a wrecking ball, and smells faintly of soup.',
    motivation: 'To reclaim his "noble status" and obtain a chair that doesn\'t collapse emotionally.',
    basePath: 'sprites/count_cardboardius',
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
  dave_unreasonably_athletic: {
    id: 'dave_unreasonably_athletic',
    displayName: 'Dave the Athletic',
    tagline: "I don't know why I'm here. But I'm winning anyway.",
    bio: "Dave appeared one day holding a stick, an apple, and an oddly confident grin. No one knows his origin. Not even Dave. His fighting style is pure instinct mixed with accidental brilliance and mild confusion.",
    motivation: "To win the trophy because it looks shiny and he has decided it's his destiny now.",
    basePath: 'sprites/dave_unreasonably_athletic',
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
  captain_beaky: {
    id: 'captain_beaky',
    displayName: 'Captain Beaky',
    tagline: "CAW. That means 'prepare for violence'.",
    bio: "A crow demon with military discipline and the manners of a flying tax auditor. He steals shiny objects, secrets, and occasionally someone's identity for fun. He salutes before attacking, which somehow makes it ruder.",
    motivation: "To win the trophy and mount it in his nest, alongside 14 stolen wedding rings and a traffic cone.",
    basePath: 'sprites/captain_beaky',
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
  lady_emberwhisk: {
    id: 'lady_emberwhisk',
    displayName: 'Lady Emberwhisk',
    tagline: "I can't lie… I just choose creative truth.",
    bio: "Emberwhisk is a mystical fox spirit who speaks in riddles, sarcasm, and weaponised charm. She can appear as a sweet innocent traveller… and then turn your spine into an opinion. She's always smiling. That's the warning.",
    motivation: "To win the tournament as part of a grand plan involving fame, chaos, and stealing the trophy purely for aesthetic reasons.",
    basePath: 'sprites/lady_emberwhisk',
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
  lady_pointy_stabby: {
    id: 'lady_pointy_stabby',
    displayName: 'Lady Pointy-Stabby',
    tagline: "Silent like a shadow. Loud like your ribs.",
    bio: "Trained by the Invisible Clan of Unpaid Interns, she mastered stealth through sheer bitterness. Her footsteps are silent. Her attacks are not. She once completed a mission so quietly that even she forgot she did it.",
    motivation: "To win and force the Council to finally respect her… and provide dental insurance.",
    basePath: 'sprites/lady_pointy_stabby',
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
    },
  },
  brother_silent: {
    id: 'brother_silent',
    displayName: 'Brother Silent',
    tagline: "Inner peace. Outer chaos.",
    bio: 'A monk who found enlightenment through breathing exercises and extremely efficient violence. He meditates daily, eats rice, and punches through walls to "clear the mind". He whispers apologies while breaking your kneecaps.',
    motivation: "To win the trophy and use it as a sacred soup bowl for the Monastery of Calm Overreaction.",
    basePath: 'sprites/brother_silent',
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
    },
  },
  furious_farmer: {
    id: 'furious_farmer',
    displayName: 'The Furious Farmer',
    tagline: "I planted carrots. Now I plant fear.",
    bio: "A humble farmer until a local warlord trampled his crops. He snapped, trained for exactly one week, and became terrifying through pure rage. His hands are calloused. His patience is dead.",
    motivation: "To win, overthrow the corrupt system, and finally afford a fence that works.",
    basePath: 'sprites/furious_farmer',
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
      disguise: 'Disguise.png',
      shot: 'Shot.png',
    },
  },
  sir_chopington: {
    id: 'sir_chopington',
    displayName: 'Sir Chopington',
    tagline: "I bow politely… then delete your existence.",
    bio: 'A traditional warrior who lives by honour, tea rituals, and catastrophic precision. He has never missed a strike, unless you count the time he cut a mountain "by mistake". He\'s extremely respectful — right up until impact.',
    motivation: "To win the trophy and restore honour to combat… while being unnecessarily dramatic about it.",
    basePath: 'sprites/sir_chopington',
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
  arrow_lad: {
    id: 'arrow_lad',
    displayName: 'Arrow Lad',
    tagline: "I can miss you from ANY distance!",
    bio: "Arrow Lad is an archer of legendary confidence and questionable aim. He shoots dramatically, poses heroically, and occasionally hits a completely different target. His quiver contains arrows and several emotional breakdowns.",
    motivation: 'To win and finally be known as "Arrow MAN", not "that guy who hit the sign again".',
    basePath: 'sprites/arrow_lad',
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
    },
  },
  general_dramatic_pause: {
    id: 'general_dramatic_pause',
    displayName: 'General Dramatic Pause',
    tagline: "…Prepare… for… inconvenience.",
    bio: "A battlefield commander who speaks exclusively in suspense. He pauses mid-sentence so long that opponents sometimes age visibly. His strategies are brilliant, mostly because nobody can tell when he's finished talking.",
    motivation: "To win and become Supreme Commander of Something Important™ (details pending approval).",
    basePath: 'sprites/general_dramatic_pause',
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
  elder_honkstorm: {
    id: 'elder_honkstorm',
    displayName: 'Elder Honkstorm',
    tagline: "Honk. Meditate. Violence. Repeat.",
    bio: "A mountain tengu who trains in cold air and hotter judgement. He delivers ancient wisdom through yelling, honking, and occasionally headbutting reality. People travel far to hear him speak—mostly by accident.",
    motivation: 'To win and "restore balance"… meaning everyone else must leave the mountain immediately.',
    basePath: 'sprites/elder_honkstorm',
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
} as const satisfies Record<string, FighterRegistryEntry>;

// =============================================================================
// Type Exports
// =============================================================================

/** Fighter ID type derived from registry keys */
export type FighterId = keyof typeof FIGHTER_REGISTRY;

/** Array of all fighter IDs */
export const FIGHTER_IDS = Object.keys(FIGHTER_REGISTRY) as FighterId[];

/** Number of registered fighters */
export const FIGHTER_COUNT = FIGHTER_IDS.length;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get a fighter registry entry by ID.
 *
 * @param id - Fighter identifier
 * @returns Fighter registry entry
 */
export function getFighter(id: FighterId): FighterRegistryEntry {
  return FIGHTER_REGISTRY[id];
}

/**
 * Check if a fighter ID is valid.
 *
 * @param id - String to check
 * @returns True if valid fighter ID
 */
export function isValidFighterId(id: string): id is FighterId {
  return id in FIGHTER_REGISTRY;
}

/**
 * Get the next fighter ID in the list (wrapping).
 *
 * @param currentId - Current fighter ID
 * @param direction - 1 for next, -1 for previous
 * @returns Next fighter ID
 */
export function getNextFighterId(
  currentId: FighterId,
  direction: 1 | -1
): FighterId {
  const currentIndex = FIGHTER_IDS.indexOf(currentId);
  const nextIndex =
    (currentIndex + direction + FIGHTER_COUNT) % FIGHTER_COUNT;
  return FIGHTER_IDS[nextIndex] as FighterId;
}
