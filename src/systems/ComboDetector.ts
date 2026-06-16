import { MoveDefinition, RawInput } from '../types';
import { InputBuffer } from './InputBuffer';
import { MOTION_GAP_TOLERANCE } from '../constants';

export class ComboDetector {
  checkMotion(buffer: InputBuffer, motion: string[]): boolean {
    const recent = buffer.getRecent(buffer.bufferSize);
    let motionIdx = 0;
    let gapCount = 0;

    for (let i = 0; i < recent.length; i++) {
      if (motionIdx >= motion.length) break;

      const input = recent[i];
      const token = motion[motionIdx];
      const isButton = ['LIGHT', 'HEAVY', 'SPECIAL', 'METER'].includes(token);

      if (isButton) {
        const buttonKey = token.toLowerCase() as keyof Omit<RawInput, 'frame'>;
        const prevInput = i > 0 ? recent[i - 1] : null;
        const wasPressed = input[buttonKey] === true && (prevInput === null || prevInput[buttonKey] === false);
        if (wasPressed) {
          motionIdx++;
          gapCount = 0;
        } else {
          gapCount++;
          if (gapCount > MOTION_GAP_TOLERANCE && motionIdx > 0) {
            return false;
          }
        }
      } else {
        const dirs = this.getDirectionsRaw(input);
        if (dirs.includes(token)) {
          motionIdx++;
          gapCount = 0;
        } else {
          gapCount++;
          if (gapCount > MOTION_GAP_TOLERANCE && motionIdx > 0) {
            return false;
          }
        }
      }
    }

    return motionIdx >= motion.length;
  }

  detectMove(buffer: InputBuffer, moves: MoveDefinition[], facing: 'left' | 'right'): MoveDefinition | null {
    const sorted = [...moves].sort((a, b) => b.motion.length - a.motion.length);

    for (const move of sorted) {
      const adjustedMotion = this.adjustMotionForFacing(move.motion, facing);
      if (this.checkMotion(buffer, adjustedMotion)) {
        return move;
      }
    }

    return null;
  }

  private adjustMotionForFacing(motion: string[], facing: 'left' | 'right'): string[] {
    if (facing === 'right') return motion;
    return motion.map(token => {
      if (token === 'LEFT') return 'RIGHT';
      if (token === 'RIGHT') return 'LEFT';
      if (token === 'DOWN_FORWARD') return 'DOWN_BACK';
      if (token === 'DOWN_BACK') return 'DOWN_FORWARD';
      if (token === 'UP_FORWARD') return 'UP_BACK';
      if (token === 'UP_BACK') return 'UP_FORWARD';
      return token;
    });
  }

  private getDirectionsRaw(input: RawInput): string[] {
    const dirs: string[] = [];
    if (input.up && input.right) dirs.push('UP_FORWARD');
    else if (input.up && input.left) dirs.push('UP_BACK');
    else if (input.down && input.right) dirs.push('DOWN_FORWARD');
    else if (input.down && input.left) dirs.push('DOWN_BACK');
    else if (input.up) dirs.push('UP');
    else if (input.down) dirs.push('DOWN');
    else if (input.right) dirs.push('RIGHT');
    else if (input.left) dirs.push('LEFT');
    return dirs;
  }

}
