import { CANVAS_HEIGHT, CANVAS_WIDTH } from './GameConfig';

const MINIMUM_VIEWPORT_SIZE = 1;
const NATIVE_DISPLAY_SCALE = 1;

export interface CanvasDisplaySize {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}

/**
 * Uses the largest whole-number enlargement that fits in the viewport.
 * Fractional scaling is reserved for viewports smaller than the native canvas.
 */
export function calculateCanvasDisplaySize(
  viewportWidth: number,
  viewportHeight: number,
): CanvasDisplaySize {
  const safeViewportWidth = Math.max(MINIMUM_VIEWPORT_SIZE, viewportWidth);
  const safeViewportHeight = Math.max(MINIMUM_VIEWPORT_SIZE, viewportHeight);
  const availableScale = Math.min(
    safeViewportWidth / CANVAS_WIDTH,
    safeViewportHeight / CANVAS_HEIGHT,
  );
  const scale = availableScale >= NATIVE_DISPLAY_SCALE
    ? Math.floor(availableScale)
    : availableScale;

  return {
    width: CANVAS_WIDTH * scale,
    height: CANVAS_HEIGHT * scale,
    scale,
  };
}

export function fitCanvasToViewport(
  canvas: HTMLCanvasElement,
  viewportWidth: number,
  viewportHeight: number,
): void {
  const displaySize = calculateCanvasDisplaySize(
    viewportWidth,
    viewportHeight,
  );

  canvas.style.width = `${displaySize.width}px`;
  canvas.style.height = `${displaySize.height}px`;
}
