export class DebugOverlay {
  private enabled = false;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(8, 8, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 4 },
    });
    this.text.setDepth(1000);
    this.text.setScrollFactor(0);
    this.text.setVisible(false);
  }

  toggle(): void {
    this.enabled = !this.enabled;
    this.text.setVisible(this.enabled);
    if (!this.enabled) {
      this.text.setText('');
    }
  }

  update(data: Record<string, string | number>): void {
    if (!this.enabled) return;
    const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
    this.text.setText(lines);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
