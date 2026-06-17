export class AudioManager {
  private scene: Phaser.Scene;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private musicVolume = 0.6;
  private sfxVolume = 0.8;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playMusic(key: string, loop = true): void {
    if (!this.scene.cache.audio.has(key)) return;

    if (this.currentMusic) {
      this.stopMusic(500);
      this.scene.time.delayedCall(500, () => {
        this.startMusic(key, loop);
      });
    } else {
      this.startMusic(key, loop);
    }
  }

  private startMusic(key: string, loop: boolean): void {
    if (!this.scene.cache.audio.has(key)) return;
    try {
      this.currentMusic = this.scene.sound.add(key, { loop, volume: this.musicVolume });
      this.currentMusic.play();
    } catch {
      this.currentMusic = null;
    }
  }

  stopMusic(fadeDuration = 1000): void {
    if (!this.currentMusic) return;
    const music = this.currentMusic;
    this.currentMusic = null;

    if (fadeDuration <= 0) {
      music.stop();
      music.destroy();
      return;
    }

    const soundManager = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
    if (typeof (soundManager as unknown as { setVolume?: unknown }).setVolume === 'function') {
      this.scene.tweens.add({
        targets: music,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => {
          music.stop();
          music.destroy();
        },
      });
    } else {
      music.stop();
      music.destroy();
    }
  }

  playSFX(key: string, volume?: number): void {
    if (!this.scene.cache.audio.has(key)) return;
    try {
      const sfx = this.scene.sound.add(key, { volume: volume ?? this.sfxVolume });
      sfx.play();
      sfx.once('complete', () => sfx.destroy());
    } catch {
      // silently skip if audio fails
    }
  }

  playVoiceClip(key: string, onComplete?: () => void): void {
    if (!this.scene.cache.audio.has(key)) {
      onComplete?.();
      return;
    }
    try {
      const clip = this.scene.sound.add(key, { volume: this.sfxVolume });
      clip.once('complete', () => {
        clip.destroy();
        onComplete?.();
      });
      clip.play();
    } catch {
      onComplete?.();
    }
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.currentMusic && 'setVolume' in this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSFXVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }
}
