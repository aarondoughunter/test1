import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { characterData } from '../data/characterData'
import { stageData } from '../data/stageData'
import { CHARACTER_ORDER } from '../characters/characterFactory'
import { AIDifficulty } from '../types'

const GRID_COLS = 3
const GRID_ROWS = 3
const PORTRAIT_W = 120
const PORTRAIT_H = 120
const GRID_START_X = 320
const GRID_START_Y = 130
const GRID_SPACING_X = 200
const GRID_SPACING_Y = 160

const DIFFICULTIES: AIDifficulty[] = ['easy', 'medium', 'hard']
const DIFFICULTY_LABELS = ['EASY', 'MEDIUM', 'HARD']

// Color palette for portrait backgrounds
const PORTRAIT_COLORS: Record<string, number> = {
  big_dog: 0x8B4513,
  donna: 0x800020,
  dougie: 0x003087,
  aaron: 0xC0C0C0,
  mabry: 0x00CED1,
  nate: 0x228B22,
  dulcey: 0x9400D3,
  nicole: 0xFFD700,
  kristen: 0xDC143C,
}

export class CharacterSelectScene extends Phaser.Scene {
  private cursorCol = 0
  private cursorRow = 0
  private difficultyIndex = 1 // default medium
  private portraitRects: Phaser.GameObjects.Rectangle[] = []
  private portraitBorders: Phaser.GameObjects.Rectangle[] = []
  private difficultyText!: Phaser.GameObjects.Text

