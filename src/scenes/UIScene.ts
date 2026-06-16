import Phaser from 'phaser'
import { GAME_WIDTH, ROUNDS_TO_WIN } from '../constants'
import { VoiceLineDisplay } from '../systems/VoiceLineDisplay'

export class UIScene extends Phaser.Scene {
  // Graphics for health/meter bars
  private barGraphics!: Phaser.GameObjects.Graphics

  // Current values tracked for rendering
  private p1Health = 1
  private p2Health = 1
  private p1HealthMax = 1
  private p2HealthMax = 1
  private p1Meter = 0
  private p2Meter = 0
  // Round win indicators (circles)
  private p1WinDots: Phaser.GameObjects.Arc[] = []
  private p2WinDots: Phaser.GameObjects.Arc[] = []
  private p1WinsCount = 0
  private p2WinsCount = 0

  // Text
  private timerText!: Phaser.GameObjects.Text
  private p1NameText!: Phaser.GameObjects.Text
  private p2NameText!: Phaser.GameObjects.Text
  private announcementText!: Phaser.GameObjects.Text

  // Announcement tween tracking
  private announcementTween: Phaser.Tweens.Tween | null = null

  // Voice lines
  private voiceLineDisplay!: VoiceLineDisplay

  constructor() {
    super({ key: 'UIScene' })
  }

  create(): void {
    this.barGraphics = this.add.graphics()

    // P1 name
    this.p1NameText = this.add.text(20, 12, 'P1', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })

    // AI name (right-aligned)
    this.p2NameText = this.add.text(1260, 12, 'AI', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0)

