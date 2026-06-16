import { TrapData } from '../types';

export class TrapManager {
  private traps: TrapData[] = [];
  private nextId = 0;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(9);
  }

  placeTrap(data: Omit<TrapData, 'id' | 'armed' | 'armingTimer' | 'triggered' | 'triggerTimer'>): string {
    const id = `trap_${this.nextId++}`;
    this.traps.push({
      ...data,
      id,
      armed: data.delayFrames === 0,
      armingTimer: data.delayFrames,
      triggered: false,
      triggerTimer: 0,
    });
    return id;
  }

  countTrapsBy(ownerId: string): number {
    return this.traps.filter(t => t.ownerId === ownerId).length;
  }

  update(_delta: number, targetX: number, targetY: number): TrapData | null {
    let triggered: TrapData | null = null;

    this.traps = this.traps.filter(trap => {
      if (trap.triggered) return false;

      if (!trap.armed) {
        trap.armingTimer--;
        if (trap.armingTimer <= 0) {
          trap.armed = true;
        }
        return true;
      }

      if (trap.delayFrames === 0) {
        const dx = targetX - trap.x;
        const dy = targetY - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= trap.triggerRadius) {
          trap.triggered = true;
          triggered = trap;
          return false;
        }
      } else {
        if (trap.triggerTimer > 0) {
          trap.triggerTimer--;
          if (trap.triggerTimer <= 0) {
            trap.triggered = true;
            triggered = trap;
            return false;
          }
        } else {
          const dx = targetX - trap.x;
          const dy = targetY - trap.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= trap.triggerRadius) {
            trap.triggerTimer = trap.delayFrames;
          }
        }
      }

      return true;
    });

    this.render();
    return triggered;
  }

  clearOwner(ownerId: string): void {
    this.traps = this.traps.filter(t => t.ownerId !== ownerId);
  }

  render(): void {
    this.graphics.clear();
    for (const trap of this.traps) {
      if (!trap.armed) {
        this.graphics.fillStyle(0x888800, 0.5);
      } else {
        this.graphics.fillStyle(0xffff00, 0.9);
      }
      this.graphics.fillCircle(trap.x, trap.y, 8);

      this.graphics.lineStyle(2, 0xffff00, 1);
      this.graphics.strokeCircle(trap.x, trap.y, trap.triggerRadius);
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.traps = [];
  }
}
