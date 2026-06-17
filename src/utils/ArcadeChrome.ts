import Phaser from 'phaser'

// Reusable arcade-cabinet visual chrome: scanlines, vignettes, gradient panels,
// title glow, and a chase-light marquee border. Pure presentation, no game-state coupling.

export interface ScanlineOptions {
  alpha?: number
  lineSpacing?: number
  color?: number
  depth?: number
}

export function addScanlineOverlay(scene: Phaser.Scene, opts: ScanlineOptions = {}): Phaser.GameObjects.Graphics {
  const { alpha = 0.06, lineSpacing = 4, color = 0x000000, depth = 1000 } = opts
  const width = scene.cameras.main.width
  const height = scene.cameras.main.height

  const g = scene.add.graphics()
  g.setDepth(depth)
  g.fillStyle(color, alpha)
  for (let y = 0; y < height; y += lineSpacing) {
    g.fillRect(0, y, width, 1)
  }
  return g
}

export interface VignetteOptions {
  color?: number
  alpha?: number
  thickness?: number
  depth?: number
}

// Darkens the screen edges. Generalizes the low-HP edge-vignette already used in UIScene.
export function addVignette(scene: Phaser.Scene, opts: VignetteOptions = {}): Phaser.GameObjects.Graphics {
  const { color = 0x000000, alpha = 0.55, thickness = 140, depth = 999 } = opts
  const width = scene.cameras.main.width
  const height = scene.cameras.main.height

  const g = scene.add.graphics()
  g.setDepth(depth)
  g.fillGradientStyle(color, color, color, color, alpha, alpha, 0, 0)
  g.fillRect(0, 0, width, thickness)
  g.fillGradientStyle(color, color, color, color, 0, 0, alpha, alpha)
  g.fillRect(0, height - thickness, width, thickness)
  g.fillGradientStyle(color, color, color, color, alpha, 0, alpha, 0)
  g.fillRect(0, 0, thickness, height)
  g.fillGradientStyle(color, color, color, color, 0, alpha, 0, alpha)
  g.fillRect(width - thickness, 0, thickness, height)
  return g
}

// Lightens (positive percent) or darkens (negative percent) a 0xRRGGBB color.
export function shadeColor(color: number, percent: number): number {
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff
  const adjust = (channel: number) =>
    percent >= 0
      ? Math.round(channel + (255 - channel) * percent)
      : Math.round(channel * (1 + percent))
  return (adjust(r) << 16) | (adjust(g) << 8) | adjust(b)
}

// Gradient-filled panel with an inner glossy bevel line and an outer accent border —
// drop-in replacement for the flat-color `add.rectangle` panels used across menu/UI scenes.
export function drawGradientPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  colorTop: number,
  colorBottom: number,
  borderColor = 0xFF4500
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics()
  g.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1)
  g.fillRect(x - w / 2, y - h / 2, w, h)
  g.lineStyle(2, 0xffffff, 0.15)
  g.strokeRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6)
  g.lineStyle(2, borderColor, 1)
  g.strokeRect(x - w / 2, y - h / 2, w, h)
  return g
}

// Adds an outer glow to a text/game object via Phaser's WebGL post-pipeline.
// No-ops harmlessly if the renderer doesn't support FX (e.g. some headless test contexts).
export function addTitleGlow(target: Phaser.GameObjects.GameObject & { postFX?: Phaser.GameObjects.Components.FX }, color = 0xFF4500, strength = 4): void {
  target.postFX?.addGlow(color, strength, 0, false, 0.1, 16)
}

export interface ChaseLightOptions {
  lightCount?: number
  speed?: number
  colorOn?: number
  colorOff?: number
  radius?: number
}

// Animated marquee-style chase lights running clockwise around a rectangle's perimeter.
export function addChaseLightBorder(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: ChaseLightOptions = {}
): Phaser.GameObjects.Arc[] {
  const { lightCount = 24, speed = 1500, colorOn = 0xFFD700, colorOff = 0x442200, radius = 4 } = opts

  const lights: Phaser.GameObjects.Arc[] = []
  for (let i = 0; i < lightCount; i++) {
    const t = i / lightCount
    const { px, py } = pointOnRectPerimeter(x, y, w, h, t)
    lights.push(scene.add.circle(px, py, radius, colorOff))
  }

  scene.tweens.addCounter({
    from: 0,
    to: lightCount,
    duration: speed,
    repeat: -1,
    onUpdate: tween => {
      const head = tween.getValue() ?? 0
      lights.forEach((light, i) => {
        const dist = (i - head + lightCount * 2) % lightCount
        light.setFillStyle(dist < 3 ? colorOn : colorOff)
      })
    },
  })

  return lights
}

function pointOnRectPerimeter(cx: number, cy: number, w: number, h: number, t: number): { px: number; py: number } {
  const perimeter = 2 * (w + h)
  let d = (t * perimeter) % perimeter
  const left = cx - w / 2
  const top = cy - h / 2

  if (d <= w) return { px: left + d, py: top }
  d -= w
  if (d <= h) return { px: left + w, py: top + d }
  d -= h
  if (d <= w) return { px: left + w - d, py: top + h }
  d -= w
  return { px: left, py: top + h - d }
}
