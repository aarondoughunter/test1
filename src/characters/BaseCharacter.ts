import Phaser from 'phaser'
import { CharacterState, MoveDefinition, HitboxFrame, HitboxRect } from '../types'
import { StateMachine } from '../systems/StateMachine'
import { InputBuffer } from '../systems/InputBuffer'
import { ProjectileManager } from '../systems/ProjectileManager'
import { TrapManager } from '../systems/TrapManager'
import * as C from '../constants'

export abstract class BaseCharacter {
  // Identity
  abstract readonly characterId: string
  abstract readonly displayName: string
  abstract readonly maxHealth: number
  abstract readonly walkSpeed: number
  abstract readonly weight: number
  abstract readonly color: string

  // Runtime state
  health: number = 0
  meter: number = 0
  isPlayer: boolean
  facing: 'left' | 'right'
  x: number
  y: number
  vx: number = 0
  vy: number = 0
  isGrounded: boolean = true
  jumpsRemaining: number = 1

  // Combat state
  currentMoveFrame: number = 0
  activeMove: MoveDefinition | null = null
  hitReceivedThisFrame: boolean = false
  hitstunFrames: number = 0
  knockbackVx: number = 0
  comboCount: number = 0
  lastHitConnected: boolean = false

  // Passive tracking (per-character flags)
  passiveData: Record<string, number | boolean> = {}

  // Systems
  stateMachine: StateMachine
  inputBuffer: InputBuffer | null = null

  // Scene reference
  protected scene: Phaser.Scene
  protected projectileManager: ProjectileManager | null = null
  protected trapManager: TrapManager | null = null

  // Registered moves
  protected moves: MoveDefinition[] = []

  // Display objects (placeholder art)
  protected bodyRect: Phaser.GameObjects.Rectangle
  protected headRect: Phaser.GameObjects.Rectangle
  protected nameText: Phaser.GameObjects.Text
  protected facingLine: Phaser.GameObjects.Graphics

  // Frame-rate handling
  private frameAccumulator: number = 0
  private readonly FRAME_TIME: number = 1000 / 60

  // Knockdown timer
  private knockdownTimer: number = 0
  private risingTimer: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    this.scene = scene
    this.x = x
    this.y = y
    this.isPlayer = isPlayer
    this.facing = isPlayer ? 'right' : 'left'

    // health will be set after subclass sets maxHealth
    // We do this via a deferred approach using setTimeout(0) trick isn't possible here
    // So we initialize health in a post-construction step via a protected init method

    this.stateMachine = this.createStateMachine()
    this.createPlaceholderArt()
    this.registerMoves()

