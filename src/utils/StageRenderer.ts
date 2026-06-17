import Phaser from 'phaser'
import { StageData } from '../types'
import * as C from '../constants'

// Shared between FightScene and IntroCinematicScene so both render the same
// stage consistently — real background image if loaded, vector fallback otherwise.
export interface StageRenderHandle {
  graphics: Phaser.GameObjects.Graphics
  backgroundImage: Phaser.GameObjects.Image | null
}

export function createStageRenderHandle(scene: Phaser.Scene): StageRenderHandle {
  return { graphics: scene.add.graphics(), backgroundImage: null }
}

export function drawStage(scene: Phaser.Scene, handle: StageRenderHandle, stage: StageData): void {
  if (stage.backgroundKey && scene.textures.exists(stage.backgroundKey)) {
    handle.graphics.clear()
    handle.backgroundImage?.destroy()
    handle.backgroundImage = scene.add.image(640, 360, stage.backgroundKey).setDisplaySize(1280, 720)
    handle.backgroundImage.setDepth(-1)
    return
  }

  handle.backgroundImage?.destroy()
  handle.backgroundImage = null

  const g = handle.graphics
  g.clear()

  // Sky gradient simulation (two-tone)
  g.fillStyle(stage.skyColor, 1)
  g.fillRect(0, 0, 1280, 400)

  // Darker mid-ground band
  const midColor = Phaser.Display.Color.IntegerToColor(stage.skyColor)
  midColor.darken(20)
  g.fillStyle(midColor.color, 1)
  g.fillRect(0, 380, 1280, 120)

  // Ground
  g.fillStyle(stage.groundColor, 1)
  g.fillRect(0, C.FLOOR_Y, 1280, 720 - C.FLOOR_Y)

  // Ground accent stripe
  g.fillStyle(stage.accentColor, 1)
  g.fillRect(0, C.FLOOR_Y, 1280, 8)

  // Simple background pillars/elements for depth
  const pillarColor = Phaser.Display.Color.IntegerToColor(stage.skyColor)
  pillarColor.darken(30)
  g.fillStyle(pillarColor.color, 0.6)
  for (let i = 0; i < 5; i++) {
    const px = 100 + i * 280
    g.fillRect(px, 200, 40, 180)
  }

  // Floor line
  g.lineStyle(3, 0xffffff, 0.8)
  g.lineBetween(C.STAGE_LEFT_BOUND, C.FLOOR_Y, C.STAGE_RIGHT_BOUND, C.FLOOR_Y)

  // Stage edge shadows
  g.fillStyle(0x000000, 0.3)
  g.fillRect(0, 0, C.STAGE_LEFT_BOUND, 720)
  g.fillRect(C.STAGE_RIGHT_BOUND, 0, 1280 - C.STAGE_RIGHT_BOUND, 720)
}
