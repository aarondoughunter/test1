import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition, HitboxFrame } from '../types'
import * as C from '../constants'

export class Nate extends BaseCharacter {
  readonly characterId = 'nate'
  readonly displayName = 'Nate'
  readonly maxHealth = 850
  readonly walkSpeed = 200
  readonly weight = 5
  readonly color = '#228B22'

  // Passive: "Locked In"
  private stillTimer: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
  }

  getIntroLine(): string {
    return "Watch this."
  }

  getVoiceLines(): string[] {
    return [
      "Trust the process.",
      "Easy money.",
      "No problemo.",
      "Calculated."
    ]
  }

  private getStillMultiplier(): number {
    return 1 + Math.min(2, Math.floor(this.stillTimer / 60) * 0.1)
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Handled in update
  }

  update(delta: number, opponent: BaseCharacter): void {
    // Track stillTimer before calling super (super may change state)
    const attackStates = [
      'ATTACK_LIGHT', 'ATTACK_HEAVY', 'ATTACK_SPECIAL_1',
      'ATTACK_SPECIAL_2', 'ATTACK_SPECIAL_3', 'FINALE_CHARGE', 'FINALE_ACTIVE'
    ]
    const isInAttack = attackStates.includes(this.stateMachine.currentState as string)

    if (Math.abs(this.vx) < 1 && !isInAttack && this.isGrounded) {
      this.stillTimer += delta / (1000 / 60)
    } else {
      this.stillTimer = 0
    }

    // Cache multiplier for use in getActiveHitboxFrame
    this.passiveData['stillMultiplier'] = this.getStillMultiplier()

    super.update(delta, opponent)

    // Spawn arrows for Bullseye
    if (
      this.activeMove?.id === 'nate_bullseye' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        const mult = this.getStillMultiplier()
        this.projectileManager.spawn({
          x: this.x + dir * 20,
          y: this.y - 120,
          vx: dir * 900,
          vy: 0,
          damage: Math.floor(65 * mult),
          hitstun: hf.hitstun,
          knockback: hf.knockback * dir,
          ownerId: this.characterId,
        })
      }
    }

    // Spawn arrows for Rapid Fire (3 arrows at 8-frame intervals)
    if (
      this.activeMove?.id === 'nate_rapid_fire' &&
      this.projectileManager
    ) {
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced
      const dir = this.facing === 'right' ? 1 : -1

      const spawnFrames = [5, 13, 21]
      for (const sf of spawnFrames) {
        if (prevFrame < sf && this.currentMoveFrame >= sf) {
          this.projectileManager.spawn({
            x: this.x + dir * 20,
            y: this.y - 120,
            vx: dir * 850,
            vy: 0,
            damage: 40,
            hitstun: 7,
            knockback: 60 * dir,
            ownerId: this.characterId,
          })
        }
      }
    }
  }

  getActiveHitboxFrame(): HitboxFrame | null {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null

    // Apply still multiplier to projectile moves (Bullseye is handled in update spawn)
    // For staff moves, standard damage
    return hf
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'nate_bullseye',
      name: 'Bullseye',
      motion: ['FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 3,
          activeFrames: 2,
          recoveryFrames: 18,
          hitbox: { x: 0, y: -120, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 65,
          hitstun: 10,
          blockstun: 5,
          knockback: 100,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'nate_rapid_fire',
      name: 'Rapid Fire',
      motion: ['DOWN', 'FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 5,
          activeFrames: 2,
          recoveryFrames: 25,
          hitbox: { x: 0, y: -120, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 7,
          blockstun: 4,
          knockback: 60,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'nate_gym_class_hero',
      name: 'Gym Class Hero',
      motion: ['HEAVY', 'SPECIAL'],
      hitboxFrames: [
        {
          startupFrames: 8,
          activeFrames: 4,
          recoveryFrames: 18,
          hitbox: { x: 10, y: -120, w: 90, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 45,
          hitstun: 8,
          blockstun: 5,
          knockback: 60,
          launchHeight: 0,
        },
        {
          startupFrames: 8,
          activeFrames: 4,
          recoveryFrames: 18,
          hitbox: { x: 10, y: -120, w: 90, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 45,
          hitstun: 8,
          blockstun: 5,
          knockback: 60,
          launchHeight: 0,
        },
        {
          startupFrames: 8,
          activeFrames: 5,
          recoveryFrames: 25,
          hitbox: { x: 10, y: -120, w: 90, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 16,
          blockstun: 8,
          knockback: 200,
          launchHeight: 0,
        }
      ]
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'nate_perfect_shot',
      name: 'Perfect Shot',
      motion: ['SPECIAL', 'METER'],
      isFinale: true,
      superFreeze: true,
      cinematicDuration: 2000,
      blockable: false,
      hitboxFrames: [
        // Pin hit
        {
          startupFrames: 15,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 80,
          hitstun: 50,
          blockstun: 0,
          knockback: 0,
          launchHeight: 0,
        },
        // Explosive arrow
        {
          startupFrames: 55,
          activeFrames: 8,
          recoveryFrames: 30,
          hitbox: { x: -40, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 270,
          hitstun: 30,
          blockstun: 0,
          knockback: 500,
          launchHeight: 200,
        }
      ]
    }
  }

  protected registerMoves(): void {
    this.moves = [
      this.getSignatureMove1(),
      this.getSignatureMove2(),
      this.getSignatureMove3(),
      this.getFinaleMove()
    ]
  }
}
