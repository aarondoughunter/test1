import { VOICE_LINE_DURATION } from '../constants';

export class VoiceLineDisplay {
  private scene: Phaser.Scene;
  private activeLines: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(text: string, x: number, y: number, color = '#ffffff'): void {
    const label = this.scene.add.text(x, y - 80, text, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    label.setOrigin(0.5, 1);
    label.setDepth(100);

    this.activeLines.push(label);

    this.scene.tweens.add({
      targets: label,
      y: label.y - 30,
      alpha: 0,
      duration: VOICE_LINE_DURATION,
      ease: 'Power1',
      onComplete: () => {
        label.destroy();
        this.activeLines = this.activeLines.filter(l => l !== label);
      },
    });
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
