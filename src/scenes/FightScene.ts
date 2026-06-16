import Phaser from 'phaser'
import { BaseCharacter } from '../characters/BaseCharacter'
import { createCharacter } from '../characters/characterFactory'
import { HitboxSystem, ActiveHitbox } from '../systems/HitboxSystem'
import { InputBuffer } from '../systems/InputBuffer'
import { ComboDetector } from '../systems/ComboDetector'
import { RoundManager } from '../systems/RoundManager'
import { AudioManager } from '../systems/AudioManager'
import { AIController, AIGameState } from '../systems/AIController'
import { ProjectileManager } from '../systems/ProjectileManager'
import { TrapManager } from '../systems/TrapManager'
import { DebugOverlay } from '../utils/DebugOverlay'
import { characterData } from '../data/characterData'
import { aiProfiles } from '../data/aiProfiles'
import { stageData } from '../data/stageData'
import { RawInput, AIDifficulty, MoveDefinition, StageData } from '../types'
import * as C from '../constants'

export class FightScene extends Phaser.Scene {
  private playerChar!: BaseCharacter
  private aiChar!: BaseCharacter
  private hitboxSystem!: HitboxSystem
  private inputBuffer!: InputBuffer
  private comboDetector!: ComboDetector
  private roundManager!: RoundManager
  private audioManager!: AudioManager
  private aiController!: AIController
  private projectileManager!: ProjectileManager
  private trapManager!: TrapManager
  private debugOverlay!: DebugOverlay
  private keys!: { [key: string]: Phaser.Input.Keyboard.Key }
  private currentFrame = 0
  private stageGraphics!: Phaser.GameObjects.Graphics
  private hitStopTimer = 0
  private isHitStop = false
  private pendingVoiceLine: { char: BaseCharacter; index: number } | null = null

  constructor() {
    super({ key: 'FightScene' })
  }

  create(): void {
    // Read from registry
    const playerCharId = (this.registry.get('playerCharId') as string) ?? 'aaron'
    const aiCharId = (this.registry.get('aiCharId') as string) ?? 'big_dog'
    const difficulty = (this.registry.get('difficulty') as AIDifficulty) ?? 'medium'
    const stageId = (this.registry.get('stageId') as string) ?? 'backyard'

    // Find the stage
    const stage = stageData.find(s => s.id === stageId) ?? stageData[0]

    // Draw stage background
    this.stageGraphics = this.add.graphics()
    this.drawStage(stage)

    // Create characters
    this.playerChar = createCharacter(playerCharId, this, 320, C.FLOOR_Y, true)
    this.aiChar = createCharacter(aiCharId, this, 960, C.FLOOR_Y, false)

    // Set up ProjectileManager and TrapManager
    this.projectileManager = new ProjectileManager(this)
    this.trapManager = new TrapManager(this)

    this.playerChar.setProjectileManager(this.projectileManager)
    this.playerChar.setTrapManager(this.trapManager)
    this.aiChar.setProjectileManager(this.projectileManager)
    this.aiChar.setTrapManager(this.trapManager)

    // Set up AIController
    const aiProfile = aiProfiles[aiCharId] ?? aiProfiles['big_dog']
    this.aiController = new AIController(difficulty, aiProfile)

    // Set up InputBuffer and ComboDetector
    this.inputBuffer = new InputBuffer()
    this.comboDetector = new ComboDetector()
    this.playerChar.inputBuffer = this.inputBuffer

    // Set up remaining systems
    this.hitboxSystem = new HitboxSystem()
    this.roundManager = new RoundManager(this)
    this.audioManager = new AudioManager(this)
    this.debugOverlay = new DebugOverlay(this)

    // Play stage music
    this.audioManager.playMusic(stage.musicKey)

    // Set up input keys
    this.keys = this.input.keyboard!.addKeys({
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      light: 'Z',
      heavy: 'X',
      special: 'C',
      meter: 'V',
      f1: 'F1',
    }) as { [key: string]: Phaser.Input.Keyboard.Key }

    // Launch UIScene in parallel
    this.scene.launch('UIScene')

    // Emit character names to UIScene
    const p1Stats = characterData[playerCharId]
    const p2Stats = characterData[aiCharId]
    this.time.delayedCall(150, () => {
      this.events.emit('names-update', {
        p1Name: p1Stats?.displayName ?? playerCharId,
        p2Name: p2Stats?.displayName ?? aiCharId,
      })
    })

    // Wire up round manager events
    this.events.on('round-start', (data: { round: number }) => {
      // Relay to UIScene with normalized field name
      this.events.emit('round-start-ui', { roundNumber: data.round })
    })

    // Listen for the scene-level events the RoundManager emits
    this.events.on('round-end', (data: { winner: string; round: number }) => {
      this.cameras.main.shake(400, 0.015)
      const roundEndData = {
        winner: data.winner,
        p1Wins: this.roundManager.p1RoundsWon,
        p2Wins: this.roundManager.p2RoundsWon,
      }

      if (!this.roundManager.isMatchOver()) {
        this.time.delayedCall(2000, () => {
          this.roundManager.resetForNextRound(this.playerChar, this.aiChar, 320, 960)
          this.roundManager.startRound()
        })
      } else {
        // Store match winner in registry for VictoryScene
        this.registry.set('matchWinner', this.roundManager.getMatchWinner())
        this.registry.set('p1Wins', this.roundManager.p1RoundsWon)
        this.registry.set('p2Wins', this.roundManager.p2RoundsWon)
        this.time.delayedCall(3000, () => {
          this.audioManager.stopMusic(500)
          this.scene.stop('UIScene')
          this.scene.start('VictoryScene')
        })
      }

      // Forward to UIScene
      this.events.emit('round-end-ui', roundEndData)
    })

    this.events.on('match-end', (data: { winner: string }) => {
      this.events.emit('match-end-ui', data)
    })

    // Start first round
    this.roundManager.startRound()

    // Emit round-start to UIScene (after short delay to allow UIScene to hook in)
    this.time.delayedCall(200, () => {
      this.events.emit('round-start', { roundNumber: this.roundManager.currentRound, round: this.roundManager.currentRound })
    })
  }

