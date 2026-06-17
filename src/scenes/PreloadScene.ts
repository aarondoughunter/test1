import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { CHARACTER_ORDER } from '../characters/characterFactory'
import { POSE_FRAME_COUNTS } from '../systems/CharacterArtRegistry'
import { stageData } from '../data/stageData'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload(): void {
    // Loading bar background
    const barBg = this.add.graphics()
    barBg.fillStyle(0x333333, 1)
    barBg.fillRect(0, GAME_HEIGHT / 2 - 20, GAME_WIDTH, 40)

    // Progress bar (starts empty)
    const barFill = this.add.graphics()

    // Loading text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    // Update progress bar as assets load
    this.load.on('progress', (value: number) => {
      barFill.clear()
      barFill.fillStyle(0x22cc22, 1)
      barFill.fillRect(0, GAME_HEIGHT / 2 - 20, GAME_WIDTH * value, 40)
    })

    // Missing art/audio files 404 quietly per-file and never block boot — this is the
    // partial-delivery fallback in action. Log it so it's visible during asset rollout.
    this.load.on('loaderror', (file: { key: string; src: string }) => {
      console.warn(`[asset missing, using fallback] ${file.key} (${file.src})`)
    })

    // Placeholder audio stubs — empty arrays won't throw, they silently skip
    this.load.audio('fight_theme_1', [])
    this.load.audio('fight_theme_2', [])
    this.load.audio('menu_theme', [])
    this.load.audio('victory_theme', [])

    // Queue every character's full pose-frame set, portrait, and voice lines up front.
    // None of these need to exist yet — CharacterArtRegistry/AudioManager check the
    // texture/audio cache at runtime, so dropping real files in later requires zero
    // code changes here.
    for (const charId of CHARACTER_ORDER) {
      for (const [poseKey, count] of Object.entries(POSE_FRAME_COUNTS)) {
        for (let i = 0; i < count; i++) {
          this.load.image(`${charId}_${poseKey}_${i}`, `assets/characters/${charId}/${poseKey}_${i}.png`)
        }
      }
      this.load.image(`${charId}_portrait`, `assets/characters/${charId}/portrait.png`)
      this.load.audio(`${charId}_intro`, `assets/audio/voice/${charId}_intro.mp3`)
      this.load.audio(`${charId}_victory`, `assets/audio/voice/${charId}_victory.mp3`)
      this.load.audio(`${charId}_finale`, `assets/audio/voice/${charId}_finale.mp3`)
    }

    // Queue every stage's background image up front — same partial-delivery fallback.
    for (const stage of stageData) {
      if (stage.backgroundKey) {
        this.load.image(stage.backgroundKey, `assets/stages/${stage.id}/background.png`)
      }
    }
  }

  create(): void {
    this.scene.start('MainMenuScene')
  }
}