  // Preview panel elements
  private previewName!: Phaser.GameObjects.Text
  private previewArchetype!: Phaser.GameObjects.Text
  private previewIntro!: Phaser.GameObjects.Text
  private previewStatBars: Phaser.GameObjects.Rectangle[] = []
  private previewStatBg: Phaser.GameObjects.Rectangle[] = []

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
    super({ key: 'CharacterSelectScene' })
  }

  get selectedIndex(): number {
    return this.cursorRow * GRID_COLS + this.cursorCol
  }

  get selectedCharId(): string {
    return CHARACTER_ORDER[this.selectedIndex]
  }

  create(): void {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111111)

    // Title
    this.add.text(GAME_WIDTH / 2, 50, 'SELECT YOUR FIGHTER', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FF4500',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5)

    // Draw 3x3 grid of portraits
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col
        if (idx >= CHARACTER_ORDER.length) continue

        const charId = CHARACTER_ORDER[idx]
        const cx = GRID_START_X + col * GRID_SPACING_X
        const cy = GRID_START_Y + row * GRID_SPACING_Y

        // Portrait background
        const rect = this.add.rectangle(cx, cy, PORTRAIT_W, PORTRAIT_H, PORTRAIT_COLORS[charId] ?? 0x444444)
        this.portraitRects.push(rect)

        // Selection border (hidden by default)
        const border = this.add.rectangle(cx, cy, PORTRAIT_W + 6, PORTRAIT_H + 6, 0xffffff)
        border.setFillStyle(0x000000, 0)
        border.setStrokeStyle(3, 0xffffff)
        border.setVisible(false)
        this.portraitBorders.push(border)

        // Character name label
        const stats = characterData[charId]
        this.add.text(cx, cy + PORTRAIT_H / 2 + 14, stats?.displayName ?? charId, {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5, 0)

        // Simple silhouette text in portrait
        this.add.text(cx, cy, stats?.displayName?.[0] ?? '?', {
          fontFamily: 'Arial Black, Arial',
          fontSize: '48px',
          fontStyle: 'bold',
          color: '#ffffff',
        }).setOrigin(0.5, 0.5).setAlpha(0.3)
      }
    }

    // Right side preview panel background
    this.add.rectangle(1050, 360, 300, 520, 0x1a1a2e)
      .setStrokeStyle(2, 0xFF4500)

    this.previewName = this.add.text(1050, 130, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FF4500',
    }).setOrigin(0.5, 0.5)

    this.previewArchetype = this.add.text(1050, 165, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0.5)

    // Stat bars (HP, Speed, Weight) — backgrounds
    const statLabels = ['HP', 'SPD', 'WGT']
    const statY = [220, 255, 290]
    this.previewStatBg = []
    this.previewStatBars = []
    for (let i = 0; i < 3; i++) {
      this.add.text(910, statY[i], statLabels[i], {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#cccccc',
      }).setOrigin(0, 0.5)

      const bg = this.add.rectangle(1020, statY[i], 160, 14, 0x333333)
      bg.setOrigin(0, 0.5)
      this.previewStatBg.push(bg)

      const bar = this.add.rectangle(1020, statY[i], 0, 14, 0x22cc22)
      bar.setOrigin(0, 0.5)
      this.previewStatBars.push(bar)
    }

    this.previewIntro = this.add.text(1050, 560, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      fontStyle: 'italic',
      color: '#cccccc',
      wordWrap: { width: 260 },
      align: 'center',
    }).setOrigin(0.5, 1)

    this.add.text(1050, 590, '(VS AI)', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5, 0)

    // Difficulty selector
    this.add.text(GAME_WIDTH / 2, 665, 'DIFFICULTY:', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    this.difficultyText = this.add.text(GAME_WIDTH / 2 + 120, 665, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '18px',
      color: '#FF4500',
    }).setOrigin(0.5, 0.5)

    // Back hint
    this.add.text(20, GAME_HEIGHT - 24, '[ESC] Back', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0, 0.5)

    // Confirm hint
    this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 24, '[Z/ENTER] Fight!', {
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

    this.refreshUI()
  }

  private refreshUI(): void {
    // Update borders
    for (let i = 0; i < this.portraitBorders.length; i++) {
      this.portraitBorders[i].setVisible(i === this.selectedIndex)
    }

    // Update difficulty text
    this.difficultyText.setText(DIFFICULTY_LABELS[this.difficultyIndex])

    // Update preview panel
    const charId = this.selectedCharId
    const stats = characterData[charId]
    if (!stats) return

    this.previewName.setText(stats.displayName)
    this.previewName.setColor(stats.color)

    // Archetype derived from stats
    const archetype = this.getArchetypeLabel(charId, stats.walkSpeed, stats.weight)
    this.previewArchetype.setText(archetype)

    // Stat bars - normalize within known ranges
    // HP: 820-1200, Speed: 180-300, Weight: 4-10
    const hpPct = (stats.maxHealth - 820) / (1200 - 820)
    const spdPct = (stats.walkSpeed - 180) / (300 - 180)
    const wgtPct = (stats.weight - 4) / (10 - 4)

    const pcts = [hpPct, spdPct, wgtPct]
    const barColors = [0x22cc22, 0x4488ff, 0xff8800]
    for (let i = 0; i < 3; i++) {
      const fillW = Math.round(Math.max(4, pcts[i] * 160))
      this.previewStatBars[i].setSize(fillW, 14)
      this.previewStatBars[i].setFillStyle(barColors[i])
    }

    this.previewIntro.setText(`"${stats.introLine}"`)
  }

  private getArchetypeLabel(id: string, speed: number, weight: number): string {
    if (weight >= 9) return 'Heavy Bruiser'
    if (weight <= 4) return 'Speed Demon'
    if (speed >= 260) return 'Fast Striker'
    if (id === 'nate' || id === 'dulcey') return 'Zoner'
    if (id === 'donna') return 'Balanced Brawler'
    return 'All-Rounder'
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
      if (this.keys.esc.isDown) {
        // When esc is held, treat left as difficulty change
        return
      }
      this.cursorCol = (this.cursorCol - 1 + GRID_COLS) % GRID_COLS
      this.refreshUI()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.cursorCol = (this.cursorCol + 1) % GRID_COLS
      this.refreshUI()
    }

    // Difficulty change (left/right when holding nothing else at bottom)
    if (Phaser.Input.Keyboard.JustDown(this.keys.left) && this.cursorRow === GRID_ROWS - 1 && this.cursorCol === 0) {
      // Handled above
    }

    // Dedicated difficulty cycling with < > (comma/period) or just use separate keys if needed
    // For simplicity, use Q/E for difficulty
    const qKey = this.input.keyboard!.addKey('Q')
    const eKey = this.input.keyboard!.addKey('E')
    if (Phaser.Input.Keyboard.JustDown(qKey)) {
      this.difficultyIndex = (this.difficultyIndex - 1 + DIFFICULTIES.length) % DIFFICULTIES.length
      this.difficultyText.setText(DIFFICULTY_LABELS[this.difficultyIndex])
    }
    if (Phaser.Input.Keyboard.JustDown(eKey)) {
      this.difficultyIndex = (this.difficultyIndex + 1) % DIFFICULTIES.length
      this.difficultyText.setText(DIFFICULTY_LABELS[this.difficultyIndex])
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this.scene.start('MainMenuScene')
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.z)) {
      this.confirmSelection()
    }
  }

  private confirmSelection(): void {
    const playerCharId = this.selectedCharId
    const difficulty = DIFFICULTIES[this.difficultyIndex]

    // Pick a random AI character that's not the player character
    const others = CHARACTER_ORDER.filter(id => id !== playerCharId)
    const aiCharId = others[Math.floor(Math.random() * others.length)]

    // Pick a random stage
    const stage = stageData[Math.floor(Math.random() * stageData.length)]

    this.registry.set('playerCharId', playerCharId)
    this.registry.set('aiCharId', aiCharId)
    this.registry.set('difficulty', difficulty)
    this.registry.set('stageId', stage.id)

    this.scene.stop('MainMenuScene')
    this.scene.start('FightScene')
  }
}
