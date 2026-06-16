import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    this.scale.scaleMode = Phaser.Scale.FIT
    this.scale.autoCenter = Phaser.Scale.CENTER_BOTH
    this.scene.start('PreloadScene')
  }
}
