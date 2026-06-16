import { CharacterState } from '../types';

interface StateConfig {
  enter?: () => void;
  update?: (delta: number) => void;
  exit?: () => void;
}

export class StateMachine {
  private states = new Map<CharacterState, StateConfig>();
  private transitions = new Map<CharacterState, Set<CharacterState>>();
  private _current: CharacterState;
  private _previous: CharacterState;
  private _stateTimer = 0;

  constructor(initialState: CharacterState) {
    this._current = initialState;
    this._previous = initialState;
    this.buildDefaultTransitions();
  }

  addState(state: CharacterState, config: StateConfig): void {
    this.states.set(state, config);
  }

  addTransition(from: CharacterState | CharacterState[], to: CharacterState): void {
    const sources = Array.isArray(from) ? from : [from];
    for (const src of sources) {
      let set = this.transitions.get(src);
      if (!set) {
        set = new Set();
        this.transitions.set(src, set);
      }
      set.add(to);
    }
  }

  transition(to: CharacterState): boolean {
    if (!this.canTransitionTo(to)) return false;
    this.doTransition(to);
    return true;
  }

  forceTransition(to: CharacterState): void {
    this.doTransition(to);
  }

  private doTransition(to: CharacterState): void {
    const currentConfig = this.states.get(this._current);
    currentConfig?.exit?.();
    this._previous = this._current;
    this._current = to;
    this._stateTimer = 0;
    const nextConfig = this.states.get(this._current);
    nextConfig?.enter?.();
  }

  update(delta: number): void {
    this._stateTimer++;
    const config = this.states.get(this._current);
    config?.update?.(delta);
  }

  get current(): CharacterState {
    return this._current;
  }

  get previous(): CharacterState {
    return this._previous;
  }

  get stateTimer(): number {
    return this._stateTimer;
  }

  canTransitionTo(state: CharacterState): boolean {
    if (this._current === 'IDLE') return true;
    const allowed = this.transitions.get(this._current);
    return allowed?.has(state) ?? false;
  }

