import { describe, expect, it } from 'vitest';
import { calculateCanvasDisplaySize } from './CanvasDisplay';

describe('canvas display scaling', () => {
  it('uses the largest integer scale that fits in the viewport', () => {
    expect(calculateCanvasDisplaySize(1000, 700)).toEqual({
      width: 960,
      height: 600,
      scale: 3,
    });
  });

  it('preserves the native aspect ratio when one viewport edge limits it', () => {
    expect(calculateCanvasDisplaySize(1000, 450)).toEqual({
      width: 640,
      height: 400,
      scale: 2,
    });
  });

  it('uses fractional downscaling only below the native canvas size', () => {
    expect(calculateCanvasDisplaySize(160, 120)).toEqual({
      width: 160,
      height: 100,
      scale: 0.5,
    });
  });
});
