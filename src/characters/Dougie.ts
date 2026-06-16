import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition, HitboxFrame } from '../types'
import * as C from '../constants'

export class Dougie extends BaseCharacter {
  readonly characterId = 'dougie'
  readonly displayName = 'Dougie'
  readonly maxHealth = 1100
  readonly walkSpeed = 190
  readonly weight = 8
  readonly color = '#003087'

  // Passive: "Performance Review"
  private firstAttackUsed: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)

    // Listen for round-reset event to clear firstAttackUsed
    this.scene.events.on('round-reset', () => {
      this.firstAttackUsed = false
    })
  }

  getIntroLine(): string {
    return "Let's circle back to your termination."
  }

  getVoiceLines(): string[] {
    return [
      "And for that reason, I'm out.",
      "We're gonna have to let you go.",
      "Get back to work.",
      "Consider this a restructuring."
    ]
  }

  // Calculate damage multiplier based on opponent HP loss
  private getDamageBuff(opponent: BaseCharacter): number {
    const hpLostFraction = (opponent.maxHealth - opponent.health) / opponent.maxHealth
    // Each 10% HP loss = +5% damage, max +40%
    const stacks = Math.floor(hpLostFraction / 0.10)
    const clampedStacks = Math.min(8, stacks) // 8 * 5% = 40%
    return 1.0 + clampedStacks * 0.05
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Passive applied in getActiveHitboxFrame override and move start
  }

  // Override startMove to implement first-attack-unblockable passive
  startMove(move: MoveDefinition): void {
    if (!this.firstAttackUsed) {
      // Make this move's first hitbox frame unblockable
      this.firstAttackUsed = true
      const modifiedMove: MoveDefinition = {
        ...move,
        hitboxFrames: move.hitboxFrames.map((hf, i) =>
          i === 0
            ? { ...hf, blockstun: 0, type: 'overhead' as const }
            : hf
        )
      }
      super.startMove(modifiedMove)
    } else {
      super.startMove(move)
    }
  }

  getActiveHitboxFrame() {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null
    // We need opponent reference to compute damage buff — store it from last update
    // We'll use passiveData to cache the buff
    const buff = (this.passiveData['damageBuff'] as number) ?? 1.0
    return { ...hf, damage: Math.floor(hf.damage * buff) }
  }

  update(delta: number, opponent: BaseCharacter): void {
    // Cache damage buff for use in getActiveHitboxFrame
    this.passiveData['damageBuff'] = this.getDamageBuff(opponent)

    super.update(delta, opponent)

    // Spawn projectiles for Quarterly Earnings
    if (
      this.activeMove?.id === 'dougie_quarterly_earnings' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        // Rain 4 arcing projectiles
        for (let i = 0; i < 4; i++) {
          this.projectileManager.spawn({
            x: this.x + dir * (80 + i * 60),
            y: this.y - 200,
            vx: dir * 50,
            vy: -400,
            damage: hf.damage,
            hitstun: hf.hitstun,
            knockback: hf.knockback * dir,
            ownerId: this.characterId,
          })
        }
      }
    }
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'dougie_hostile_takeover',
      name: 'Hostile Takeover',
      motion: ['BACK', 'FORWARD', 'HEAVY'],
      hitboxFrames: [
        {
          startupFrames: 6,
          activeFrames: 8,
          recoveryFrames: 18,
          hitbox: { x: 0, y: -120, w: 120, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 95,
          hitstun: 16,
          blockstun: 10,
          knockback: 250,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'dougie_quarterly_earnings',
      name: 'Quarterly Earnings',
      motion: ['DOWN', 'DOWN', 'HEAVY'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 15,
          activeFrames: 4,
          recoveryFrames: 25,
          hitbox: { x: 0, y: -160, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 5,
          knockback: 60,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'dougie_mandatory_overtime',
      name: 'Mandatory Overtime',
      motion: ['FORWARD', 'DOWN', 'DOWN_FORWARD', 'SPECIAL'],
      isCommandGrab: true,
      hitboxFrames: [
        {
          startupFrames: 8,
          activeFrames: 5,
          recoveryFrames: 22,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 120,
          hitstun: 30,
          blockstun: 0,
          knockback: 0,
          launchHeight: 150,
        }
      ]
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'dougie_the_chairman',
      name: 'The Chairman',
      motion: ['SPECIAL', 'METER'],
      isFinale: true,
      superFreeze: true,
      cinematicDuration: 3000,
      blockable: false,
      hitboxFrames: [
        {
          startupFrames: 20,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 100,
          hitstun: 10,
          blockstun: 0,
          knockback: 100,
          launchHeight: 0,
        },
        {
          startupFrames: 10,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 120,
          hitstun: 12,
          blockstun: 0,
          knockback: 200,
          launchHeight: 50,
        },
        {
          startupFrames: 10,
          activeFrames: 6,
          recoveryFrames: 40,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 130,
          hitstun: 20,
          blockstun: 0,
          knockback: 400,
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
