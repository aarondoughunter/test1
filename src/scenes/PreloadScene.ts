import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'

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

    // Placeholder audio stubs — empty arrays won't throw, they silently skip
    this.load.audio('fight_theme_1', [])
    this.load.audio('fight_theme_2', [])
    this.load.audio('menu_theme', [])
    this.load.audio('victory_theme', [])
  }

  create(): void {
    this.scene.start('MainMenuScene')
  }
}
