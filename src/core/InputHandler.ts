const LEFT_KEYS: readonly string[] = ['ArrowLeft', 'KeyA'];
const RIGHT_KEYS: readonly string[] = ['ArrowRight', 'KeyD'];
const JUMP_KEYS: readonly string[] = ['Space', 'ArrowUp'];
const RESTART_KEY = 'Digit1';
const CONTROL_KEYS = new Set([...LEFT_KEYS, ...RIGHT_KEYS, ...JUMP_KEYS]);
const LEFT_ZONE_END = 0.25;
const RIGHT_ZONE_END = 0.5;

type TouchControl = 'LEFT' | 'RIGHT' | 'JUMP';

interface TouchTarget extends EventTarget {
  getBoundingClientRect(): DOMRect;
  setPointerCapture(pointerId: number): void;
}

export interface PlayerInput {
  readonly isLeftPressed: boolean;
  readonly isRightPressed: boolean;
  readonly isJumpPressed: boolean;
}

export class InputHandler implements PlayerInput {
  // A map to store the current binary state (true = pressed, false = released) of keys
  private keys: Record<string, boolean>;
  private restartRequested = false;
  private touchPressed = false;
  private readonly touchControls = new Map<number, TouchControl>();

  constructor(
    private readonly keyboardTarget: EventTarget = window,
    private readonly touchTarget?: TouchTarget,
  ) {
    this.keys = {};
    this.listenToKeyboardEvents();
    this.listenToTouchEvents();
  }

  /**
   * Binds global browser listeners to capture physical keystrokes.
   */
  private listenToKeyboardEvents(): void {
    this.keyboardTarget.addEventListener('keydown', (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;

      if (keyboardEvent.code === RESTART_KEY && !keyboardEvent.repeat) {
        this.restartRequested = true;
      }

      // Prevent browser scrolling behavior when pressing space or arrow keys
      if (CONTROL_KEYS.has(keyboardEvent.code)) {
        keyboardEvent.preventDefault();
      }
      this.keys[keyboardEvent.code] = true;
    });

    this.keyboardTarget.addEventListener('keyup', (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      this.keys[keyboardEvent.code] = false;
    });
  }

  /**
   * Splits the canvas into invisible left, right and jump zones. Pointer IDs
   * are tracked independently so a direction and jump can be held together.
   */
  private listenToTouchEvents(): void {
    if (!this.touchTarget) {
      return;
    }

    this.touchTarget.addEventListener('pointerdown', (event: Event) => {
      const pointerEvent = event as PointerEvent;
      if (pointerEvent.pointerType !== 'touch') {
        return;
      }

      pointerEvent.preventDefault();
      this.touchPressed = true;
      this.updateTouchControl(pointerEvent);
      this.touchTarget?.setPointerCapture(pointerEvent.pointerId);
    });

    this.touchTarget.addEventListener('pointermove', (event: Event) => {
      const pointerEvent = event as PointerEvent;
      if (!this.touchControls.has(pointerEvent.pointerId)) {
        return;
      }

      pointerEvent.preventDefault();
      this.updateTouchControl(pointerEvent);
    });

    const releaseTouch = (event: Event): void => {
      const pointerEvent = event as PointerEvent;
      if (!this.touchControls.has(pointerEvent.pointerId)) {
        return;
      }

      pointerEvent.preventDefault();
      this.touchControls.delete(pointerEvent.pointerId);
    };

    this.touchTarget.addEventListener('pointerup', releaseTouch);
    this.touchTarget.addEventListener('pointercancel', releaseTouch);
    this.touchTarget.addEventListener('lostpointercapture', releaseTouch);
  }

  /**
   * Returns true if the user is commanding movement to the left.
   */
  public get isLeftPressed(): boolean {
    return this.isAnyPressed(LEFT_KEYS) || this.hasTouchControl('LEFT');
  }

  /**
   * Returns true if the user is commanding movement to the right.
   */
  public get isRightPressed(): boolean {
    return this.isAnyPressed(RIGHT_KEYS) || this.hasTouchControl('RIGHT');
  }

  /**
   * Returns true if the user is triggering a jump action.
   */
  public get isJumpPressed(): boolean {
    return this.isAnyPressed(JUMP_KEYS) || this.hasTouchControl('JUMP');
  }

  public consumeRestartRequest(allowTouch: boolean = false): boolean {
    const wasRequested = this.restartRequested
      || (allowTouch && this.touchPressed);
    this.restartRequested = false;
    this.touchPressed = false;

    if (wasRequested) {
      this.touchControls.clear();
    }

    return wasRequested;
  }

  private isAnyPressed(keys: readonly string[]): boolean {
    return keys.some((key) => this.keys[key] === true);
  }

  private hasTouchControl(control: TouchControl): boolean {
    return [...this.touchControls.values()].includes(control);
  }

  private updateTouchControl(event: PointerEvent): void {
    const bounds = this.touchTarget?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) {
      return;
    }

    const horizontalPosition = (event.clientX - bounds.left) / bounds.width;
    const control = horizontalPosition < LEFT_ZONE_END
      ? 'LEFT'
      : horizontalPosition < RIGHT_ZONE_END
        ? 'RIGHT'
        : 'JUMP';

    this.touchControls.set(event.pointerId, control);
  }
}