  private drawStage(stage: StageData): void {
    const g = this.stageGraphics
    g.clear()

    // Sky gradient simulation (two-tone)
    g.fillStyle(stage.skyColor, 1)
    g.fillRect(0, 0, 1280, 400)

    // Darker mid-ground band
    const midColor = Phaser.Display.Color.IntegerToColor(stage.skyColor)
    midColor.darken(20)
    g.fillStyle(midColor.color, 1)
    g.fillRect(0, 380, 1280, 120)

    // Ground
    g.fillStyle(stage.groundColor, 1)
    g.fillRect(0, C.FLOOR_Y, 1280, 720 - C.FLOOR_Y)

    // Ground accent stripe
    g.fillStyle(stage.accentColor, 1)
    g.fillRect(0, C.FLOOR_Y, 1280, 8)

    // Simple background pillars/elements for depth
    const pillarColor = Phaser.Display.Color.IntegerToColor(stage.skyColor)
    pillarColor.darken(30)
    g.fillStyle(pillarColor.color, 0.6)
    for (let i = 0; i < 5; i++) {
      const px = 100 + i * 280
      g.fillRect(px, 200, 40, 180)
    }

    // Floor line
    g.lineStyle(3, 0xffffff, 0.8)
    g.lineBetween(C.STAGE_LEFT_BOUND, C.FLOOR_Y, C.STAGE_RIGHT_BOUND, C.FLOOR_Y)

    // Stage edge shadows
    g.fillStyle(0x000000, 0.3)
    g.fillRect(0, 0, C.STAGE_LEFT_BOUND, 720)
    g.fillRect(C.STAGE_RIGHT_BOUND, 0, 1280 - C.STAGE_RIGHT_BOUND, 720)
  }

