import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition } from '../types'

export class Nicole extends BaseCharacter {
  readonly characterId = 'nicole'
  readonly displayName = 'Nicole'
  readonly maxHealth = 870
  readonly walkSpeed = 220
  readonly weight = 5
  readonly color = '#FFD700'

  private armorFrames = 0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
  }

  getIntroLine(): string {
    return "Violence is not the answer… usually."
  }

  getVoiceLines(): string[] {
    return [
      "I usually choose kindness.",
      "Protecting my peace.",
      "Namaste.",
      "That's going in my gratitude journal.",
    ]
  }

  takeDamage(amount: number, hitstun: number, knockbackX: number, isBlocked: boolean): void {
    if (!isBlocked && this.armorFrames > 0) {
      this.armorFrames = 0
      return
    }
    super.takeDamage(amount, hitstun, knockbackX, isBlocked)
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    if (this.armorFrames > 0) {
      this.armorFrames--
    }
  }

  getActiveHitboxFrame() {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null
    return { ...hf, damage: Math.floor(hf.damage * 0.9) }
  }

  onHitLanded(damage: number): void {
    this.health = Math.min(this.maxHealth, this.health + Math.floor(damage * 0.05))
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'nicole_positive_vibes',
      name: 'Positive Vibes Only',
      motion: ['DOWN', 'BACK', 'SPECIAL'],
      hitboxFrames: [{
        startupFrames: 8, activeFrames: 10, recoveryFrames: 20,
        hitbox: { x: 0, y: -160, w: 150, h: 160 },
        hurtbox: { x: -30, y: -160, w: 60, h: 160 },
        damage: 40, hitstun: 5, blockstun: 15, knockback: 300, launchHeight: 0, type: 'high',
      }],
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'nicole_shadow_work',
      name: 'Shadow Work',
      motion: ['BACK', 'BACK', 'SPECIAL'],
      hitboxFrames: [{
        startupFrames: 5, activeFrames: 5, recoveryFrames: 10,
        hitbox: { x: 0, y: -160, w: 1, h: 1 },
        hurtbox: { x: -30, y: -160, w: 60, h: 160 },
        damage: 0, hitstun: 0, blockstun: 0, knockback: 0, launchHeight: 0, type: 'high',
      }],
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'nicole_pilates_burn',
      name: 'Pilates Burn',
      motion: ['DOWN', 'FORWARD', 'HEAVY'],
      hitboxFrames: [
        { startupFrames: 4, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 60, h: 80 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 28, hitstun: 4, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 4, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 60, h: 80 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 28, hitstun: 4, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 4, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 60, h: 80 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 28, hitstun: 4, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 4, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 60, h: 80 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 28, hitstun: 4, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 4, activeFrames: 2, recoveryFrames: 20, hitbox: { x: 10, y: -120, w: 60, h: 80 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 45, hitstun: 12, blockstun: 8, knockback: 200, launchHeight: 0, type: 'high' },
      ],
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'nicole_wellness_retreat',
      name: 'Wellness Retreat',
      motion: ['SPECIAL', 'METER'],
      isFinale: true, superFreeze: true, cinematicDuration: 2500, blockable: false,
      hitboxFrames: [
        { startupFrames: 30, activeFrames: 8, recoveryFrames: 0, hitbox: { x: 0, y: -160, w: 100, h: 160 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 60, hitstun: 15, blockstun: 0, knockback: 0, launchHeight: 0, type: 'high' },
        { startupFrames: 15, activeFrames: 8, recoveryFrames: 40, hitbox: { x: 0, y: -160, w: 100, h: 160 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 260, hitstun: 60, blockstun: 0, knockback: 200, launchHeight: 0, type: 'high' },
      ],
    }
  }

  protected registerMoves(): void {
    this.moves = [
      this.getSignatureMove1(),
      this.getSignatureMove2(),
      this.getSignatureMove3(),
      this.getFinaleMove(),
    ]
  }

  update(delta: number, opponent: BaseCharacter): void {
    // Shadow Work teleport
    const state = this.stateMachine.currentState
    if (this.activeMove?.id === 'nicole_shadow_work' && state === 'ATTACK_SPECIAL_2') {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      if (this.currentMoveFrame === activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        this.x = Math.max(80, Math.min(1200, opponent.x - dir * 90))
      }
    }

    // Block enter: grant armor
    if (state === 'BLOCK' && this.stateMachine.stateTimer === 0) {
      this.armorFrames = 20
    }

    super.update(delta, opponent)
  }
}
