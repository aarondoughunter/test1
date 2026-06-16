import Phaser from 'phaser'
import { BaseCharacter } from './BaseCharacter'
import { MoveDefinition, HitboxFrame } from '../types'

export class Aaron extends BaseCharacter {
  readonly characterId = 'aaron'
  readonly displayName = 'Aaron'
  readonly maxHealth = 950
  readonly walkSpeed = 230
  readonly weight = 6
  readonly color = '#C0C0C0'

  // Passive: "Pop Culture Arsenal"
  private buffTimer: number = 0
  private damageBuff: number = 1.0
  private speedBuff: number = 1.0
  private meterGainBuff: number = 1.0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y, isPlayer)
    this.initCharacter()
  }

  getIntroLine(): string {
    return "I have a bad feeling about this."
  }

  getVoiceLines(): string[] {
    return [
      "(Batman voice) I'm Batman.",
      "(Vader voice) I am your father.",
      "(Thanos voice) I am… inevitable.",
      "Roll credits."
    ]
  }

  // Activate a taunt buff by index
  activateTaunt(index: number): void {
    this.buffTimer = 300
    if (index === 0) {
      this.damageBuff = 1.2
      this.speedBuff = 1.0
      this.meterGainBuff = 1.0
    } else if (index === 1) {
      this.speedBuff = 1.3
      this.damageBuff = 1.0
      this.meterGainBuff = 1.0
    } else if (index === 2) {
      this.meterGainBuff = 1.5
      this.damageBuff = 1.0
      this.speedBuff = 1.0
    }
  }

  // Override getActiveHitboxFrame to widen hitboxes by 20% (passive)
  getActiveHitboxFrame(): HitboxFrame | null {
    const hf = super.getActiveHitboxFrame()
    if (!hf) return null
    return {
      ...hf,
      hitbox: { ...hf.hitbox, w: Math.floor(hf.hitbox.w * 1.2) },
      damage: Math.floor(hf.damage * this.damageBuff)
    }
  }

  // Override gainMeter to apply meterGain buff
  gainMeter(amount: number): void {
    super.gainMeter(Math.floor(amount * this.meterGainBuff))
  }

  applyPassiveEffect(_opponent: BaseCharacter): void {
    // Buff timer countdown (per frame at 60fps we'd subtract delta, but we count frames here)
    // Handled in update override
  }

  update(delta: number, opponent: BaseCharacter): void {
    super.update(delta, opponent)

    // Tick buff timer
    if (this.buffTimer > 0) {
      this.buffTimer -= delta / (1000 / 60)
      if (this.buffTimer <= 0) {
        this.buffTimer = 0
        this.damageBuff = 1.0
        this.speedBuff = 1.0
        this.meterGainBuff = 1.0
      }
    }

    // Apply speed buff to walkSpeed (vx is set by FightScene, but we can expose effective speed)
    // The scene reads walkSpeed, so we track effective speed in passiveData
    this.passiveData['effectiveWalkSpeed'] = this.walkSpeed * this.speedBuff

    // Apply slowed debuff from Time Slash if opponent set it
    if (this.passiveData['slowedTimer'] && (this.passiveData['slowedTimer'] as number) > 0) {
      this.passiveData['slowedTimer'] = (this.passiveData['slowedTimer'] as number) - delta / (1000 / 60)
    }

    // Spawn boomerang return projectile for Encore
    if (
      this.activeMove?.id === 'aaron_encore' &&
      this.projectileManager
    ) {
      const hf = this.activeMove.hitboxFrames[0]
      const activeStart = hf.startupFrames
      const FRAME_TIME = 1000 / 60
      const framesAdvanced = Math.ceil(delta / FRAME_TIME)
      const prevFrame = this.currentMoveFrame - framesAdvanced

      if (prevFrame < activeStart && this.currentMoveFrame >= activeStart) {
        const dir = this.facing === 'right' ? 1 : -1
        // Outgoing sword
        this.projectileManager.spawn({
          x: this.x + dir * 20,
          y: this.y - 120,
          vx: dir * 600,
          vy: 0,
          damage: hf.damage,
          hitstun: hf.hitstun,
          knockback: hf.knockback * dir,
          ownerId: this.characterId,
        })
      }
    }
  }

  getSignatureMove1(): MoveDefinition {
    return {
      id: 'aaron_time_slash',
      name: 'Time Slash',
      motion: ['DOWN', 'FORWARD', 'LIGHT'],
      hitboxFrames: [
        {
          startupFrames: 7,
          activeFrames: 5,
          recoveryFrames: 16,
          hitbox: { x: 10, y: -130, w: 80, h: 100 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 75,
          hitstun: 15,
          blockstun: 8,
          knockback: 120,
          launchHeight: 0,
        }
      ]
    }
  }

  getSignatureMove2(): MoveDefinition {
    return {
      id: 'aaron_mosh_pit',
      name: 'Mosh Pit',
      motion: ['FORWARD', 'DOWN', 'DOWN_FORWARD', 'HEAVY'],
      hitboxFrames: [
        {
          startupFrames: 6,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -130, w: 75, h: 110 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 32,
          hitstun: 6,
          blockstun: 4,
          knockback: 60,
          launchHeight: 0,
        },
        {
          startupFrames: 6,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -130, w: 75, h: 110 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 32,
          hitstun: 6,
          blockstun: 4,
          knockback: 60,
          launchHeight: 0,
        },
        {
          startupFrames: 6,
          activeFrames: 3,
          recoveryFrames: 0,
          hitbox: { x: 0, y: -130, w: 75, h: 110 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 32,
          hitstun: 6,
          blockstun: 4,
          knockback: 60,
          launchHeight: 0,
        },
        {
          startupFrames: 6,
          activeFrames: 5,
          recoveryFrames: 25,
          hitbox: { x: 0, y: -130, w: 75, h: 110 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 50,
          hitstun: 15,
          blockstun: 8,
          knockback: 200,
          launchHeight: 100,
        }
      ]
    }
  }

  getSignatureMove3(): MoveDefinition {
    return {
      id: 'aaron_encore',
      name: 'Encore',
      motion: ['BACK', 'FORWARD', 'SPECIAL'],
      projectile: true,
      hitboxFrames: [
        {
          startupFrames: 8,
          activeFrames: 2,
          recoveryFrames: 20,
          hitbox: { x: 0, y: -120, w: 10, h: 10 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 12,
          blockstun: 6,
          knockback: 80,
          launchHeight: 0,
        }
      ]
    }
  }

  getFinaleMove(): MoveDefinition {
    return {
      id: 'aaron_master_of_puppets',
      name: 'Master of Puppets',
      motion: ['SPECIAL', 'METER'],
      isFinale: true,
      superFreeze: true,
      cinematicDuration: 2500,
      blockable: false,
      hitboxFrames: [
        {
          startupFrames: 15,
          activeFrames: 4,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 40,
          hitstun: 6,
          blockstun: 0,
          knockback: 50,
          launchHeight: 0,
        },
        {
          startupFrames: 6,
          activeFrames: 4,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 50,
          hitstun: 6,
          blockstun: 0,
          knockback: 60,
          launchHeight: 20,
        },
        {
          startupFrames: 6,
          activeFrames: 4,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 55,
          hitstun: 6,
          blockstun: 0,
          knockback: 70,
          launchHeight: 40,
        },
        {
          startupFrames: 6,
          activeFrames: 4,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 60,
          hitstun: 6,
          blockstun: 0,
          knockback: 80,
          launchHeight: 80,
        },
        {
          startupFrames: 6,
          activeFrames: 4,
          recoveryFrames: 0,
          hitbox: { x: -20, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 65,
          hitstun: 8,
          blockstun: 0,
          knockback: 100,
          launchHeight: 120,
        },
        {
          startupFrames: 6,
          activeFrames: 6,
          recoveryFrames: 40,
          hitbox: { x: -20, y: -160, w: 120, h: 160 },
          hurtbox: { x: -30, y: -160, w: 60, h: 160 },
          damage: 80,
          hitstun: 20,
          blockstun: 0,
          knockback: 300,
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
