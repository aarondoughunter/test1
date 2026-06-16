import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { AudioManager } from '../systems/AudioManager'
import { characterData } from '../data/characterData'

const MENU_ITEMS = ['REMATCH', 'CHARACTER SELECT', 'MAIN MENU']
const MENU_Y = [500, 550, 600]

export class VictoryScene extends Phaser.Scene {
  private audioManager!: AudioManager
  private cursorIndex = 0
  private cursorText!: Phaser.GameObjects.Text
  private menuTexts: Phaser.GameObjects.Text[] = []
  private keys!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    enter: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
  }

  constructor() {
    super({ key: 'VictoryScene' })
  }

  create(): void {
    this.audioManager = new AudioManager(this)

    const matchWinner = (this.registry.get('matchWinner') as string) ?? 'ai'
    const p1Wins = (this.registry.get('p1Wins') as number) ?? 0
    const p2Wins = (this.registry.get('p2Wins') as number) ?? 0
    const playerCharId = (this.registry.get('playerCharId') as string) ?? 'aaron'
    const aiCharId = (this.registry.get('aiCharId') as string) ?? 'big_dog'

    const playerStats = characterData[playerCharId]
    const aiStats = characterData[aiCharId]

    // Dark background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050510)

    // Winner banner
    const isPlayerWin = matchWinner === 'player'
    const winnerText = isPlayerWin ? 'PLAYER WINS!' : 'AI WINS!'
    const winnerColor = isPlayerWin ? '#22cc22' : '#dd2222'
    const winnerCharColor = isPlayerWin
      ? (playerStats?.color ?? '#ffffff')
      : (aiStats?.color ?? '#ffffff')

    this.add.text(GAME_WIDTH / 2, 200, winnerText, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '64px',
      fontStyle: 'bold',
      color: winnerColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5)

    // Winning character name
    const winnerName = isPlayerWin
      ? (playerStats?.displayName ?? playerCharId)
      : (aiStats?.displayName ?? aiCharId)

    this.add.text(GAME_WIDTH / 2, 280, winnerName, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: winnerCharColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5)

    // Victory voice line
    const winnerCharStats = isPlayerWin ? playerStats : aiStats
    const victoryLine = winnerCharStats?.victoryLine ?? winnerCharStats?.voiceLines?.[0] ?? '...'

    this.add.text(GAME_WIDTH / 2, 340, `"${victoryLine}"`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'italic',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: 800 },
      align: 'center',
    }).setOrigin(0.5, 0.5)

    // Round breakdown
    const playerDisplayName = playerStats?.displayName ?? 'Player'
    const aiDisplayName = aiStats?.displayName ?? 'AI'
    this.add.text(GAME_WIDTH / 2, 420, `Round wins: ${playerDisplayName} ${p1Wins} – ${aiDisplayName} ${p2Wins}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5)

    // Menu items
    this.menuTexts = []
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const t = this.add.text(GAME_WIDTH / 2, MENU_Y[i], MENU_ITEMS[i], {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5, 0.5)
      this.menuTexts.push(t)
    }

    // Cursor
    this.cursorText = this.add.text(0, 0, '▶', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FF4500',
    }).setOrigin(0.5, 0.5)

    this.cursorIndex = 0
    this.updateCursor()

    // Keys
    this.keys = this.input.keyboard!.addKeys({
      up: 'UP',
      down: 'DOWN',
      enter: 'ENTER',
      z: 'Z',
    }) as typeof this.keys

    // Play victory music
    this.audioManager.playMusic('victory_theme')
  }

  private updateCursor(): void {
    const mx = GAME_WIDTH / 2 - 130
    const my = MENU_Y[this.cursorIndex]
    this.cursorText.setPosition(mx, my)

    for (let i = 0; i < this.menuTexts.length; i++) {
      this.menuTexts[i].setColor(i === this.cursorIndex ? '#FF4500' : '#ffffff')
    }
  }

  update(): void {
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
    this.audioManager.stopMusic(0)
    switch (this.cursorIndex) {
      case 0: // REMATCH
        this.scene.start('FightScene')
        break
      case 1: // CHARACTER SELECT
        this.scene.start('CharacterSelectScene')
        break
      case 2: // MAIN MENU
        this.scene.start('MainMenuScene')
        break
    }
  }
}