  update(_time: number, delta: number): void {
    // Allow RoundManager to manage INTRO/KO phases
    if (this.roundManager.phase !== 'FIGHT') {
      this.roundManager.update(delta, this.playerChar.health, this.aiChar.health)
      return
    }

    // Hit-stop: freeze both characters briefly on hits
    if (this.isHitStop) {
      this.hitStopTimer--
      if (this.hitStopTimer <= 0) this.isHitStop = false
      return
    }

    this.currentFrame++

    // 1. Record player input
    const rawInput = this.readPlayerInput()
    this.inputBuffer.record(rawInput)

    // 2. Detect player special moves via ComboDetector
    const playerMoves: MoveDefinition[] = [
      this.playerChar.getSignatureMove1(),
      this.playerChar.getSignatureMove2(),
      this.playerChar.getSignatureMove3(),
    ]
    const detectedMove = this.comboDetector.detectMove(this.inputBuffer, playerMoves, this.playerChar.facing)

    // 3. Apply player input to character state machine
    this.applyPlayerInput(rawInput, detectedMove)

    // 4. AI decision
    const aiGameState: AIGameState = {
      distanceToOpponent: Math.abs(this.aiChar.x - this.playerChar.x),
      ownHealth: this.aiChar.health,
      opponentHealth: this.playerChar.health,
      ownMeter: this.aiChar.meter,
      opponentState: this.playerChar.stateMachine.current,
      opponentRecoveryFrames: this.getRecoveryFrames(this.playerChar),
      isOpponentJumping: ['JUMP', 'JUMP_FORWARD', 'JUMP_BACK'].includes(this.playerChar.stateMachine.current),
      ownX: this.aiChar.x,
      opponentX: this.playerChar.x,
    }
    const aiDecision = this.aiController.evaluate(aiGameState)
    this.applyAIDecision(aiDecision.action)

    // 5. Update both characters
    this.playerChar.update(delta, this.aiChar)
    this.aiChar.update(delta, this.playerChar)

    // 6. Check hitboxes (player attacks AI)
    this.resolveHitboxes(this.playerChar, this.aiChar)
    // Check hitboxes (AI attacks player)
    this.resolveHitboxes(this.aiChar, this.playerChar)

    // 7. Update projectiles and traps
    this.projectileManager.update(delta)
    this.checkProjectileHits()

    const trapDamageP1 = this.trapManager.update(delta, this.playerChar.x, this.playerChar.y)
    if (trapDamageP1) {
      this.playerChar.takeDamage(trapDamageP1.damage, trapDamageP1.hitstun, 0, false)
    }
    const trapDamageP2 = this.trapManager.update(delta, this.aiChar.x, this.aiChar.y)
    if (trapDamageP2) {
      this.aiChar.takeDamage(trapDamageP2.damage, trapDamageP2.hitstun, 0, false)
    }

    // 8. Round management
    this.roundManager.update(delta, this.playerChar.health, this.aiChar.health)

    // 9. Emit UI update events
    this.events.emit('health-update', {
      p1: this.playerChar.health,
      p2: this.aiChar.health,
      p1Max: this.playerChar.maxHealth,
      p2Max: this.aiChar.maxHealth,
    })
    this.events.emit('meter-update', {
      p1: this.playerChar.meter,
      p2: this.aiChar.meter,
    })
    this.events.emit('timer-update', {
      seconds: Math.ceil(this.roundManager.roundTimeRemaining),
    })

    // 10. Debug overlay
    if (this.debugOverlay.isEnabled()) {
      this.debugOverlay.update({
        'P1 State': this.playerChar.stateMachine.current,
        'AI State': this.aiChar.stateMachine.current,
        'P1 HP': Math.round(this.playerChar.health),
        'AI HP': Math.round(this.aiChar.health),
        Frame: this.currentFrame,
      })
    }

    // F1 toggles debug
    if (Phaser.Input.Keyboard.JustDown(this.keys['f1'])) {
      this.debugOverlay.toggle()
      this.hitboxSystem.toggleDebug(this)
    }

    // Random voice lines
    this.maybeFireVoiceLine()
  }

  private readPlayerInput(): RawInput {
    const k = this.keys
    return {
      left: k['left'].isDown,
      right: k['right'].isDown,
      up: k['up'].isDown,
      down: k['down'].isDown,
      light: k['light'].isDown,
      heavy: k['heavy'].isDown,
      special: k['special'].isDown,
      meter: k['meter'].isDown,
      frame: this.currentFrame,
    }
  }

