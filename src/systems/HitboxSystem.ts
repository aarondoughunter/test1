import { HitboxFrame, HitboxRect } from '../types';

export interface ActiveHitbox {
  frame: HitboxFrame;
  worldX: number;
  worldY: number;
  facing: 'left' | 'right';
  ownerId: string;
  hitRegistered: boolean;
}

export class HitboxSystem {
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private debugEnabled = false;

  toggleDebug(scene: Phaser.Scene): void {
    this.debugEnabled = !this.debugEnabled;
    if (this.debugEnabled) {
      this.debugGraphics = scene.add.graphics();
      this.debugGraphics.setDepth(999);
    } else {
      this.debugGraphics?.destroy();
      this.debugGraphics = null;
    }
  }

  update(
    attacker: ActiveHitbox | null,
    defenderHurtbox: HitboxRect,
    defenderWorldX: number,
    defenderWorldY: number,
    defenderFacing: 'left' | 'right',
    defenderIsBlocking: boolean,
    defenderIsCrouching: boolean
  ): 'hit' | 'blocked' | 'miss' {
    if (!attacker || attacker.hitRegistered) return 'miss';

    const attackRect = this.getWorldRect(
      attacker.frame.hitbox,
      attacker.worldX,
      attacker.worldY,
      attacker.facing
    );
    const defendRect = this.getWorldRect(
      defenderHurtbox,
      defenderWorldX,
      defenderWorldY,
      defenderFacing
    );

    if (!this.overlaps(attackRect, defendRect)) return 'miss';

    if (defenderIsBlocking && (attacker.frame.blockable !== false)) {
      const attackType = attacker.frame.type;
      if (attackType === 'low' && defenderIsCrouching) return 'blocked';
      if (attackType === 'high' && !defenderIsCrouching) return 'blocked';
      if (attackType === 'overhead' && !defenderIsCrouching) return 'blocked';
    }

    return 'hit';
  }

  getWorldRect(
    hb: HitboxRect,
    worldX: number,
    worldY: number,
    facing: 'left' | 'right'
  ): { x: number; y: number; w: number; h: number } {
    const x = facing === 'right'
      ? worldX + hb.x
      : worldX - hb.x - hb.w;
    return { x, y: worldY + hb.y, w: hb.w, h: hb.h };
  }

  private overlaps(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  drawDebug(
    attackerHitbox: ActiveHitbox | null,
    defenderHurtbox: HitboxRect,
    defenderWorldX: number,
    defenderWorldY: number,
    defenderFacing: 'left' | 'right'
  ): void {
    if (!this.debugEnabled || !this.debugGraphics) return;

    this.debugGraphics.clear();

    const defRect = this.getWorldRect(defenderHurtbox, defenderWorldX, defenderWorldY, defenderFacing);
    this.debugGraphics.lineStyle(2, 0x00ff00, 1);
    this.debugGraphics.strokeRect(defRect.x, defRect.y, defRect.w, defRect.h);

    if (attackerHitbox) {
      const atkRect = this.getWorldRect(
        attackerHitbox.frame.hitbox,
        attackerHitbox.worldX,
        attackerHitbox.worldY,
        attackerHitbox.facing
      );
      this.debugGraphics.lineStyle(2, 0xff0000, 1);
      this.debugGraphics.strokeRect(atkRect.x, atkRect.y, atkRect.w, atkRect.h);
    }
  }
}
