import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from './constants'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { CharacterSelectScene } from './scenes/CharacterSelectScene'
import { FightScene } from './scenes/FightScene'
import { UIScene } from './scenes/UIScene'
import { VictoryScene } from './scenes/VictoryScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  backgroundColor: '#111111',
  render: {
    pixelArt: false,
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, MainMenuScene, CharacterSelectScene, FightScene, UIScene, VictoryScene],
}

new Phaser.Game(config)