  private applyPlayerInput(raw: RawInput, detectedMove: MoveDefinition | null): void {
    const sm = this.playerChar.stateMachine
    const state = sm.current
    const notBusy = [
      'IDLE', 'WALK_FORWARD', 'WALK_BACK', 'CROUCH',
      'JUMP', 'JUMP_FORWARD', 'JUMP_BACK',
    ].includes(state)

    // Finale activation
    if (raw.meter && raw.special && this.playerChar.meter >= C.METER_MAX && notBusy) {
      if (this.playerChar.activateFinale()) {
        this.triggerSuperFreeze()
        this.triggerFinaleEffect(this.playerChar)
      }
      return
    }

    // Special move from combo detector
    if (detectedMove && notBusy) {
      this.playerChar.startMove(detectedMove)
      return
    }

    // Basic light attack (only when not crouching or jumping)
    if (raw.light && notBusy && !raw.down && !raw.up) {
      this.triggerBasicAttack(this.playerChar, 'light')
      return
    }

    // Basic heavy attack
    if (raw.heavy && notBusy && !raw.down) {
      this.triggerBasicAttack(this.playerChar, 'heavy')
      return
    }

    // Block: hold back (away from opponent)
    const holdingBack = this.playerChar.facing === 'right' ? raw.left : raw.right
    if (holdingBack && !raw.light && !raw.heavy && !raw.special && state === 'IDLE') {
      sm.transition('BLOCK')
      this.playerChar.vx = 0
      return
    }
    if (!holdingBack && state === 'BLOCK') {
      sm.transition('IDLE')
    }

    // Crouch (check before movement to avoid conflict)
    if (raw.down && ['IDLE', 'CROUCH', 'WALK_FORWARD', 'WALK_BACK'].includes(state)) {
      sm.transition('CROUCH')
      this.playerChar.vx = 0
      return
    }
    if (!raw.down && state === 'CROUCH') {
      sm.transition('IDLE')
    }

    // Jump
    if (
      raw.up &&
      this.playerChar.isGrounded &&
      state !== 'JUMP' &&
      state !== 'JUMP_FORWARD' &&
      state !== 'JUMP_BACK'
    ) {
      this.playerChar.vy = C.JUMP_VELOCITY
      this.playerChar.isGrounded = false
      if (raw.right) {
        sm.forceTransition('JUMP_FORWARD')
        this.playerChar.vx = this.playerChar.walkSpeed * 0.6
      } else if (raw.left) {
        sm.forceTransition('JUMP_BACK')
        this.playerChar.vx = -this.playerChar.walkSpeed * 0.6
      } else {
        sm.forceTransition('JUMP')
        this.playerChar.vx = 0
      }
      return
    }

    // Movement (only in movement states)
    if (['IDLE', 'WALK_FORWARD', 'WALK_BACK'].includes(state)) {
      if (raw.right && this.playerChar.facing === 'right') {
        sm.transition('WALK_FORWARD')
        this.playerChar.vx = this.playerChar.walkSpeed
      } else if (raw.left && this.playerChar.facing === 'right') {
        sm.transition('WALK_BACK')
        this.playerChar.vx = -this.playerChar.walkSpeed
      } else if (raw.right && this.playerChar.facing === 'left') {
        sm.transition('WALK_BACK')
        this.playerChar.vx = this.playerChar.walkSpeed
      } else if (raw.left && this.playerChar.facing === 'left') {
        sm.transition('WALK_FORWARD')
        this.playerChar.vx = -this.playerChar.walkSpeed
      } else {
        sm.transition('IDLE')
        this.playerChar.vx = 0
      }
    }
  }

  private triggerBasicAttack(char: BaseCharacter, type: 'light' | 'heavy'): void {
    if (type === 'light') {
      const move: MoveDefinition = {
        id: `${char.characterId}_basic_light`,
        name: 'Basic Light',
        motion: ['LIGHT'],
        hitboxFrames: [
          {
            startupFrames: 4,
            activeFrames: 4,
            recoveryFrames: 10,
            hitbox: { x: 10, y: -120, w: 65, h: 80 },
            hurtbox: { x: -30, y: -160, w: 60, h: 160 },
            damage: 40,
            hitstun: 10,
            blockstun: 6,
            knockback: 80,
            launchHeight: 0,
            type: 'high',
          },
        ],
      }
      char.startMove(move)
      char.gainMeter(C.METER_GAIN_ON_HIT_LIGHT)
    } else {
      const move: MoveDefinition = {
        id: `${char.characterId}_basic_heavy`,
        name: 'Basic Heavy',
        motion: ['HEAVY'],
        hitboxFrames: [
          {
            startupFrames: 8,
            activeFrames: 5,
            recoveryFrames: 18,
            hitbox: { x: 10, y: -130, w: 75, h: 90 },
            hurtbox: { x: -30, y: -160, w: 60, h: 160 },
            damage: 65,
            hitstun: 15,
            blockstun: 10,
            knockback: 130,
            launchHeight: 0,
            type: 'high',
          },
        ],
      }
      char.startMove(move)
      char.gainMeter(C.METER_GAIN_ON_HIT_HEAVY)
    }
  }

