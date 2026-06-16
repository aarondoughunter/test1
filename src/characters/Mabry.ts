import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition } from '../types'
import * as C from '../constants'

export class Mabry extends BaseCharacter {
  readonly characterId = 'mabry'
  readonly displayName = 'Mabry'
  readonly maxHealth = 820
  readonly walkSpeed = 300
  readonly weight = 4
  readonly color = '#00CED1'

  // Passive: "Tidal Momentum"
  private speedBoostTimer: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
  }

  getIntroLine(): string {
    return "Deep water's where the monsters live."
  }

  getVoiceLines(): string[] {
    return [
      "It's not the heat, it's the humidity.",
      "Don't hold your breath.",
      "There's always a bigger fish.",
      "Sink or swim."
    ]
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Handled in update
  }

  update(delta: number, opponent: BaseCharacter): void {
    const wasInJump =
      this.stateMachine.currentState === 'JUMP' ||
      this.stateMachine.currentState === 'JUMP_FORWARD' ||
      this.stateMachine.currentState === 'JUMP_BACK'

    super.update(delta, opponent)

    // Tick speed boost timer
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= delta / (1000 / 60)
      if (this.speedBoostTimer < 0) this.speedBoostTimer = 0
    }

    // Expose effective walkSpeed
    const effectiveSpeed = this.speedBoostTimer > 0
      ? this.walkSpeed * 1.4
      : this.walkSpeed
    this.passiveData['effectiveWalkSpeed'] = effectiveSpeed

    // Jump count resets after aerial attack landing
    const nowGrounded = this.isGrounded
    const attackStates = ['ATTACK_LIGHT', 'ATTACK_HEAVY', 'ATTACK_SPECIAL_1', 'ATTACK_SPECIAL_2', 'ATTACK_SPECIAL_3']
    if (wasInJump && nowGrounded && attackStates.includes(this.stateMachine.currentState as string)) {
      this.jumpsRemaining = 1
    }

    // Spawn projectile for Hydro Lance
    if (
      this.activeMove?.id === 'mabry_hydro_lance' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        this.projectileManager.spawn({
          x: this.x + dir * 20,
          y: this.y - 130,
          vx: dir * 900,
          vy: 0,
          damage: hf.damage,
          hitstun: hf.hitstun,
          knockback: hf.knockback * dir,
          ownerId: this.characterId,
        })
      }
    }

    // Place trap for Undertow
    if (
      this.activeMove?.id === 'mabry_undertow' &&
      this.trapManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        this.trapManager.placeTrap({
          x: this.x,
          y: this.y,
          triggerRadius: 60,
          delayFrames: 0,
          damage: 75,
          hitstun: 18,
          ownerId: this.characterId,
        })
      }
    }
  }

  // Override: after special attack lands, set speedBoostTimer
  onSpecialAttackLanded(): void {
    this.speedBoostTimer = 120
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'mabry_rip_current',
      name: 'Rip Current',
      motion: ['DOWN', 'BACK', 'SPECIAL'],
      hitboxFrames: [
        {
          startupFrames: 10,
          activeFrames: 6,
          recoveryFrames: 20,
          hitbox: { x: -10, y: -150, w: 200, h: 150 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 20,
          blockstun: 10,
          knockback: -200,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'mabry_hydro_lance',
      name: 'Hydro Lance',
      motion: ['DOWN', 'FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 8,
          activeFrames: 3,
          recoveryFrames: 22,
          hitbox: { x: 0, y: -130, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 80,
          hitstun: 16,
          blockstun: 8,
          knockback: 180,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'mabry_undertow',
      name: 'Undertow',
      motion: ['BACK', 'DOWN', 'DOWN_BACK', 'SPECIAL'],
      hitboxFrames: [
        {
          startupFrames: 12,
          activeFrames: 4,
          recoveryFrames: 18,
          hitbox: { x: -30, y: -10, w: 60, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 0,
          hitstun: 0,
          blockstun: 0,
          knockback: 0,
          launchHeight: 0,
        }
      ]
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'mabry_hundred_year_storm',
      name: '100-Year Storm',
      motion: ['SPECIAL', 'METER'],
      isFinale: true,
      superFreeze: true,
      cinematicDuration: 3000,
      blockable: false,
      hitboxFrames: [
        {
          startupFrames: 20,
          activeFrames: 6,
          recoveryFrames: 0,
          hitbox: { x: -30, y: -180, w: 120, h: 180 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 8,
          blockstun: 0,
          knockback: 80,
          launchHeight: 0,
        },
        {
          startupFrames: 8,
          activeFrames: 6,
          recoveryFrames: 0,
          hitbox: { x: -30, y: -180, w: 120, h: 180 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 8,
          blockstun: 0,
          knockback: 80,
          launchHeight: 0,
        },
        {
          startupFrames: 8,
          activeFrames: 6,
          recoveryFrames: 0,
          hitbox: { x: -30, y: -180, w: 120, h: 180 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 8,
          blockstun: 0,
          knockback: 80,
          launchHeight: 0,
        },
        {
          startupFrames: 8,
          activeFrames: 6,
          recoveryFrames: 0,
          hitbox: { x: -30, y: -180, w: 120, h: 180 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 8,
          blockstun: 0,
          knockback: 80,
          launchHeight: 0,
        },
        {
          startupFrames: 8,
          activeFrames: 8,
          recoveryFrames: 40,
          hitbox: { x: -30, y: -180, w: 120, h: 180 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 20,
          blockstun: 0,
          knockback: 500,
          launchHeight: 100,
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
