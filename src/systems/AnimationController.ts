import Phaser from 'phaser'
import { CharacterState } from '../types'
import { getPoseFrames } from './CharacterArtRegistry'

// Maps each character state to the pose-frame set it should display.
// States with no entry leave the sprite's current frame untouched.
const STATE_POSE_MAP: Partial<Record<CharacterState, string>> = {
  IDLE: 'idle',
  WALK_FORWARD: 'walk_fwd',
  WALK_BACK: 'walk_back',
  CROUCH: 'crouch',
  JUMP: 'jump',
  JUMP_FORWARD: 'jump',
  JUMP_BACK: 'jump',
  ATTACK_LIGHT: 'attack_light',
  ATTACK_HEAVY: 'attack_heavy',
  ATTACK_SPECIAL_1: 'special1',
  ATTACK_SPECIAL_2: 'special2',
  ATTACK_SPECIAL_3: 'special3',
  HIT_STUN: 'hitstun',
  BLOCK_STUN: 'hitstun',
  KNOCKDOWN: 'knockdown',
  DEFEATED: 'knockdown',
  VICTORY: 'victory',
  INTRO: 'intro',
  FINALE_CHARGE: 'finale',
  FINALE_ACTIVE: 'finale',
}

// Poses that should loop continuously rather than play once and hold the last frame.
const LOOPING_POSES = new Set(['idle', 'walk_fwd', 'walk_back'])

export class AnimationController {
  private scene: Phaser.Scene
  private characterId: string
  private sprite: Phaser.GameObjects.Sprite
  private currentPoseKey: string | null = null

  constructor(scene: Phaser.Scene, characterId: string, sprite: Phaser.GameObjects.Sprite) {
    this.scene = scene
    this.characterId = characterId
    this.sprite = sprite
  }

  playForState(state: CharacterState): void {
    const poseKey = STATE_POSE_MAP[state]
    if (!poseKey) return
    this.playPose(poseKey)
  }

  playFinalePose(): void {
    this.playPose('finale')
  }

  private playPose(poseKey: string): void {
    const frames = getPoseFrames(this.scene, this.characterId, poseKey)
    if (frames.length === 0) return

    const animKey = `${this.characterId}_${poseKey}`
    if (this.currentPoseKey === poseKey && this.sprite.anims.isPlaying) return
    this.currentPoseKey = poseKey

    if (frames.length === 1) {
      this.sprite.anims.stop()
      this.sprite.setTexture(frames[0])
      return
    }

    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: frames.map(key => ({ key })),
        frameRate: 6,
        repeat: LOOPING_POSES.has(poseKey) ? -1 : 0,
      })
    }
    this.sprite.play(animKey)
  }
}