  private applyAIDecision(action: string): void {
    const char = this.aiChar
    const sm = char.stateMachine
    const state = sm.current
    const busy = !['IDLE', 'WALK_FORWARD', 'WALK_BACK', 'CROUCH'].includes(state)

    if (busy) return

    switch (action) {
      case 'IDLE':
        sm.transition('IDLE')
        char.vx = 0
        break

      case 'WALK_FORWARD': {
        const dir = char.facing === 'right' ? 1 : -1
        sm.transition('WALK_FORWARD')
        char.vx = char.walkSpeed * dir
        break
      }

      case 'WALK_BACK': {
        const dir = char.facing === 'right' ? -1 : 1
        sm.transition('WALK_BACK')
        char.vx = char.walkSpeed * dir
        break
      }

      case 'JUMP':
        if (char.isGrounded) {
          char.vy = C.JUMP_VELOCITY
          char.isGrounded = false
          sm.forceTransition('JUMP')
        }
        break

      case 'JUMP_FORWARD':
        if (char.isGrounded) {
          char.vy = C.JUMP_VELOCITY
          char.isGrounded = false
          const dir = char.facing === 'right' ? 1 : -1
          char.vx = char.walkSpeed * 0.6 * dir
          sm.forceTransition('JUMP_FORWARD')
        }
        break

      case 'CROUCH':
        sm.transition('CROUCH')
        char.vx = 0
        break

      case 'BLOCK':
        sm.transition('BLOCK')
        char.vx = 0
        break

      case 'ATTACK_LIGHT':
        this.triggerBasicAttack(char, 'light')
        break

      case 'ATTACK_HEAVY':
        this.triggerBasicAttack(char, 'heavy')
        break

      case 'USE_SPECIAL_1':
        char.startMove(char.getSignatureMove1())
        break

      case 'USE_SPECIAL_2':
        char.startMove(char.getSignatureMove2())
        break

      case 'USE_SPECIAL_3':
        char.startMove(char.getSignatureMove3())
        break

      case 'USE_FINALE':
        if (char.activateFinale()) {
          this.triggerSuperFreeze()
          this.triggerFinaleEffect(char)
        }
        break

      default:
        break
    }
  }

  private resolveHitboxes(attacker: BaseCharacter, defender: BaseCharacter): void {
    const frame = attacker.getActiveHitboxFrame()
    if (!frame) return

    const activeHitbox: ActiveHitbox = {
      frame,
      worldX: attacker.x,
      worldY: attacker.y,
      facing: attacker.facing,
      ownerId: attacker.characterId,
      hitRegistered: false,
    }

    const defenderHurtbox = defender.getCurrentHurtbox()
    const isBlocking =
      defender.stateMachine.current === 'BLOCK' ||
      defender.stateMachine.current === 'BLOCK_CROUCH'
    const isCrouching =
      defender.stateMachine.current === 'CROUCH' ||
      defender.stateMachine.current === 'BLOCK_CROUCH'

    const result = this.hitboxSystem.update(
      activeHitbox,
      defenderHurtbox,
      defender.x,
      defender.y,
      defender.facing,
      isBlocking,
      isCrouching
    )

    if (result === 'hit' || result === 'blocked') {
      const knockbackDir = attacker.facing === 'right' ? 1 : -1
      const isHeavy = frame.hitstun > 12
      defender.takeDamage(frame.damage, frame.hitstun, frame.knockback * knockbackDir, result === 'blocked')
      attacker.gainMeter(isHeavy ? C.METER_GAIN_ON_HIT_HEAVY : C.METER_GAIN_ON_HIT_LIGHT)

      // Hit stop
      this.isHitStop = true
      this.hitStopTimer = isHeavy ? C.HEAVY_HIT_STOP_FRAMES : C.HIT_STOP_FRAMES

      if (result === 'hit') {
        const impactX = (attacker.x + defender.x) / 2
        const impactY = attacker.y - 100
        this.spawnHitSpark(impactX, impactY, isHeavy, attacker.color)
      }

      // Voice line chance on hit
      if (result === 'hit' && Math.random() < 0.15) {
        this.pendingVoiceLine = {
          char: attacker,
          index: Math.floor(Math.random() * 3),
        }
      }
    }
  }

