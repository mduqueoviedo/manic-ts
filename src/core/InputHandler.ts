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
      if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
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
    return this.keys['ArrowLeft'] === true || this.keys['KeyA'] === true;
  }

  /**
   * Returns true if the user is commanding movement to the right.
   */
  public get isRightPressed(): boolean {
    return this.keys['ArrowRight'] === true || this.keys['KeyD'] === true;
  }

  /**
   * Returns true if the user is triggering a jump action.
   */
  public get isJumpPressed(): boolean {
    return this.keys['Space'] === true || this.keys['ArrowUp'] === true;
  }
}
