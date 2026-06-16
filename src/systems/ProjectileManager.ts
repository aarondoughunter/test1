import { ProjectileData } from '../types';
import { GRAVITY } from '../constants';

export class ProjectileManager {
  private projectiles: ProjectileData[] = [];
  private nextId = 0;
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
  }

  spawn(data: Omit<ProjectileData, 'id' | 'hitRegistered'>): string {
    const id = `proj_${this.nextId++}`;
    this.projectiles.push({ ...data, id, hitRegistered: false });
    return id;
  }

  update(delta: number): void {
    const dt = delta / 1000;
    const gravityAccel = GRAVITY * 0.3 * dt;

    this.projectiles = this.projectiles.filter(p => {
      if (p.hitRegistered) return false;
      p.x += p.vx * dt;
      p.vy += gravityAccel;
      p.y += p.vy * dt;
      p.lifetime -= 1;
      return p.lifetime > 0;
    });

    this.render();
  }

  private render(): void {
    this.graphics.clear();
    for (const p of this.projectiles) {
      this.graphics.fillStyle(p.color, 1);
      this.graphics.fillCircle(p.x, p.y, p.radius);
    }
  }

  checkHit(
    ownerId: string,
    targetX: number,
    targetY: number,
    targetW: number,
    targetH: number
  ): ProjectileData | null {
    for (const p of this.projectiles) {
      if (p.ownerId === ownerId || p.hitRegistered) continue;

      const closestX = Math.max(targetX, Math.min(p.x, targetX + targetW));
      const closestY = Math.max(targetY, Math.min(p.y, targetY + targetH));
      const dx = p.x - closestX;
      const dy = p.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq <= p.radius * p.radius) {
        p.hitRegistered = true;
        return p;
      }
    }
    return null;
  }

  removeProjectile(id: string): void {
    this.projectiles = this.projectiles.filter(p => p.id !== id);
  }

  clearOwner(ownerId: string): void {
    this.projectiles = this.projectiles.filter(p => p.ownerId !== ownerId);
  }

  destroy(): void {
    this.graphics.destroy();
    this.projectiles = [];
  }
}