    // Set health after maxHealth is available (subclass sets it as readonly field)
    this.health = this.maxHealth
  }

  // Abstract methods subclasses must implement
  abstract getIntroLine(): string
  abstract getVoiceLines(): string[]
  abstract getSignatureMove1(): MoveDefinition
  abstract getSignatureMove2(): MoveDefinition
  abstract getSignatureMove3(): MoveDefinition
  abstract getFinaleMove(): MoveDefinition
  abstract applyPassiveEffect(opponent: BaseCharacter): void

  protected abstract registerMoves(): void

  getMove(id: string): MoveDefinition | null {
    return this.moves.find(m => m.id === id) ?? null
  }

  getCurrentHurtbox(): HitboxRect {
    const state = this.stateMachine.currentState
    if (state === 'CROUCH' || state === 'BLOCK_CROUCH') {
      return { x: -30, y: -90, w: 60, h: 90 }
    }
    return { x: -30, y: -160, w: 60, h: 160 }
  }

  getActiveHitboxFrame(): HitboxFrame | null {
    if (!this.activeMove || this.activeMove.hitboxFrames.length === 0) return null

    let frameOffset = 0
    for (const hf of this.activeMove.hitboxFrames) {
      const startupEnd = frameOffset + hf.startupFrames
      const activeEnd = startupEnd + hf.activeFrames
      const totalEnd = activeEnd + hf.recoveryFrames

      if (this.currentMoveFrame >= startupEnd && this.currentMoveFrame < activeEnd) {
        return hf
      }

      frameOffset = totalEnd
    }
    return null
  }

  takeDamage(amount: number, hitstun: number, knockbackX: number, isBlocked: boolean): void {
    if (isBlocked) {
      const chipDamage = amount * C.CHIP_DAMAGE_RATIO
      this.health = Math.max(0, this.health - chipDamage)
      this.gainMeter(C.METER_GAIN_ON_BLOCK)
      this.hitstunFrames = Math.floor(hitstun * 0.5)
      this.stateMachine.transition('BLOCK_STUN')
    } else {
      this.health = Math.max(0, this.health - amount)
      this.hitstunFrames = hitstun
      this.gainMeter(C.METER_GAIN_ON_RECEIVE)
      this.hitReceivedThisFrame = true

      if (hitstun > 20) {
        this.knockbackVx = knockbackX
        this.stateMachine.transition('KNOCKDOWN')
        this.isGrounded = false
        this.vy = -300
      } else {
        this.knockbackVx = knockbackX
        this.stateMachine.transition('HIT_STUN')
      }
    }

    this.scene.events.emit('damage-taken', { character: this, amount, isBlocked })
  }

  gainMeter(amount: number): void {
    this.meter = Math.min(C.METER_MAX, this.meter + amount)
  }

  activateFinale(): boolean {
    const currentState = this.stateMachine.currentState
    const validStates: CharacterState[] = ['IDLE', 'WALK_FORWARD', 'WALK_BACK']
    if (this.meter < C.METER_MAX || !validStates.includes(currentState as CharacterState)) {
      return false
    }
    this.meter = 0
    this.activeMove = this.getFinaleMove()
    this.currentMoveFrame = 0
    this.stateMachine.transition('FINALE_CHARGE')
    return true
  }

  startMove(move: MoveDefinition): void {
    this.activeMove = move
    this.currentMoveFrame = 0

    if (move.isFinale) {
      this.stateMachine.transition('FINALE_CHARGE')
    } else if (move.isCommandGrab) {
      this.stateMachine.transition('ATTACK_SPECIAL_1')
    } else if (move.projectile) {
      // Determine which special slot
      const idx = this.moves.indexOf(move)
      if (idx === 1) {
        this.stateMachine.transition('ATTACK_SPECIAL_1')
      } else if (idx === 2) {
        this.stateMachine.transition('ATTACK_SPECIAL_2')
      } else {
        this.stateMachine.transition('ATTACK_SPECIAL_3')
      }
    } else {
      // Determine attack type from move id
      if (move.id.endsWith('_light')) {
        this.stateMachine.transition('ATTACK_LIGHT')
      } else if (move.id.endsWith('_heavy')) {
        this.stateMachine.transition('ATTACK_HEAVY')
      } else {
        this.stateMachine.transition('ATTACK_SPECIAL_1')
      }
    }
  }

  update(delta: number, opponent: BaseCharacter): void {
    // 1. Apply gravity if not grounded
    if (!this.isGrounded) {
      this.vy += C.GRAVITY * (delta / 1000)
    }

    // 2. Apply velocity to position
    this.x += (this.vx + this.knockbackVx) * (delta / 1000)
    this.y += this.vy * (delta / 1000)

    // Decay knockback
    const knockbackDecay = 800 * (delta / 1000)
    if (this.knockbackVx > 0) {
      this.knockbackVx = Math.max(0, this.knockbackVx - knockbackDecay)
    } else if (this.knockbackVx < 0) {
      this.knockbackVx = Math.min(0, this.knockbackVx + knockbackDecay)
    }

    // 3. Clamp to stage bounds / floor
    if (this.y >= C.FLOOR_Y) {
      this.y = C.FLOOR_Y
      this.vy = 0
      if (!this.isGrounded) {
        this.isGrounded = true
        this.jumpsRemaining = 1
        if (this.stateMachine.currentState === 'JUMP' ||
            this.stateMachine.currentState === 'JUMP_FORWARD' ||
            this.stateMachine.currentState === 'JUMP_BACK') {
          this.stateMachine.transition('IDLE')
        }
      }
    }

    if (this.x < C.STAGE_LEFT_BOUND) {
      this.x = C.STAGE_LEFT_BOUND
      if (this.knockbackVx < 0) this.knockbackVx = 0
      if (this.vx < 0) this.vx = 0
    }
    if (this.x > C.STAGE_RIGHT_BOUND) {
      this.x = C.STAGE_RIGHT_BOUND
      if (this.knockbackVx > 0) this.knockbackVx = 0
      if (this.vx > 0) this.vx = 0
    }

    // 4. Update currentMoveFrame if in attack state
    const attackStates: CharacterState[] = [
      'ATTACK_LIGHT', 'ATTACK_HEAVY', 'ATTACK_SPECIAL_1',
      'ATTACK_SPECIAL_2', 'ATTACK_SPECIAL_3', 'FINALE_CHARGE', 'FINALE_ACTIVE'
    ]
    const currentState = this.stateMachine.currentState as CharacterState

    if (attackStates.includes(currentState) && this.activeMove) {
      this.frameAccumulator += delta
      const framesToAdvance = Math.floor(this.frameAccumulator / this.FRAME_TIME)
      this.frameAccumulator -= framesToAdvance * this.FRAME_TIME
      this.currentMoveFrame += framesToAdvance

      // 5. Check move completion
      const totalFrames = this.activeMove.hitboxFrames.reduce((sum, hf) => {
        return sum + hf.startupFrames + hf.activeFrames + hf.recoveryFrames
      }, 0)

      if (this.currentMoveFrame >= totalFrames) {
        this.activeMove = null
        this.currentMoveFrame = 0
        this.stateMachine.transition('IDLE')
      }
    }

    // 6. Update hitstun countdown
    if (currentState === 'HIT_STUN' || currentState === 'BLOCK_STUN') {
      this.frameAccumulator += delta
      const framesToAdvance = Math.floor(this.frameAccumulator / this.FRAME_TIME)
      this.frameAccumulator -= framesToAdvance * this.FRAME_TIME

      if (framesToAdvance > 0) {
        this.hitstunFrames -= framesToAdvance
        if (this.hitstunFrames <= 0) {
          this.hitstunFrames = 0
          this.stateMachine.transition('IDLE')
        }
      }
    }

    // Handle KNOCKDOWN timer
    if (currentState === 'KNOCKDOWN') {
      this.knockdownTimer += delta
      if (this.knockdownTimer >= 60 * this.FRAME_TIME) {
        this.knockdownTimer = 0
        this.stateMachine.transition('RISING')
      }
    }

    // Handle RISING timer
    if (currentState === 'RISING') {
      this.risingTimer += delta
      if (this.risingTimer >= 30 * this.FRAME_TIME) {
        this.risingTimer = 0
        this.stateMachine.transition('IDLE')
      }
    }

    // 7. Call stateMachine.update(delta)
    this.stateMachine.update(delta)

    // 8. Call applyPassiveEffect(opponent)
    this.applyPassiveEffect(opponent)

    // 9. Update placeholder art positions
    this.updateArt()

    // 10. Update facing (face opponent when IDLE/WALK)
    const idleStates: CharacterState[] = ['IDLE', 'WALK_FORWARD', 'WALK_BACK', 'CROUCH']
    if (idleStates.includes(currentState)) {
      if (opponent.x > this.x) {
        this.facing = 'right'
      } else {
        this.facing = 'left'
      }
    }

    // Reset per-frame flags
    this.hitReceivedThisFrame = false
  }

  protected createStateMachine(): StateMachine {
    const sm = new StateMachine()

    const allStates: CharacterState[] = [
      'IDLE', 'WALK_FORWARD', 'WALK_BACK', 'CROUCH', 'JUMP', 'JUMP_FORWARD', 'JUMP_BACK',
      'ATTACK_LIGHT', 'ATTACK_HEAVY', 'ATTACK_SPECIAL_1', 'ATTACK_SPECIAL_2', 'ATTACK_SPECIAL_3',
      'BLOCK', 'BLOCK_CROUCH', 'HIT_STUN', 'BLOCK_STUN', 'KNOCKDOWN', 'RISING',
      'PARRY', 'PINNED', 'GRABBED', 'GRABBING', 'FINALE_CHARGE', 'FINALE_ACTIVE',
      'VICTORY', 'DEFEATED', 'INTRO'
    ]

    for (const state of allStates) {
      sm.addState(state, {
        enter: () => {},
        exit: () => {},
        update: (_dt: number) => {}
      })
    }

    sm.setState('IDLE')
    return sm
  }

  protected createPlaceholderArt(): void {
    const colorNum = parseInt(this.color.replace('#', ''), 16)

    // Body dimensions vary by character
    let bodyW = 60
    let bodyH = 160
    if (this.characterId === 'big_dog') {
      bodyW = 80
      bodyH = 180
    } else if (this.characterId === 'mabry') {
      bodyW = 50
      bodyH = 150
    }

    // Body rect (origin at feet, so y offset = -bodyH/2 to center it)
    this.bodyRect = this.scene.add.rectangle(this.x, this.y - bodyH / 2, bodyW, bodyH, colorNum)

    // Head rect on top of body
    this.headRect = this.scene.add.rectangle(
      this.x,
      this.y - bodyH - 20,
      40, 40,
      colorNum
    )

    // Name text above head
    this.nameText = this.scene.add.text(
      this.x,
      this.y - bodyH - 50,
      this.displayName,
      { fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5, 0.5)

    // Facing line
    this.facingLine = this.scene.add.graphics()
    this.drawFacingLine()
  }

  private drawFacingLine(): void {
    if (!this.facingLine) return
    this.facingLine.clear()
    this.facingLine.lineStyle(2, 0xffffff, 1)
    const dir = this.facing === 'right' ? 1 : -1
    this.facingLine.lineBetween(
      this.x, this.y - 80,
      this.x + dir * 30, this.y - 80
    )
  }

  setProjectileManager(pm: ProjectileManager): void {
    this.projectileManager = pm
  }

  setTrapManager(tm: TrapManager): void {
    this.trapManager = tm
  }

  updateArt(): void {
    if (!this.bodyRect) return

    let bodyH = 160
    if (this.characterId === 'big_dog') {
      bodyH = 180
    } else if (this.characterId === 'mabry') {
      bodyH = 150
    }

    this.bodyRect.setPosition(this.x, this.y - bodyH / 2)
    this.headRect.setPosition(this.x, this.y - bodyH - 20)
    this.nameText.setPosition(this.x, this.y - bodyH - 50)

    // Flip based on facing
    const scaleX = this.facing === 'right' ? 1 : -1
    this.bodyRect.setScale(scaleX, 1)

    this.drawFacingLine()
  }

  destroy(): void {
    this.bodyRect?.destroy()
    this.headRect?.destroy()
    this.nameText?.destroy()
    this.facingLine?.destroy()
  }
}
