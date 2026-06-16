import { ActionDecision, ActionType, AIDifficulty, AIProfile } from '../types';
import {
  AI_DECISION_INTERVAL_EASY,
  AI_DECISION_INTERVAL_MEDIUM,
  AI_DECISION_INTERVAL_HARD,
  AI_MISTAKE_CHANCE_EASY,
  AI_MISTAKE_CHANCE_MEDIUM,
  AI_MISTAKE_CHANCE_HARD,
  METER_MAX,
} from '../constants';

export interface AIGameState {
  distanceToOpponent: number;
  ownHealth: number;
  opponentHealth: number;
  ownMeter: number;
  opponentState: string;
  opponentRecoveryFrames: number;
  isOpponentJumping: boolean;
  ownX: number;
  opponentX: number;
}

export class AIController {
  difficulty: AIDifficulty;
  private profile: AIProfile;
  private decisionTimer = 0;
  private decisionInterval: number;
  private mistakeChance: number;
  private pendingAction: ActionType = 'IDLE';
  private lastOpponentState = '';
  private lastOpponentStateTimer = 0;

  constructor(difficulty: AIDifficulty, profile: AIProfile) {
    this.difficulty = difficulty;
    this.profile = profile;

    switch (difficulty) {
      case 'easy':
        this.decisionInterval = AI_DECISION_INTERVAL_EASY;
        this.mistakeChance = AI_MISTAKE_CHANCE_EASY;
        break;
      case 'medium':
        this.decisionInterval = AI_DECISION_INTERVAL_MEDIUM;
        this.mistakeChance = AI_MISTAKE_CHANCE_MEDIUM;
        break;
      case 'hard':
        this.decisionInterval = AI_DECISION_INTERVAL_HARD;
        this.mistakeChance = AI_MISTAKE_CHANCE_HARD;
        break;
    }
  }

  evaluate(gameState: AIGameState): ActionDecision {
    if (gameState.opponentState !== this.lastOpponentState) {
      this.lastOpponentState = gameState.opponentState;
      this.lastOpponentStateTimer = 0;
    } else {
      this.lastOpponentStateTimer++;
    }

    this.decisionTimer++;
    if (this.decisionTimer >= this.decisionInterval) {
      this.decisionTimer = 0;
      this.pendingAction = this.pickAction(gameState);
    }

    return { action: this.pendingAction, priority: 1 };
  }

  private pickAction(gs: AIGameState): ActionType {
    if (Math.random() < this.mistakeChance) {
      return Math.random() < 0.5 ? 'IDLE' : 'WALK_FORWARD';
    }

    const isTrailing = gs.ownHealth < gs.opponentHealth * 0.3;
    const aggressionMultiplier = isTrailing ? 1.5 : 1.0;
    const effectiveAggression = Math.min(1, this.profile.aggressionBase * aggressionMultiplier);

    if (gs.ownMeter >= METER_MAX && this.difficulty !== 'easy') {
      return 'USE_FINALE';
    }

    if (gs.isOpponentJumping && this.profile.antiAirTendency > Math.random()) {
      if (gs.distanceToOpponent < 200) {
        return 'ATTACK_HEAVY';
      }
      return this.pickSpecial(this.profile.specialUsageWeights);
    }

    const recoveryPunishChance = this.difficulty === 'hard' ? 0.9 : 0.6;
    if (gs.opponentRecoveryFrames > 0 && this.difficulty !== 'easy' && Math.random() < recoveryPunishChance) {
      if (gs.distanceToOpponent < 120) {
        return Math.random() < 0.5 ? 'ATTACK_HEAVY' : 'ATTACK_LIGHT';
      }
      if (gs.distanceToOpponent < 300) {
        return this.pickSpecial(this.profile.specialUsageWeights);
      }
    }

    const roll = Math.random();

    if (gs.distanceToOpponent > 400) {
      if (this.profile.preferredRange === 'far') {
        if (roll < this.profile.aggressionBase) {
          return this.pickSpecial(this.profile.specialUsageWeights);
        }
        return 'WALK_FORWARD';
      }
      if (Math.random() < effectiveAggression) {
        return 'WALK_FORWARD';
      }
      return 'IDLE';
    }

    if (gs.distanceToOpponent < 150) {
      const actionRoll = Math.random();
      if (actionRoll < 0.35 * effectiveAggression) return 'ATTACK_LIGHT';
      if (actionRoll < 0.55 * effectiveAggression) return 'ATTACK_HEAVY';
      if (actionRoll < 0.70 * effectiveAggression) return this.pickSpecial(this.profile.specialUsageWeights);
      if (actionRoll < 0.80) return 'BLOCK';
      if (actionRoll < 0.90) return 'WALK_BACK';
      return 'IDLE';
    }

    // Mid range: 150-400
    const midRoll = Math.random();
    if (midRoll < 0.3 * effectiveAggression) {
      return this.pickSpecial(this.profile.specialUsageWeights);
    }
    if (midRoll < 0.5 * effectiveAggression) {
      return gs.opponentX > gs.ownX ? 'WALK_FORWARD' : 'WALK_BACK';
    }
    if (midRoll < 0.65 * effectiveAggression) return 'ATTACK_LIGHT';
    if (midRoll < 0.75 * effectiveAggression) return 'ATTACK_HEAVY';
    if (midRoll < 0.82) return 'BLOCK';
    return 'IDLE';
  }

  private pickSpecial(weights: [number, number, number]): ActionType {
    const roll = Math.random();
    const cumulative = [
      weights[0],
      weights[0] + weights[1],
      weights[0] + weights[1] + weights[2],
    ];
    if (roll < cumulative[0]) return 'USE_SPECIAL_1';
    if (roll < cumulative[1]) return 'USE_SPECIAL_2';
    return 'USE_SPECIAL_3';
  }
}
