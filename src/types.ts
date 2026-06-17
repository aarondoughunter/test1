export type CharacterState =
  'IDLE' | 'WALK_FORWARD' | 'WALK_BACK' | 'CROUCH' |
  'JUMP' | 'JUMP_FORWARD' | 'JUMP_BACK' |
  'ATTACK_LIGHT' | 'ATTACK_HEAVY' |
  'ATTACK_SPECIAL_1' | 'ATTACK_SPECIAL_2' | 'ATTACK_SPECIAL_3' |
  'BLOCK' | 'BLOCK_CROUCH' | 'HIT_STUN' | 'BLOCK_STUN' |
  'KNOCKDOWN' | 'RISING' | 'PARRY' | 'PINNED' | 'GRABBED' | 'GRABBING' |
  'FINALE_CHARGE' | 'FINALE_ACTIVE' | 'VICTORY' | 'DEFEATED' | 'INTRO';

export interface HitboxRect { x: number; y: number; w: number; h: number; }

export interface HitboxFrame {
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  hitbox: HitboxRect;
  hurtbox: HitboxRect;
  damage: number;
  hitstun: number;
  blockstun: number;
  knockback: number;
  launchHeight: number;
  type?: 'high' | 'low' | 'overhead';
}

export interface MoveDefinition {
  id: string;
  name: string;
  motion: string[];
  hitboxFrames: HitboxFrame[];
  soundKey?: string;
  isCommandGrab?: boolean;
  isParry?: boolean;
  blockable?: boolean;
  projectile?: boolean;
  cinematicKey?: string;
  cinematicDuration?: number;
  superFreeze?: boolean;
  isFinale?: boolean;
}

export interface CharacterStats {
  id: string;
  displayName: string;
  maxHealth: number;
  walkSpeed: number;
  weight: number;
  color: string;
  introLine: string;
  voiceLines: string[];
  victoryLine: string;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type ActionType =
  'WALK_FORWARD' | 'WALK_BACK' | 'CROUCH' | 'JUMP' | 'JUMP_FORWARD' | 'JUMP_BACK' |
  'ATTACK_LIGHT' | 'ATTACK_HEAVY' |
  'USE_SPECIAL_1' | 'USE_SPECIAL_2' | 'USE_SPECIAL_3' |
  'BLOCK' | 'USE_FINALE' | 'IDLE';

export interface ActionDecision { action: ActionType; priority: number; }

export interface RawInput {
  up: boolean; down: boolean; left: boolean; right: boolean;
  light: boolean; heavy: boolean; special: boolean; meter: boolean;
  frame: number;
}

export interface AIProfile {
  characterId: string;
  preferredRange: 'close' | 'mid' | 'far';
  aggressionBase: number;
  specialUsageWeights: [number, number, number];
  antiAirTendency: number;
  trapLayingFrequency: number;
}

export interface StageData {
  id: string;
  name: string;
  musicKey: string;
  skyColor: number;
  groundColor: number;
  accentColor: number;
  backgroundKey?: string;
  characterId?: string;
}

export interface ProjectileData {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  hitstun: number;
  knockback: number;
  radius: number;
  color: number;
  lifetime: number;
  hitRegistered: boolean;
}

export interface TrapData {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  damage: number;
  hitstun: number;
  triggerRadius: number;
  delayFrames: number;
  armed: boolean;
  armingTimer: number;
  triggered: boolean;
  triggerTimer: number;
}

export interface RoundResult {
  winner: 'player' | 'ai' | 'draw';
  roundNumber: number;
}
