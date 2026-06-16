import { RawInput } from '../types';
import { INPUT_BUFFER_FRAMES } from '../constants';

export class InputBuffer {
  private buffer: RawInput[] = [];
  private currentFrame = 0;
  readonly bufferSize = INPUT_BUFFER_FRAMES;

  record(input: RawInput): void {
    this.currentFrame = input.frame;
    this.buffer.push(input);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  justPressed(button: keyof Omit<RawInput, 'frame'>): boolean {
    if (this.buffer.length < 2) return false;
    const last = this.buffer[this.buffer.length - 1];
    const prev = this.buffer[this.buffer.length - 2];
    return last[button] === true && prev[button] === false;
  }

  isHeld(button: keyof Omit<RawInput, 'frame'>): boolean {
    if (this.buffer.length === 0) return false;
    return this.buffer[this.buffer.length - 1][button] === true;
  }

  getRecent(n: number): RawInput[] {
    return this.buffer.slice(-n);
  }

  get latest(): RawInput {
    if (this.buffer.length === 0) {
      return { up: false, down: false, left: false, right: false, light: false, heavy: false, special: false, meter: false, frame: 0 };
    }
    return this.buffer[this.buffer.length - 1];
  }

  get frame(): number {
    return this.currentFrame;
  }
}
