import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, ARCADE_FONT, FLOOR_Y } from '../constants'
import { BaseCharacter } from '../characters/BaseCharacter'
import { createCharacter } from '../characters/characterFactory'
import { characterData } from '../data/characterData'
import { stageData } from '../data/stageData'
import { createStageRenderHandle, drawStage, StageRenderHandle } from '../utils/StageRenderer'
import { AudioManager } from '../systems/AudioManager'
import { addScanlineOverlay, addVignette } from '../utils/ArcadeChrome'

// Plays before every match (including rematches): shows both fighters in their
// home stage, sequences each side's intro voice line with an on-screen subtitle,
// and falls back to a flat timed hold per side when no audio clip exists yet.
const LINE_HOLD_MS = 1250

export class IntroCinematicScene extends Phaser.Scene {
  private stageHandle!: StageRenderHandle
  private audioManager!: AudioManager
  private playerChar!: BaseCharacter
  private aiChar!: BaseCharacter
  private nameText!: Phaser.GameObjects.Text
  private subtitleText!: Phaser.GameObjects.Text
  private hasProceeded = false

  constructor() {
    super({ key: 'IntroCinematicScene' })
  }

  create(): void {
    this.hasProceeded = false

    const playerCharId = (this.registry.get('playerCharId') as string) ?? 'aaron'
    const aiCharId = (this.registry.get('aiCharId') as string) ?? 'big_dog'
    const stageId = (this.registry.get('stageId') as string) ?? 'backyard'
    const stage = stageData.find(s => s.id === stageId) ?? stageData[0]

    this.stageHandle = createStageRenderHandle(this)
    drawStage(this, this.stageHandle, stage)

    this.playerChar = createCharacter(playerCharId, this, 320, FLOOR_Y, true)
    this.aiChar = createCharacter(aiCharId, this, 960, FLOOR_Y, false)
    this.playerChar.stateMachine.transition('INTRO')
    this.aiChar.stateMachine.transition('INTRO')
    this.playerChar.update(0, this.aiChar)
    this.aiChar.update(0, this.playerChar)

    this.audioManager = new AudioManager(this)

    this.nameText = this.add.text(GAME_WIDTH / 2, 80, '', {
      fontFamily: ARCADE_FONT,
      fontSize: '22px',
      color: '#FF4500',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5)

    this.subtitleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'italic',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      wordWrap: { width: GAME_WIDTH - 240 },
      align: 'center',
    }).setOrigin(0.5, 0.5)

    this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 24, '[Press any key to skip]', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(1, 0.5)

    this.input.keyboard!.on('keydown', () => this.proceed())

    addVignette(this)
    addScanlineOverlay(this)

    const playerStats = characterData[playerCharId]
    const aiStats = characterData[aiCharId]

    this.playLine(playerCharId, playerStats?.displayName ?? playerCharId, playerStats?.introLine ?? '', () => {
      this.playLine(aiCharId, aiStats?.displayName ?? aiCharId, aiStats?.introLine ?? '', () => {
        this.proceed()
      })
    })

    // Hard safety ceiling in case a sound object never reaches 'complete'
    // (e.g. suspended audio context) — the per-side skip key is the primary escape.
    this.time.delayedCall(8000, () => this.proceed())
  }

  private playLine(charId: string, displayName: string, line: string, onDone: () => void): void {
    this.nameText.setText(displayName)
    this.subtitleText.setText(`"${line}"`)

    const key = `${charId}_intro`
    if (this.cache.audio.has(key)) {
      this.audioManager.playVoiceClip(key, onDone)
    } else {
      this.time.delayedCall(LINE_HOLD_MS, onDone)
    }
  }

  private proceed(): void {
    if (this.hasProceeded) return
    this.hasProceeded = true
    this.playerChar?.destroy()
    this.aiChar?.destroy()
    this.sound.stopAll()
    this.scene.start('FightScene')
  }
}