    // Round win indicator dots — P1 side
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      const dot = this.add.circle(440 + i * 22, 30, 8, 0x444444)
      dot.setStrokeStyle(1, 0x888888)
      this.p1WinDots.push(dot)
    }

    // Round win indicator dots — AI side
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      const dot = this.add.circle(840 - i * 22, 30, 8, 0x444444)
      dot.setStrokeStyle(1, 0x888888)
      this.p2WinDots.push(dot)
    }

    // Timer text
    this.timerText = this.add.text(GAME_WIDTH / 2, 30, '99', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5)

    // Announcement text (hidden initially)
    this.announcementText = this.add.text(GAME_WIDTH / 2, 320, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '60px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0)

    // Voice line display
    this.voiceLineDisplay = new VoiceLineDisplay(this)

    // Hook into FightScene events
    this.listenToFightScene()
  }

  private listenToFightScene(): void {
    // Wait for FightScene to be available (it's launched in parallel)
    const tryConnect = () => {
      const fightScene = this.scene.get('FightScene') as Phaser.Scene & { events: Phaser.Events.EventEmitter } | null
      if (!fightScene) {
        this.time.delayedCall(100, tryConnect)
        return
      }

      fightScene.events.on('health-update', (data: { p1: number; p2: number; p1Max: number; p2Max: number }) => {
        this.p1Health = data.p1
        this.p2Health = data.p2
        this.p1HealthMax = data.p1Max
        this.p2HealthMax = data.p2Max
      })

      fightScene.events.on('meter-update', (data: { p1: number; p2: number }) => {
        this.p1Meter = data.p1
        this.p2Meter = data.p2
      })

      fightScene.events.on('timer-update', (data: { seconds: number }) => {
        void data.seconds
        this.timerText.setText(String(Math.max(0, data.seconds)))

        // Flash timer red when low
        if (data.seconds <= 10) {
          this.timerText.setColor('#FF4500')
        } else {
          this.timerText.setColor('#ffffff')
        }
      })

      fightScene.events.on('names-update', (data: { p1Name: string; p2Name: string }) => {
        this.p1NameText.setText(data.p1Name)
        this.p2NameText.setText(data.p2Name)
      })

      fightScene.events.on('round-start', (data: { roundNumber: number }) => {
        this.showAnnouncement(`ROUND ${data.roundNumber}`, 1500, '#ffffff', () => {
          this.time.delayedCall(200, () => {
            this.showAnnouncement('FIGHT!', 1000, '#FF4500')
          })
        })
      })

      fightScene.events.on('round-end', (data: { winner: string; p1Wins: number; p2Wins: number }) => {
        this.showAnnouncement('K.O.!', 2000, '#FF4500')
        // Update round indicator dots
        if (data.winner === 'player') {
          this.p1WinsCount++
          if (this.p1WinsCount - 1 < this.p1WinDots.length) {
            this.p1WinDots[this.p1WinsCount - 1].setFillStyle(0xFF4500)
          }
        } else if (data.winner === 'ai') {
          this.p2WinsCount++
          if (this.p2WinsCount - 1 < this.p2WinDots.length) {
            this.p2WinDots[this.p2WinsCount - 1].setFillStyle(0xFF4500)
          }
        }
      })

      fightScene.events.on('match-end', (data: { winner: string }) => {
        const msg = data.winner === 'player' ? 'YOU WIN!' : 'AI WINS!'
        this.showAnnouncement(msg, 3000, data.winner === 'player' ? '#22cc22' : '#dd2222')
      })

      fightScene.events.on('voice-line', (data: { text: string; x: number; y: number; color?: string }) => {
        this.voiceLineDisplay.show(data.text, data.x, data.y, data.color)
      })
    }

    tryConnect()
  }

  private getBarColor(pct: number): number {
    if (pct > 0.5) return 0x22cc22
    if (pct > 0.25) return 0xffaa00
    return 0xdd2222
  }

  private showAnnouncement(text: string, duration: number, color = '#ffffff', onDone?: () => void): void {
    // Cancel any existing announcement tween
    if (this.announcementTween) {
      this.announcementTween.stop()
      this.announcementTween = null
    }

    this.announcementText.setText(text)
    this.announcementText.setColor(color)
    this.announcementText.setAlpha(0)
    this.announcementText.setScale(0)

    // Tween in
    this.tweens.add({
      targets: this.announcementText,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold, then tween out
        this.announcementTween = this.tweens.add({
          targets: this.announcementText,
          alpha: 0,
          duration: 300,
          delay: duration,
          ease: 'Power1',
          onComplete: () => {
            this.announcementTween = null
            onDone?.()
          },
        })
      },
    })
  }

  update(): void {
    this.barGraphics.clear()

    const p1Pct = this.p1HealthMax > 0 ? this.p1Health / this.p1HealthMax : 0
    const p2Pct = this.p2HealthMax > 0 ? this.p2Health / this.p2HealthMax : 0

    // --- P1 health bar (x=20, y=30, w=400, h=24) ---
    // Background
    this.barGraphics.fillStyle(0x333333, 1)
    this.barGraphics.fillRect(20, 30, 400, 24)
    // Fill
    const p1FillW = Math.round(Math.max(0, p1Pct) * 400)
    this.barGraphics.fillStyle(this.getBarColor(p1Pct), 1)
    this.barGraphics.fillRect(20, 30, p1FillW, 24)
    // Border
    this.barGraphics.lineStyle(1, 0x888888, 1)
    this.barGraphics.strokeRect(20, 30, 400, 24)

    // --- AI health bar (x=860, y=30, w=400, h=24) — fills right to left ---
    this.barGraphics.fillStyle(0x333333, 1)
    this.barGraphics.fillRect(860, 30, 400, 24)
    const p2FillW = Math.round(Math.max(0, p2Pct) * 400)
    this.barGraphics.fillStyle(this.getBarColor(p2Pct), 1)
    // Right-to-left: fill starts at right edge
    this.barGraphics.fillRect(860 + 400 - p2FillW, 30, p2FillW, 24)
    this.barGraphics.lineStyle(1, 0x888888, 1)
    this.barGraphics.strokeRect(860, 30, 400, 24)

    // --- P1 meter bar (x=20, y=60, w=400, h=10) ---
    const p1MeterPct = Math.min(1, this.p1Meter / 100)
    this.barGraphics.fillStyle(0x222244, 1)
    this.barGraphics.fillRect(20, 60, 400, 10)
    const p1MeterW = Math.round(p1MeterPct * 400)
    this.barGraphics.fillStyle(0x4444ff, 1)
    this.barGraphics.fillRect(20, 60, p1MeterW, 10)
    this.barGraphics.lineStyle(1, 0x666699, 1)
    this.barGraphics.strokeRect(20, 60, 400, 10)

    // --- AI meter bar (x=860, y=60, w=400, h=10) — fills right to left ---
    const p2MeterPct = Math.min(1, this.p2Meter / 100)
    this.barGraphics.fillStyle(0x222244, 1)
    this.barGraphics.fillRect(860, 60, 400, 10)
    const p2MeterW = Math.round(p2MeterPct * 400)
    this.barGraphics.fillStyle(0x4444ff, 1)
    this.barGraphics.fillRect(860 + 400 - p2MeterW, 60, p2MeterW, 10)
    this.barGraphics.lineStyle(1, 0x666699, 1)
    this.barGraphics.strokeRect(860, 60, 400, 10)
  }
}
