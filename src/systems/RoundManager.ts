import { RoundResult } from '../types';
import { ROUND_TIME_SECONDS, ROUNDS_TO_WIN, KO_SLOWMO_SCALE, KO_SLOWMO_DURATION } from '../constants';

export type RoundPhase = 'INTRO' | 'FIGHT' | 'KO' | 'ROUND_END' | 'MATCH_END';

export class RoundManager {
  currentRound = 1;
  p1RoundsWon = 0;
  p2RoundsWon = 0;
  roundTimeRemaining: number;
  phase: RoundPhase = 'INTRO';
  results: RoundResult[] = [];

  private phaseTimer = 0;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.roundTimeRemaining = ROUND_TIME_SECONDS;
  }

  startRound(): void {
    this.phase = 'INTRO';
    this.roundTimeRemaining = ROUND_TIME_SECONDS;
    this.phaseTimer = 0;
    this.scene.events.emit('round-start', { round: this.currentRound });
  }

  update(delta: number, p1Health: number, p2Health: number): void {
    if (this.phase !== 'FIGHT') return;

    this.roundTimeRemaining -= delta / 1000;
    this.phaseTimer += delta;

    if (p1Health <= 0 && p2Health <= 0) {
      this.endRound('draw');
      return;
    }
    if (p1Health <= 0) {
      this.endRound('ai');
      return;
    }
    if (p2Health <= 0) {
      this.endRound('player');
      return;
    }
    if (this.roundTimeRemaining <= 0) {
      this.roundTimeRemaining = 0;
      if (p1Health > p2Health) {
        this.endRound('player');
      } else if (p2Health > p1Health) {
        this.endRound('ai');
      } else {
        this.endRound('draw');
      }
    }
  }

  endRound(winner: 'player' | 'ai' | 'draw'): void {
    this.phase = 'KO';

    const result: RoundResult = { winner, roundNumber: this.currentRound };
    this.results.push(result);

    if (winner === 'player') this.p1RoundsWon++;
    else if (winner === 'ai') this.p2RoundsWon++;

    this.scene.time.timeScale = KO_SLOWMO_SCALE;
    this.scene.time.delayedCall(KO_SLOWMO_DURATION, () => {
      this.scene.time.timeScale = 1;
      if (this.isMatchOver()) {
        this.phase = 'MATCH_END';
        this.scene.events.emit('match-end', { winner: this.getMatchWinner(), results: this.results });
      } else {
        this.phase = 'ROUND_END';
        this.scene.events.emit('round-end', { winner, round: this.currentRound, result });
        this.currentRound++;
      }
    });
  }

  resetForNextRound(
    p1Char: { x: number; health: number; maxHealth: number },
    p2Char: { x: number; health: number; maxHealth: number },
    p1StartX: number,
    p2StartX: number
  ): void {
    p1Char.x = p1StartX;
    p2Char.x = p2StartX;
    p1Char.health = p1Char.maxHealth;
    p2Char.health = p2Char.maxHealth;
    this.phaseTimer = 0;
    this.phase = 'INTRO';
  }

  isMatchOver(): boolean {
    return this.p1RoundsWon >= ROUNDS_TO_WIN || this.p2RoundsWon >= ROUNDS_TO_WIN;
  }

  getMatchWinner(): 'player' | 'ai' | null {
    if (this.p1RoundsWon >= ROUNDS_TO_WIN) return 'player';
    if (this.p2RoundsWon >= ROUNDS_TO_WIN) return 'ai';
    return null;
  }
}
