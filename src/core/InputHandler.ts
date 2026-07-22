const LEFT_KEYS: readonly string[] = ['ArrowLeft', 'KeyA'];
const RIGHT_KEYS: readonly string[] = ['ArrowRight', 'KeyD'];
const JUMP_KEYS: readonly string[] = ['Space', 'ArrowUp'];
const CONTROL_KEYS = new Set([...LEFT_KEYS, ...RIGHT_KEYS, ...JUMP_KEYS]);

export class InputHandler {
  // A map to store the current binary state (true = pressed, false = released) of keys
  private keys: Record<string, boolean>;

  constructor() {
    this.keys = {};
    this.listenToEvents();
  }

  /**
   * Binds global browser listeners to capture physical keystrokes.
   */
  private listenToEvents(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Prevent browser scrolling behavior when pressing space or arrow keys
      if (CONTROL_KEYS.has(event.code)) {
        event.preventDefault();
      }
      this.keys[event.code] = true;
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      this.keys[event.code] = false;
    });
  }

  /**
   * Returns true if the user is commanding movement to the left.
   */
  public get isLeftPressed(): boolean {
    return this.isAnyPressed(LEFT_KEYS);
  }

  /**
   * Returns true if the user is commanding movement to the right.
   */
  public get isRightPressed(): boolean {
    return this.isAnyPressed(RIGHT_KEYS);
  }

  /**
   * Returns true if the user is triggering a jump action.
   */
  public get isJumpPressed(): boolean {
    return this.isAnyPressed(JUMP_KEYS);
  }

  private isAnyPressed(keys: readonly string[]): boolean {
    return keys.some((key) => this.keys[key] === true);
  }
}
