import Phaser from 'phaser'

// How many frames each pose has, per the asset manifest. Used by PreloadScene to
// queue every expected texture up front — missing files just 404 quietly and the
// corresponding pose stays unavailable, so dropping art in later requires no code change.
export const POSE_FRAME_COUNTS: Record<string, number> = {
  idle: 2,
  walk_fwd: 2,
  walk_back: 2,
  crouch: 1,
  jump: 2,
  attack_light: 2,
  attack_heavy: 3,
  special1: 3,
  special2: 3,
  special3: 3,
  hitstun: 1,
  knockdown: 2,
  victory: 2,
  intro: 1,
  finale: 2,
}

export function hasArt(scene: Phaser.Scene, characterId: string): boolean {
  return scene.textures.exists(`${characterId}_idle_0`)
}

export function getPoseFrames(scene: Phaser.Scene, characterId: string, poseKey: string): string[] {
  const frames: string[] = []
  let i = 0
  while (scene.textures.exists(`${characterId}_${poseKey}_${i}`)) {
    frames.push(`${characterId}_${poseKey}_${i}`)
    i++
  }
  return frames
}

// Source pose art is authored at a fixed canvas size (512x768) that's much taller than any
// in-game character footprint. Scales a freshly-created sprite down to the intended on-screen height.
export function applyArtScale(sprite: Phaser.GameObjects.Sprite, targetHeight: number): void {
  if (sprite.height > 0) {
    sprite.setScale(targetHeight / sprite.height)
  }
}
