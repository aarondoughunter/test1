import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, ARCADE_FONT } from '../constants'
import { AudioManager } from '../systems/AudioManager'
import { addScanlineOverlay, addVignette, drawGradientPanel, addTitleGlow, addChaseLightBorder } from '../utils/ArcadeChrome'

type MenuItem = 'PLAY' | 'OPTIONS' | 'CREDITS'

const MENU_ITEMS: MenuItem[] = ['PLAY', 'OPTIONS', 'CREDITS']
const MENU_Y = [380, 450, 520]

export class MainMenuScene extends Phaser.Scene {
  private audioManager!: AudioManager
  private cursorIndex = 0
  private cursorText!: Phaser.GameObjects.Text
  private menuTexts: Phaser.GameObjects.Text[] = []
  private keys!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    enter: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
    esc: Phaser.Input.Keyboard.Key
    m: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
  }

  // Overlay state
  private overlayContainer: Phaser.GameObjects.Container | null = null
  private inOverlay = false

  // Options state
  private musicVol = 0.6
  private sfxVol = 0.8
  private optionsMusicText: Phaser.GameObjects.Text | null = null
  private optionsSfxText: Phaser.GameObjects.Text | null = null

  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create(): void {
    this.audioManager = new AudioManager(this)
    this.audioManager.playMusic('menu_theme')

    // Dark background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111111)

    // Chase-light marquee border around the whole screen
    addChaseLightBorder(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, GAME_HEIGHT - 20)

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 180, 'FAMILY FIGHTER', {
      fontFamily: ARCADE_FONT,
      fontSize: '48px',
      color: '#FF4500',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5)
    addTitleGlow(title)

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 260, "Who's the best in the family?", {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    // Menu items
    this.menuTexts = []
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const t = this.add.text(GAME_WIDTH / 2, MENU_Y[i], MENU_ITEMS[i], {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5)
      this.menuTexts.push(t)
    }

    // Cursor
    this.cursorText = this.add.text(0, 0, '▶', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FF4500',
    }).setOrigin(0.5, 0.5)

    // Controls panel
    const panelX = GAME_WIDTH / 2
    const panelY = 630
    drawGradientPanel(this, panelX, panelY, 900, 130, 0x1a1a2e, 0x05050a, 0x444444)

    this.add.text(panelX, panelY - 48, 'CONTROLS', {
      fontFamily: ARCADE_FONT,
      fontSize: '12px',
      color: '#FF4500',
      letterSpacing: 2,
    }).setOrigin(0.5, 0.5)

    const col1 = [
      '← →   Move / Walk back',
      '↑      Jump',
      '↓      Crouch',
      'Hold ← (back)   Block',
    ].join('\n')

    const col2 = [
      'Z   Light Attack',
      'X   Heavy Attack',
      'C   Special  (+ motion for combo specials)',
      'V + C   Finale  (requires full meter)',
    ].join('\n')

    const col3 = 'P   Pause\nF1  Debug'

    this.add.text(panelX - 360, panelY - 10, col1, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#dddddd',
      lineSpacing: 6,
    }).setOrigin(0, 0.5)

    this.add.text(panelX - 20, panelY - 10, col2, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#dddddd',
      lineSpacing: 6,
    }).setOrigin(0, 0.5)

    this.add.text(panelX + 340, panelY - 10, col3, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#dddddd',
      lineSpacing: 6,
    }).setOrigin(0, 0.5)

    // Arcade-cabinet screen treatment
    addVignette(this)
    addScanlineOverlay(this)

    this.updateCursor()

    // Keys
    this.keys = this.input.keyboard!.addKeys({
      up: 'UP',
      down: 'DOWN',
      enter: 'ENTER',
      z: 'Z',
      esc: 'ESC',
      m: 'M',
      s: 'S',
    }) as typeof this.keys
  }

  private updateCursor(): void {
    const mx = GAME_WIDTH / 2 - 120
    const my = MENU_Y[this.cursorIndex]
    this.cursorText.setPosition(mx, my)

    for (let i = 0; i < this.menuTexts.length; i++) {
      this.menuTexts[i].setColor(i === this.cursorIndex ? '#FF4500' : '#ffffff')
    }
  }

  update(): void {
    if (this.inOverlay) {
      // Any key closes credits overlay; options handled by M/S keys
      if (
        Phaser.Input.Keyboard.JustDown(this.keys.esc) ||
        Phaser.Input.Keyboard.JustDown(this.keys.z) ||
        Phaser.Input.Keyboard.JustDown(this.keys.enter)
      ) {
        this.closeOverlay()
      }

      // Volume controls while in options
      if (MENU_ITEMS[this.cursorIndex] === 'OPTIONS' && this.overlayContainer) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
          this.musicVol = Math.min(1, this.musicVol + 0.1)
          this.audioManager.setMusicVolume(this.musicVol)
          this.updateOptionsText()
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.s)) {
          this.sfxVol = Math.min(1, this.sfxVol + 0.1)
          this.audioManager.setSFXVolume(this.sfxVol)
          this.updateOptionsText()
        }
      }
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.cursorIndex = (this.cursorIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length
      this.updateCursor()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.cursorIndex = (this.cursorIndex + 1) % MENU_ITEMS.length
      this.updateCursor()
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.z)) {
      this.selectItem()
    }
  }

  private selectItem(): void {
    const item = MENU_ITEMS[this.cursorIndex]
    switch (item) {
      case 'PLAY':
        this.audioManager.stopMusic(0)
        this.scene.start('CharacterSelectScene')
        break
      case 'OPTIONS':
        this.showOptions()
        break
      case 'CREDITS':
        this.showCredits()
        break
    }
  }

  private showOptions(): void {
    this.inOverlay = true
    const bg = drawGradientPanel(this, 0, 0, 500, 300, 0x1a1a2e, 0x05050a, 0xFF4500)

    const title = this.add.text(0, -110, 'OPTIONS', {
      fontFamily: ARCADE_FONT,
      fontSize: '20px',
      color: '#FF4500',
    }).setOrigin(0.5, 0.5)

    this.optionsMusicText = this.add.text(0, -40, this.musicVolLabel(), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    this.optionsSfxText = this.add.text(0, 10, this.sfxVolLabel(), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    const hint = this.add.text(0, 80, '[M] Music Vol  [S] SFX Vol  [ESC/Z/ENTER] Close', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0.5)

    this.overlayContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [
      bg, title, this.optionsMusicText, this.optionsSfxText, hint,
    ])
  }

  private musicVolLabel(): string {
    return `[M] Music Volume: ${Math.round(this.musicVol * 100)}%`
  }

  private sfxVolLabel(): string {
    return `[S] SFX Volume: ${Math.round(this.sfxVol * 100)}%`
  }

  private updateOptionsText(): void {
    this.optionsMusicText?.setText(this.musicVolLabel())
    this.optionsSfxText?.setText(this.sfxVolLabel())
  }

  private showCredits(): void {
    this.inOverlay = true
    const bg = drawGradientPanel(this, 0, 0, 600, 200, 0x1a1a2e, 0x05050a, 0xFF4500)

    const text = this.add.text(0, -20, 'A family game for the ages.', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    const hint = this.add.text(0, 50, 'Press any key to close', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0.5)

    this.overlayContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [bg, text, hint])
  }

  private closeOverlay(): void {
    this.overlayContainer?.destroy()
    this.overlayContainer = null
    this.optionsMusicText = null
    this.optionsSfxText = null
    this.inOverlay = false
  }
}