  private checkProjectileHits(): void {
    // Check player's projectiles hitting AI
    const aiHurtbox = this.aiChar.getCurrentHurtbox()
    const aiHit = this.projectileManager.checkHit(
      this.playerChar.characterId,
      this.aiChar.x + aiHurtbox.x,
      this.aiChar.y + aiHurtbox.y,
      aiHurtbox.w,
      aiHurtbox.h
    )
    if (aiHit) {
      this.aiChar.takeDamage(aiHit.damage, aiHit.hitstun, aiHit.knockback, false)
      this.playerChar.gainMeter(C.METER_GAIN_ON_HIT_SPECIAL)
    }

    // Check AI's projectiles hitting player
    const p1Hurtbox = this.playerChar.getCurrentHurtbox()
    const p1Hit = this.projectileManager.checkHit(
      this.aiChar.characterId,
      this.playerChar.x + p1Hurtbox.x,
      this.playerChar.y + p1Hurtbox.y,
      p1Hurtbox.w,
      p1Hurtbox.h
    )
    if (p1Hit) {
      this.playerChar.takeDamage(p1Hit.damage, p1Hit.hitstun, p1Hit.knockback, false)
      this.aiChar.gainMeter(C.METER_GAIN_ON_HIT_SPECIAL)
    }
  }

  private spawnHitSpark(x: number, y: number, isHeavy: boolean, attackerColor: string): void {
    const colorNum = parseInt(attackerColor.replace('#', ''), 16)
    const count = isHeavy ? 8 : 5
    const speed = isHeavy ? 300 : 180
    const g = this.add.graphics()
    g.setDepth(20)

    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 100, life: 1, maxLife: 1 })
    }

    const flash = this.add.graphics()
    flash.setDepth(19)
    flash.fillStyle(0xffffff, 0.9)
    flash.fillCircle(x, y, isHeavy ? 30 : 18)
    this.time.delayedCall(60, () => flash.destroy())

    const timer = this.time.addEvent({
      delay: 16,
      repeat: 15,
      callback: () => {
        g.clear()
        for (const p of particles) {
          p.x += p.vx * 0.016
          p.y += p.vy * 0.016
          p.vy += 600 * 0.016
          p.life -= 1 / 16
          if (p.life > 0) {
            const r = Math.max(1, 5 * p.life)
            g.fillStyle(colorNum, p.life)
            g.fillCircle(p.x, p.y, r)
            g.fillStyle(0xffffff, p.life * 0.8)
            g.fillCircle(p.x, p.y, r * 0.4)
          }
        }
        if (timer.repeatCount === 0) g.destroy()
      },
    })
  }

  private triggerFinaleEffect(char: BaseCharacter): void {
    const colorNum = parseInt(char.color.replace('#', ''), 16)
    const overlay = this.add.graphics()
    overlay.setDepth(25)
    overlay.fillStyle(0x000000, 0)
    overlay.fillRect(0, 0, 1280, 720)

    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        overlay.clear()
        overlay.fillStyle(colorNum, 0.4)
        overlay.fillRect(0, 0, 1280, 720)
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 600,
          delay: 300,
          ease: 'Quad.easeOut',
          onComplete: () => overlay.destroy(),
        })
      },
    })

    this.cameras.main.shake(300, 0.012)
  }

  private triggerSuperFreeze(): void {
    // Brief time scale slowdown for Finale dramatic effect
    this.time.timeScale = 0.1
    this.time.delayedCall(300, () => {
      this.time.timeScale = 1
    })
  }

  private getRecoveryFrames(char: BaseCharacter): number {
    if (!char.activeMove) return 0
    const move = char.activeMove
    let frameOffset = 0
    for (const hf of move.hitboxFrames) {
      const startupEnd = frameOffset + hf.startupFrames
      const activeEnd = startupEnd + hf.activeFrames
      const totalEnd = activeEnd + hf.recoveryFrames
      if (char.currentMoveFrame >= activeEnd && char.currentMoveFrame < totalEnd) {
        return totalEnd - char.currentMoveFrame
      }
      frameOffset = totalEnd
    }
    return 0
  }

  private maybeFireVoiceLine(): void {
    if (this.pendingVoiceLine) {
      const { char, index } = this.pendingVoiceLine
      const lines = char.getVoiceLines()
      const text = lines[index] ?? lines[0]
      this.events.emit('voice-line', { text, x: char.x, y: char.y - 180, color: char.color })
      this.pendingVoiceLine = null
    }

    // Random ambient voice lines (rare — ~0.2% per frame)
    if (Math.random() < 0.002) {
      const char = Math.random() < 0.5 ? this.playerChar : this.aiChar
      const lines = char.getVoiceLines()
      const text = lines[Math.floor(Math.random() * lines.length)]
      this.events.emit('voice-line', { text, x: char.x, y: char.y - 180, color: char.color })
    }
  }
}
