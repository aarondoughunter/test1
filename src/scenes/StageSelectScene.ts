import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, ARCADE_FONT } from '../constants'
import { stageData } from '../data/stageData'
import { characterData } from '../data/characterData'
import { addScanlineOverlay, addVignette, drawGradientPanel, addTitleGlow } from '../utils/ArcadeChrome'

const GRID_COLS = 3
const GRID_ROWS = 3
const TILE_W = 160
const TILE_H = 110
const GRID_START_X = 280
const GRID_START_Y = 150
const GRID_SPACING_X = 220
const GRID_SPACING_Y = 170

export class StageSelectScene extends Phaser.Scene {
  private cursorCol = 0
  private cursorRow = 0
  private tileBorders: Phaser.GameObjects.Rectangle[] = []

  private previewName!: Phaser.GameObjects.Text
  private previewSubtitle!: Phaser.GameObjects.Text
  private previewImage: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | null = null

  private keys!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    enter: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
    esc: Phaser.Input.Keyboard.Key
  }

  constructor() {
    super({ key: 'StageSelectScene' })
  }

  get selectedIndex(): number {
    return this.cursorRow * GRID_COLS + this.cursorCol
  }

  get selectedStage() {
    return stageData[this.selectedIndex]
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111111)

    const title = this.add.text(GAME_WIDTH / 2, 50, 'SELECT YOUR ARENA', {
      fontFamily: ARCADE_FONT,
      fontSize: '26px',
      color: '#FF4500',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5)
    addTitleGlow(title)

    // Pre-select the stage matching the just-picked character, if any
    const playerCharId = this.registry.get('playerCharId') as string | undefined
    const homeIndex = stageData.findIndex(s => s.characterId === playerCharId)
    if (homeIndex >= 0) {
      this.cursorRow = Math.floor(homeIndex / GRID_COLS)
      this.cursorCol = homeIndex % GRID_COLS
    }

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col
        if (idx >= stageData.length) continue

        const stage = stageData[idx]
        const cx = GRID_START_X + col * GRID_SPACING_X
        const cy = GRID_START_Y + row * GRID_SPACING_Y

        if (stage.backgroundKey && this.textures.exists(stage.backgroundKey)) {
          this.add.image(cx, cy, stage.backgroundKey).setDisplaySize(TILE_W, TILE_H)
        } else {
          this.add.rectangle(cx, cy, TILE_W, TILE_H, stage.skyColor)
          this.add.rectangle(cx, cy + TILE_H / 2 - 6, TILE_W, 12, stage.groundColor)
        }

        const border = this.add.rectangle(cx, cy, TILE_W + 6, TILE_H + 6, 0xffffff)
        border.setFillStyle(0x000000, 0)
        border.setStrokeStyle(3, 0xffffff)
        border.setVisible(false)
        this.tileBorders.push(border)

        this.add.text(cx, cy + TILE_H / 2 + 12, stage.name, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          wordWrap: { width: TILE_W },
          align: 'center',
        }).setOrigin(0.5, 0)
      }
    }

    // Preview panel
    drawGradientPanel(this, 1080, 360, 280, 380, 0x1a1a2e, 0x05050a, 0xFF4500)

    this.previewName = this.add.text(1080, 220, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FF4500',
      wordWrap: { width: 240 },
      align: 'center',
    }).setOrigin(0.5, 0.5)

    this.previewSubtitle = this.add.text(1080, 480, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaaa',
      wordWrap: { width: 240 },
      align: 'center',
    }).setOrigin(0.5, 0.5)

    this.add.text(20, GAME_HEIGHT - 24, '[ESC] Back', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0, 0.5)

    this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 24, '[Z/ENTER] Confirm', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(1, 0.5)

    this.keys = this.input.keyboard!.addKeys({
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      enter: 'ENTER',
      z: 'Z',
      esc: 'ESC',
    }) as typeof this.keys

    addVignette(this)
    addScanlineOverlay(this)

    this.refreshUI()
  }

  private refreshUI(): void {
    for (let i = 0; i < this.tileBorders.length; i++) {
      this.tileBorders[i].setVisible(i === this.selectedIndex)
    }

    const stage = this.selectedStage
    this.previewName.setText(stage.name)

    this.previewImage?.destroy()
    this.previewImage = null
    if (stage.backgroundKey && this.textures.exists(stage.backgroundKey)) {
      this.previewImage = this.add.image(1080, 330, stage.backgroundKey).setDisplaySize(240, 160)
    } else {
      this.previewImage = this.add.rectangle(1080, 330, 240, 160, stage.skyColor)
    }

    const homeChar = stage.characterId ? characterData[stage.characterId] : undefined
    this.previewSubtitle.setText(homeChar ? `Home turf of ${homeChar.displayName}` : '')
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.cursorRow = (this.cursorRow - 1 + GRID_ROWS) % GRID_ROWS
      this.refreshUI()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.cursorRow = (this.cursorRow + 1) % GRID_ROWS
      this.refreshUI()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      this.cursorCol = (this.cursorCol - 1 + GRID_COLS) % GRID_COLS
      this.refreshUI()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.cursorCol = (this.cursorCol + 1) % GRID_COLS
      this.refreshUI()
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this.scene.start('CharacterSelectScene')
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.z)) {
      this.registry.set('stageId', this.selectedStage.id)
      this.scene.start('IntroCinematicScene')
    }
  }
}
