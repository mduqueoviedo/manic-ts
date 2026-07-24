import { describe, expect, it } from 'vitest';
import {
  definePixelMask,
  expandPixelMaskHorizontally,
  maskOverlapsRectangle,
  masksOverlap,
  mirrorPixelMask,
} from './PixelMask';

describe('PixelMask', () => {
  it('detects overlap only when both masks occupy the same pixel', () => {
    const first = definePixelMask([
      '#.',
      '..',
    ]);
    const second = definePixelMask([
      '.#',
      '..',
    ]);

    expect(masksOverlap(first, 0, 0, second, 0, 0)).toBe(false);
    expect(masksOverlap(first, 1, 0, second, 0, 0)).toBe(true);
  });

  it('mirrors occupied pixels horizontally', () => {
    const pixel = definePixelMask(['#']);
    const mirrored = mirrorPixelMask(definePixelMask(['#..']));

    expect(masksOverlap(mirrored, 0, 0, pixel, 2, 0)).toBe(true);
    expect(masksOverlap(mirrored, 0, 0, pixel, 0, 0)).toBe(false);
  });

  it('expands collision pixels without changing the mask dimensions', () => {
    const pixel = definePixelMask(['.#.']);
    const expanded = expandPixelMaskHorizontally(pixel, 1);
    const probe = definePixelMask(['#']);

    expect(expanded.width).toBe(3);
    expect(masksOverlap(expanded, 0, 0, probe, 0, 0)).toBe(true);
    expect(masksOverlap(expanded, 0, 0, probe, 2, 0)).toBe(true);
  });

  it('checks occupied pixels rather than the full mask cell against rectangles', () => {
    const mask = definePixelMask(['..#']);

    expect(maskOverlapsRectangle(mask, 4, 5, 6, 5, 1, 1)).toBe(true);
    expect(maskOverlapsRectangle(mask, 4, 5, 4, 5, 1, 1)).toBe(false);
  });

  it('rejects malformed mask rows', () => {
    expect(() => definePixelMask(['#', '..'])).toThrow(
      'rows must share a width',
    );
    expect(() => definePixelMask(['x'])).toThrow(
      'Unknown pixel-mask symbol',
    );
  });
});
