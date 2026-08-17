import { describe, expect, it } from 'vitest';
import { InputHandler } from './InputHandler';

class FakeTouchTarget extends EventTarget {
  public capturedPointers: number[] = [];

  public getBoundingClientRect(): DOMRect {
    return {
      left: 100,
      width: 400,
    } as DOMRect;
  }

  public setPointerCapture(pointerId: number): void {
    this.capturedPointers.push(pointerId);
  }
}

function dispatchPointer(
  target: EventTarget,
  type: string,
  pointerId: number,
  clientX: number,
  pointerType: string = 'touch',
): void {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    pointerType: { value: pointerType },
  });
  target.dispatchEvent(event);
}

function dispatchKeyboard(
  target: EventTarget,
  type: string,
  code: string,
): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    code: { value: code },
    repeat: { value: false },
  });
  target.dispatchEvent(event);
  return event;
}

describe('InputHandler touch controls', () => {
  it.each([
    [150, true, false, false],
    [250, false, true, false],
    [400, false, false, true],
  ])(
    'maps canvas position %s to the expected invisible control',
    (clientX, left, right, jump) => {
      const touchTarget = new FakeTouchTarget();
      const input = new InputHandler(new EventTarget(), touchTarget);

      dispatchPointer(touchTarget, 'pointerdown', 1, clientX);

      expect(input.isLeftPressed).toBe(left);
      expect(input.isRightPressed).toBe(right);
      expect(input.isJumpPressed).toBe(jump);
      expect(touchTarget.capturedPointers).toEqual([1]);
    },
  );

  it('supports moving and jumping with separate touches', () => {
    const touchTarget = new FakeTouchTarget();
    const input = new InputHandler(new EventTarget(), touchTarget);

    dispatchPointer(touchTarget, 'pointerdown', 1, 250);
    dispatchPointer(touchTarget, 'pointerdown', 2, 400);

    expect(input.isRightPressed).toBe(true);
    expect(input.isJumpPressed).toBe(true);

    dispatchPointer(touchTarget, 'pointerup', 2, 400);

    expect(input.isRightPressed).toBe(true);
    expect(input.isJumpPressed).toBe(false);
  });

  it('updates a touch when it moves between control zones', () => {
    const touchTarget = new FakeTouchTarget();
    const input = new InputHandler(new EventTarget(), touchTarget);

    dispatchPointer(touchTarget, 'pointerdown', 1, 150);
    dispatchPointer(touchTarget, 'pointermove', 1, 250);

    expect(input.isLeftPressed).toBe(false);
    expect(input.isRightPressed).toBe(true);

    dispatchPointer(touchTarget, 'pointercancel', 1, 250);
    expect(input.isRightPressed).toBe(false);
  });

  it('uses a touch to restart only when game over permits it', () => {
    const touchTarget = new FakeTouchTarget();
    const input = new InputHandler(new EventTarget(), touchTarget);

    dispatchPointer(touchTarget, 'pointerdown', 1, 400);

    expect(input.consumeRestartRequest(false)).toBe(false);
    expect(input.isJumpPressed).toBe(true);

    dispatchPointer(touchTarget, 'pointerdown', 2, 250);

    expect(input.consumeRestartRequest(true)).toBe(true);
    expect(input.isRightPressed).toBe(false);
    expect(input.isJumpPressed).toBe(false);
  });

  it('ignores mouse pointers', () => {
    const touchTarget = new FakeTouchTarget();
    const input = new InputHandler(new EventTarget(), touchTarget);

    dispatchPointer(touchTarget, 'pointerdown', 1, 150, 'mouse');

    expect(input.isLeftPressed).toBe(false);
    expect(input.consumeRestartRequest(true)).toBe(false);
  });

  it('preserves keyboard movement and restart controls', () => {
    const keyboardTarget = new EventTarget();
    const input = new InputHandler(keyboardTarget);

    const keyDown = dispatchKeyboard(keyboardTarget, 'keydown', 'ArrowLeft');

    expect(input.isLeftPressed).toBe(true);
    expect(keyDown.defaultPrevented).toBe(true);

    dispatchKeyboard(keyboardTarget, 'keyup', 'ArrowLeft');
    dispatchKeyboard(keyboardTarget, 'keydown', 'Digit1');

    expect(input.isLeftPressed).toBe(false);
    expect(input.consumeRestartRequest()).toBe(true);
    expect(input.consumeRestartRequest()).toBe(false);
  });
});
