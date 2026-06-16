import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition } from '../types'
import * as C from '../constants'

export class Donna extends BaseCharacter {
  readonly characterId = 'donna'
  readonly displayName = 'Donna'
  readonly maxHealth = 900
  readonly walkSpeed = 240
  readonly weight = 6
  readonly color = '#800020'

  // Passive: "Southern Charm"
  private justWaitActive: boolean = false
  private counterHealPending: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
  }

  getIntroLine(): string {
    return "Bless your heart."
  }

  getVoiceLines(): string[] {
    return [
      "Yee haw, matey.",
      "We'll steal your heart.",
      "This dance is over.",
      "Honey, that was embarrassing."
    ]
  }

  // Override takeDamage to implement Southern Charm passive
  takeDamage(amount: number, hitstun: number, knockbackX: number, isBlocked: boolean): void {
    // When in IDLE and takes a hit, set justWaitActive
    if (!isBlocked && this.stateMachine.currentState === 'IDLE') {
      this.justWaitActive = true
    }
    super.takeDamage(amount, hitstun, knockbackX, isBlocked)
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Passive effects are handled in takeDamage and the damage dealing logic
    // Counter heals are handled in the parry move connection via passiveData
    if (this.passiveData['counterHealPending']) {
      this.health = Math.min(this.maxHealth, this.health + 30)
      this.passiveData['counterHealPending'] = false
    }
  }

  // Override getActiveHitboxFrame to apply damage multiplier from justWaitActive
  getActiveHitboxFrame() {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null

    if (this.justWaitActive) {
      const boostedHf = { ...hf, damage: Math.floor(hf.damage * 1.5) }
      return boostedHf
    }

    return hf
  }

  // Called after a hit lands to reset the buff
  onHitLanded(): void {
    if (this.justWaitActive) {
      this.justWaitActive = false
    }
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'donna_cutlass_cyclone',
      name: 'Cutlass Cyclone',
      motion: ['DOWN', 'FORWARD', 'LIGHT'],
      hitboxFrames: [
        {
          startupFrames: 5,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -120, w: 70, h: 80 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 35,
          hitstun: 6,
          blockstun: 8,
          knockback: 80,
          launchHeight: 0,
          type: 'high'
        },
        {
          startupFrames: 8,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -120, w: 70, h: 80 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 35,
          hitstun: 6,
          blockstun: 8,
          knockback: 80,
          launchHeight: 0,
          type: 'high'
        },
        {
          startupFrames: 11,
          activeFrames: 5,
          recoveryFrames: 20,
          hitbox: { x: 10, y: -130, w: 70, h: 90 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 10,
          blockstun: 8,
          knockback: 120,
          launchHeight: 0,
          type: 'high'
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'donna_flintlock_fancy',
      name: 'Flintlock Fancy',
      motion: ['FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 4,
          activeFrames: 2,
          recoveryFrames: 20,
          hitbox: { x: 0, y: -120, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 65,
          hitstun: 10,
          blockstun: 6,
          knockback: 100,
          launchHeight: 0,
          type: 'high'
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'donna_sweet_tea_sting',
      name: 'Sweet Tea Sting',
      motion: ['DOWN', 'LIGHT'],
      hitboxFrames: [
        {
          startupFrames: 6,
          activeFrames: 4,
          recoveryFrames: 14,
          hitbox: { x: 10, y: -40, w: 70, h: 40 },
          hurtbox: { x: -30, y: -90, w: 60, h: 90 },
          damage: 55,
          hitstun: 14,
          blockstun: 8,
          knockback: 80,
          launchHeight: 0,
          type: 'low'
        }
      ]
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'donna_walk_the_plank',
      name: 'Walk the Plank',
      motion: ['DOWN', 'FORWARD', 'SPECIAL', 'METER'],
      isFinale: true,
      isCommandGrab: true,
      superFreeze: true,
      cinematicDuration: 2500,
      blockable: false,
      hitboxFrames: [
        {
          startupFrames: 15,
          activeFrames: 5,
          recoveryFrames: 30,
          hitbox: { x: 0, y: -160, w: 80, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 280,
          hitstun: 60,
          blockstun: 0,
          knockback: 0,
          launchHeight: 0,
          type: 'overhead'
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

  update(delta: number, opponent: BaseCharacter): void {
    super.update(delta, opponent)

    // Spawn projectile for Flintlock Fancy
    if (
      this.activeMove?.id === 'donna_flintlock_fancy' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const prevFrame = this.currentMoveFrame - Math.ceil(delta / FRAME_TIME)

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        const colorNum = parseInt(this.color.replace('#', ''), 16)
        this.projectileManager.spawn({
          x: this.x + dir * 30, y: this.y - 110,
          vx: dir * 700, vy: 0,
          damage: hf.damage, hitstun: hf.hitstun, knockback: hf.knockback * dir,
          ownerId: this.characterId, radius: 6, color: colorNum, lifetime: 90,
        })
      }
    }
  }
}