  private buildDefaultTransitions(): void {
    const all: CharacterState[] = [
      'IDLE', 'WALK_FORWARD', 'WALK_BACK', 'CROUCH',
      'JUMP', 'JUMP_FORWARD', 'JUMP_BACK',
      'ATTACK_LIGHT', 'ATTACK_HEAVY',
      'ATTACK_SPECIAL_1', 'ATTACK_SPECIAL_2', 'ATTACK_SPECIAL_3',
      'BLOCK', 'BLOCK_CROUCH', 'HIT_STUN', 'BLOCK_STUN',
      'KNOCKDOWN', 'RISING', 'PARRY', 'PINNED', 'GRABBED', 'GRABBING',
      'FINALE_CHARGE', 'FINALE_ACTIVE', 'VICTORY', 'DEFEATED', 'INTRO',
    ];

    // IDLE can go anywhere — handled in canTransitionTo()

    const movementStates: CharacterState[] = ['WALK_FORWARD', 'WALK_BACK', 'CROUCH'];
    for (const s of movementStates) {
      this.addTransition(s, 'IDLE');
      this.addTransition(s, 'WALK_FORWARD');
      this.addTransition(s, 'WALK_BACK');
      this.addTransition(s, 'CROUCH');
      this.addTransition(s, 'JUMP');
      this.addTransition(s, 'JUMP_FORWARD');
      this.addTransition(s, 'JUMP_BACK');
      this.addTransition(s, 'ATTACK_LIGHT');
      this.addTransition(s, 'ATTACK_HEAVY');
      this.addTransition(s, 'ATTACK_SPECIAL_1');
      this.addTransition(s, 'ATTACK_SPECIAL_2');
      this.addTransition(s, 'ATTACK_SPECIAL_3');
      this.addTransition(s, 'BLOCK');
      this.addTransition(s, 'BLOCK_CROUCH');
      this.addTransition(s, 'HIT_STUN');
      this.addTransition(s, 'KNOCKDOWN');
      this.addTransition(s, 'PARRY');
      this.addTransition(s, 'FINALE_CHARGE');
    }

    const attackStates: CharacterState[] = [
      'ATTACK_LIGHT', 'ATTACK_HEAVY',
      'ATTACK_SPECIAL_1', 'ATTACK_SPECIAL_2', 'ATTACK_SPECIAL_3',
    ];
    for (const s of attackStates) {
      this.addTransition(s, 'IDLE');
      this.addTransition(s, 'HIT_STUN');
      this.addTransition(s, 'KNOCKDOWN');
    }

    this.addTransition('FINALE_CHARGE', 'FINALE_ACTIVE');
    this.addTransition('FINALE_CHARGE', 'IDLE');
    this.addTransition('FINALE_CHARGE', 'HIT_STUN');
    this.addTransition('FINALE_CHARGE', 'KNOCKDOWN');
    this.addTransition('FINALE_ACTIVE', 'IDLE');
    this.addTransition('FINALE_ACTIVE', 'HIT_STUN');
    this.addTransition('FINALE_ACTIVE', 'KNOCKDOWN');

    this.addTransition('HIT_STUN', 'IDLE');
    this.addTransition('HIT_STUN', 'KNOCKDOWN');

    this.addTransition('BLOCK_STUN', 'IDLE');
    this.addTransition('BLOCK_STUN', 'BLOCK');
    this.addTransition('BLOCK_STUN', 'BLOCK_CROUCH');
    this.addTransition('BLOCK_STUN', 'HIT_STUN');
    this.addTransition('BLOCK_STUN', 'KNOCKDOWN');

    this.addTransition('BLOCK', 'IDLE');
    this.addTransition('BLOCK', 'BLOCK_CROUCH');
    this.addTransition('BLOCK', 'BLOCK_STUN');
    this.addTransition('BLOCK', 'HIT_STUN');
    this.addTransition('BLOCK', 'KNOCKDOWN');
    this.addTransition('BLOCK', 'PARRY');

    this.addTransition('BLOCK_CROUCH', 'IDLE');
    this.addTransition('BLOCK_CROUCH', 'BLOCK');
    this.addTransition('BLOCK_CROUCH', 'BLOCK_STUN');
    this.addTransition('BLOCK_CROUCH', 'HIT_STUN');
    this.addTransition('BLOCK_CROUCH', 'KNOCKDOWN');

    this.addTransition('KNOCKDOWN', 'RISING');
    this.addTransition('RISING', 'IDLE');

    const jumpStates: CharacterState[] = ['JUMP', 'JUMP_FORWARD', 'JUMP_BACK'];
    for (const s of jumpStates) {
      this.addTransition(s, 'IDLE');
      this.addTransition(s, 'ATTACK_LIGHT');
      this.addTransition(s, 'ATTACK_HEAVY');
      this.addTransition(s, 'ATTACK_SPECIAL_1');
      this.addTransition(s, 'ATTACK_SPECIAL_2');
      this.addTransition(s, 'ATTACK_SPECIAL_3');
      this.addTransition(s, 'HIT_STUN');
      this.addTransition(s, 'KNOCKDOWN');
    }

    this.addTransition('PARRY', 'IDLE');
    this.addTransition('PARRY', 'ATTACK_LIGHT');
    this.addTransition('PARRY', 'ATTACK_HEAVY');
    this.addTransition('PARRY', 'HIT_STUN');
    this.addTransition('PARRY', 'KNOCKDOWN');

    this.addTransition('GRABBING', 'IDLE');
    this.addTransition('GRABBING', 'HIT_STUN');
    this.addTransition('GRABBED', 'KNOCKDOWN');
    this.addTransition('GRABBED', 'IDLE');
    this.addTransition('PINNED', 'KNOCKDOWN');
    this.addTransition('PINNED', 'IDLE');

    this.addTransition('INTRO', 'IDLE');

    for (const s of all) {
      this.addTransition(s, 'VICTORY');
      this.addTransition(s, 'DEFEATED');
    }
  }
}
