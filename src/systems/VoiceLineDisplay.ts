import { VOICE_LINE_DURATION } from '../constants';

export class VoiceLineDisplay {
  private scene: Phaser.Scene;
  private activeLines: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(text: string, x: number, y: number, color = '#ffffff'): void {
    const colorNum = parseInt(color.replace('#', ''), 16)
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x000000, 0.75)
    const padding = 12
    const textObj = this.scene.add.text(x, y - 80, text, {
      fontSize: '18px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(30)

    const bounds = textObj.getBounds()
    bg.fillRoundedRect(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2, 8)
    bg.lineStyle(2, colorNum, 1)
    bg.strokeRoundedRect(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2, 8)
    bg.setDepth(29)

    this.activeLines.push(textObj)

    this.scene.tweens.add({
      targets: [textObj, bg],
      y: `-=25`,
      alpha: { from: 1, to: 0 },
      duration: VOICE_LINE_DURATION,
      ease: 'Quad.easeIn',
      onComplete: () => {
        textObj.destroy()
        bg.destroy()
        this.activeLines = this.activeLines.filter(t => t !== textObj)
      },
    })
  }

  update(): void {
    this.activeLines = this.activeLines.filter(l => l.active);
  }

  destroy(): void {
    for (const line of this.activeLines) {
      line.destroy();
    }
    this.activeLines = [];
  }
}
