import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition } from '../types'

export class Kristen extends BaseCharacter {
  readonly characterId = 'kristen'
  readonly displayName = 'Kristen'
  readonly maxHealth = 1000
  readonly walkSpeed = 270
  readonly weight = 7
  readonly color = '#DC143C'

  private comboDamageMult = 1.0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
    this.initCharacter()
  }

  getIntroLine(): string {
    return "This is my recovery day."
  }

  getVoiceLines(): string[] {
    return [
      "I hope you stretched.",
      "This counts as cardio.",
      "This is just my warm-up.",
      "Three… two… one… GO!",
    ]
  }

  takeDamage(amount: number, hitstun: number, knockbackX: number, isBlocked: boolean): void {
    if (!isBlocked) this.comboDamageMult = 1.0
    super.takeDamage(amount, hitstun, knockbackX, isBlocked)
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Momentum mult is updated in getActiveHitboxFrame on successful hits
    // Low-HP rage tracked here
    if (this.health < this.maxHealth * 0.3) {
      this.passiveData['rageActive'] = true
    } else {
      this.passiveData['rageActive'] = false
    }
  }

  getActiveHitboxFrame() {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null
    let mult = this.comboDamageMult
    if (this.passiveData['rageActive']) mult *= 1.3
    return { ...hf, damage: Math.floor(hf.damage * mult) }
  }

  onHitLanded(): void {
    this.comboDamageMult = Math.min(1.5, this.comboDamageMult + 0.05)
  }

  onWhiff(): void {
    this.comboDamageMult = 1.0
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'kristen_pr_attempt',
      name: 'PR Attempt',
      motion: ['DOWN', 'HEAVY'],
      hitboxFrames: [{
        startupFrames: 12, activeFrames: 6, recoveryFrames: 22,
        hitbox: { x: -10, y: -170, w: 80, h: 70 },
        hurtbox: { x: -30, y: -160, w: 60, h: 160 },
        damage: 110, hitstun: 22, blockstun: 14, knockback: 150, launchHeight: 200, type: 'overhead',
      }],
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'kristen_plate_toss',
      name: 'Plate Toss',
      motion: ['FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [{
        startupFrames: 10, activeFrames: 3, recoveryFrames: 20,
        hitbox: { x: 0, y: -100, w: 10, h: 10 },
        hurtbox: { x: -30, y: -160, w: 60, h: 160 },
        damage: 80, hitstun: 14, blockstun: 8, knockback: 180, launchHeight: 0, type: 'high',
      }],
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'kristen_emom',
      name: 'EMOM From Hell',
      motion: ['DOWN', 'FORWARD', 'HEAVY'],
      hitboxFrames: [
        { startupFrames: 5, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 70, h: 100 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 30, hitstun: 5, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 5, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 70, h: 100 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 30, hitstun: 5, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 5, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 70, h: 100 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 30, hitstun: 5, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 5, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 70, h: 100 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 30, hitstun: 5, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 5, activeFrames: 2, recoveryFrames: 0, hitbox: { x: 10, y: -120, w: 70, h: 100 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 30, hitstun: 5, blockstun: 4, knockback: 40, launchHeight: 0, type: 'high' },
        { startupFrames: 5, activeFrames: 2, recoveryFrames: 25, hitbox: { x: 10, y: -120, w: 70, h: 100 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 50, hitstun: 20, blockstun: 10, knockback: 250, launchHeight: 0, type: 'high' },
      ],
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'kristen_pickleball_of_doom',
      name: 'Pickleball of Doom',
      motion: ['SPECIAL', 'METER'],
      isFinale: true, superFreeze: true, cinematicDuration: 2500, blockable: false,
      hitboxFrames: [
        { startupFrames: 20, activeFrames: 5, recoveryFrames: 0, hitbox: { x: 0, y: -130, w: 80, h: 130 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 60, hitstun: 8, blockstun: 0, knockback: 150, launchHeight: 0, type: 'high' },
        { startupFrames: 8, activeFrames: 5, recoveryFrames: 0, hitbox: { x: 0, y: -130, w: 80, h: 130 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 60, hitstun: 8, blockstun: 0, knockback: 150, launchHeight: 0, type: 'high' },
        { startupFrames: 8, activeFrames: 5, recoveryFrames: 0, hitbox: { x: 0, y: -130, w: 80, h: 130 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 60, hitstun: 8, blockstun: 0, knockback: 150, launchHeight: 0, type: 'high' },
        { startupFrames: 8, activeFrames: 5, recoveryFrames: 0, hitbox: { x: 0, y: -130, w: 80, h: 130 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 60, hitstun: 8, blockstun: 0, knockback: 150, launchHeight: 0, type: 'high' },
        { startupFrames: 8, activeFrames: 5, recoveryFrames: 40, hitbox: { x: 0, y: -130, w: 80, h: 130 }, hurtbox: { x: -30, y: -160, w: 60, h: 160 }, damage: 60, hitstun: 40, blockstun: 0, knockback: 400, launchHeight: 0, type: 'high' },
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
    super.update(delta, opponent)

    if (this.activeMove?.id === 'kristen_plate_toss' && this.projectileManager) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const prevFrame = this.currentMoveFrame - Math.ceil(delta / (1000 / 60))
      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        const colorNum = parseInt(this.color.replace('#', ''), 16)
        this.projectileManager.spawn({
          x: this.x + dir * 30, y: this.y - 100,
          vx: dir * 650, vy: 0,
          damage: hf.damage, hitstun: hf.hitstun, knockback: hf.knockback * dir,
          ownerId: this.characterId, radius: 14, color: colorNum, lifetime: 100,
        })
      }
    }
  }
}
