import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition, HitboxFrame } from '../types'

export class Dulcey extends BaseCharacter {
  readonly characterId = 'dulcey'
  readonly displayName = 'Dulcey'
  readonly maxHealth = 880
  readonly walkSpeed = 210
  readonly weight = 5
  readonly color = '#9400D3'

  // Passive: "Extra Credit"
  private intelligenceStacks: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
    this.initCharacter()
  }

  getIntroLine(): string {
    return "Did you read the syllabus?"
  }

  getVoiceLines(): string[] {
    return [
      "Flunk you.",
      "YOU SHALL NOT PASS!",
      "Detention!",
      "Citation needed."
    ]
  }

  private getSpecialMultiplier(): number {
    return 1 + (this.intelligenceStacks * 0.1)
  }

  // Override takeDamage to reset stacks
  takeDamage(amount: number, hitstun: number, knockbackX: number, isBlocked: boolean): void {
    if (!isBlocked) {
      this.intelligenceStacks = 0
    }
    super.takeDamage(amount, hitstun, knockbackX, isBlocked)
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Stack management is handled in takeDamage and onHitLanded
  }

  // Called when a hit lands in a combo
  onComboHit(): void {
    this.intelligenceStacks = Math.min(5, this.intelligenceStacks + 1)
  }

  // Called when a move whiffs
  onWhiff(): void {
    this.intelligenceStacks = 0
  }

  getActiveHitboxFrame(): HitboxFrame | null {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null

    // Apply special multiplier to special moves
    const isSpecialMove = this.activeMove?.id === 'dulcey_pop_quiz' ||
                          this.activeMove?.id === 'dulcey_red_pen_rampage'
    if (isSpecialMove) {
      const mult = this.getSpecialMultiplier()
      return { ...hf, damage: Math.floor(hf.damage * mult) }
    }

    return hf
  }

  update(delta: number, opponent: BaseCharacter): void {
    super.update(delta, opponent)

    // Spawn projectile for Pop Quiz
    if (
      this.activeMove?.id === 'dulcey_pop_quiz' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        const mult = this.getSpecialMultiplier()
        this.projectileManager.spawn({
          x: this.x + dir * 20,
          y: this.y - 120,
          vx: dir * 650,
          vy: -100,
          damage: Math.floor(70 * mult),
          hitstun: hf.hitstun,
          knockback: hf.knockback * dir,
          ownerId: this.characterId,
        })
      }
    }

    // Place trap for Office Hours
    if (
      this.activeMove?.id === 'dulcey_office_hours' &&
      this.trapManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        // Count active traps from this owner
        const activeTraps = this.trapManager.countTrapsBy(this.characterId)
        if (activeTraps < 3) {
          this.trapManager.placeTrap({
            x: this.x,
            y: this.y,
            triggerRadius: 70,
            delayFrames: 0,
            damage: 80,
            hitstun: 20,
            ownerId: this.characterId,
          })
        }
      }
    }
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'dulcey_pop_quiz',
      name: 'Pop Quiz',
      motion: ['DOWN', 'FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 8,
          activeFrames: 3,
          recoveryFrames: 20,
          hitbox: { x: 0, y: -120, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 70,
          hitstun: 12,
          blockstun: 6,
          knockback: 100,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'dulcey_red_pen_rampage',
      name: 'Red Pen Rampage',
      motion: ['DOWN', 'LIGHT', 'LIGHT', 'LIGHT'],
      hitboxFrames: [
        {
          startupFrames: 5,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 10, y: -130, w: 60, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 30,
          hitstun: 5,
          blockstun: 3,
          knockback: 40,
          launchHeight: 0,
        },
        {
          startupFrames: 5,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 10, y: -130, w: 60, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 30,
          hitstun: 5,
          blockstun: 3,
          knockback: 40,
          launchHeight: 0,
        },
        {
          startupFrames: 5,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 10, y: -130, w: 60, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 30,
          hitstun: 5,
          blockstun: 3,
          knockback: 40,
          launchHeight: 0,
        },
        {
          startupFrames: 5,
          activeFrames: 5,
          recoveryFrames: 22,
          hitbox: { x: 10, y: -130, w: 60, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 50,
          hitstun: 15,
          blockstun: 8,
          knockback: 180,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'dulcey_office_hours',
      name: 'Office Hours',
      motion: ['DOWN', 'BACK', 'SPECIAL'],
      hitboxFrames: [
        {
          startupFrames: 10,
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
      id: 'dulcey_publish_or_perish',
      name: 'Publish or Perish',
      motion: ['SPECIAL', 'METER'],
      isFinale: true,
      superFreeze: true,
      cinematicDuration: 3000,
      blockable: false,
      hitboxFrames: [
        {
          startupFrames: 15,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 30,
          launchHeight: 0,
        },
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 35,
          launchHeight: 10,
        },
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 40,
          launchHeight: 20,
        },
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 50,
          launchHeight: 30,
        },
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 60,
          launchHeight: 40,
        },
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 70,
          launchHeight: 50,
        },
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 8,
          blockstun: 0,
          knockback: 80,
          launchHeight: 60,
        },
        {
          startupFrames: 7,
          activeFrames: 6,
          recoveryFrames: 35,
          hitbox: { x: -20, y: -160, w: 100, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 20,
          blockstun: 0,
          knockback: 300,
          launchHeight: 150,
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
