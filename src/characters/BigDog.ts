import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition, HitboxFrame } from '../types'
import * as C from '../constants'

export class BigDog extends BaseCharacter {
  readonly characterId = 'big_dog'
  readonly displayName = 'Big Dog'
  readonly maxHealth = 1200
  readonly walkSpeed = 180
  readonly weight = 10
  readonly color = '#8B4513'

  // Passive: every 5th hit received grants 20 bonus meter
  private hitCount = 0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
  }

  getIntroLine(): string {
    return "Boy, you look lost."
  }

  getVoiceLines(): string[] {
    return [
      "Perfecto.",
      "All bark? Lemme show you bite.",
      "Smoke 'em if ya got 'em.",
      "That's a paddlin'."
    ]
  }

  // Override takeDamage to implement passive
  takeDamage(amount: number, hitstun: number, knockbackX: number, isBlocked: boolean): void {
    if (!isBlocked) {
      this.hitCount++
      if (this.hitCount % 5 === 0) {
        this.gainMeter(20)
      }
    }
    super.takeDamage(amount, hitstun, knockbackX, isBlocked)
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Passive is handled in takeDamage override
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'big_dog_bat_country',
      name: 'Bat Country',
      motion: ['HEAVY', 'HEAVY'],
      hitboxFrames: [
        {
          startupFrames: 8,
          activeFrames: 6,
          recoveryFrames: 20,
          hitbox: { x: 10, y: -120, w: 80, h: 60 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 90,
          hitstun: 18,
          blockstun: 12,
          knockback: 200,
          launchHeight: 0,
          type: 'high'
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'big_dog_buckshot_express',
      name: 'Buckshot Express',
      motion: ['DOWN', 'FORWARD', 'HEAVY'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 10,
          activeFrames: 4,
          recoveryFrames: 25,
          hitbox: { x: 0, y: -100, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 70,
          hitstun: 12,
          blockstun: 8,
          knockback: 150,
          launchHeight: 0,
          type: 'high'
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'big_dog_roadkill_rush',
      name: 'Roadkill Rush',
      motion: ['BACK', 'FORWARD', 'SPECIAL'],
      isCommandGrab: true,
      hitboxFrames: [
        {
          startupFrames: 5,
          activeFrames: 8,
          recoveryFrames: 20,
          hitbox: { x: 0, y: -120, w: 100, h: 120 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 100,
          hitstun: 20,
          blockstun: 0,
          knockback: 300,
          launchHeight: 0,
          type: 'overhead'
        }
      ]
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'big_dog_call_of_the_wild',
      name: 'Call of the Wild',
      motion: ['SPECIAL', 'METER'],
      isFinale: true,
      superFreeze: true,
      cinematicDuration: 2000,
      blockable: false,
      hitboxFrames: [
        {
          startupFrames: 30,
          activeFrames: 8,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 55,
          hitstun: 8,
          blockstun: 0,
          knockback: 100,
          launchHeight: 50,
          type: 'high'
        },
        {
          startupFrames: 8,
          activeFrames: 8,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 55,
          hitstun: 8,
          blockstun: 0,
          knockback: 100,
          launchHeight: 50,
          type: 'high'
        },
        {
          startupFrames: 8,
          activeFrames: 8,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 55,
          hitstun: 8,
          blockstun: 0,
          knockback: 100,
          launchHeight: 50,
          type: 'high'
        },
        {
          startupFrames: 8,
          activeFrames: 8,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 55,
          hitstun: 8,
          blockstun: 0,
          knockback: 100,
          launchHeight: 50,
          type: 'high'
        },
        {
          startupFrames: 8,
          activeFrames: 8,
          recoveryFrames: 30,
          hitbox: { x: 0, y: -140, w: 80, h: 140 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 55,
          hitstun: 8,
          blockstun: 0,
          knockback: 100,
          launchHeight: 50,
          type: 'high'
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

  // Spawn projectiles for Buckshot Express when the move activates
  update(delta: number, opponent: BaseCharacter): void {
    const prevMove = this.activeMove
    const prevFrame = this.currentMoveFrame

    super.update(delta, opponent)

    // Spawn projectiles at active frame of Buckshot Express
    if (
      this.activeMove?.id === 'big_dog_buckshot_express' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        // Spawn 3 projectiles in a spread
        const colorNum = parseInt(this.color.replace('#', ''), 16)
        this.projectileManager.spawn({
          x: this.x + dir * 20, y: this.y - 100,
          vx: dir * 600, vy: -50,
          damage: hf.damage, hitstun: hf.hitstun, knockback: hf.knockback * dir,
          ownerId: this.characterId, radius: 10, color: colorNum, lifetime: 60,
        })
        this.projectileManager.spawn({
          x: this.x + dir * 20, y: this.y - 100,
          vx: dir * 580, vy: 0,
          damage: hf.damage, hitstun: hf.hitstun, knockback: hf.knockback * dir,
          ownerId: this.characterId, radius: 10, color: colorNum, lifetime: 60,
        })
        this.projectileManager.spawn({
          x: this.x + dir * 20, y: this.y - 100,
          vx: dir * 600, vy: 50,
          damage: hf.damage, hitstun: hf.hitstun, knockback: hf.knockback * dir,
          ownerId: this.characterId, radius: 10, color: colorNum, lifetime: 60,
        })
      }
    }
  }
}
