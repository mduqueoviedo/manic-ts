export interface PixelMask {
  readonly width: number;
  readonly height: number;
  readonly rows: readonly number[];
}

/**
 * Defines a small monochrome mask with `#` for occupied pixels.
 */
export function definePixelMask(rows: readonly string[]): PixelMask {
  if (rows.length === 0 || rows[0].length === 0) {
    throw new Error('A pixel mask cannot be empty.');
  }

  const width = rows[0].length;

  if (width > 31 || rows.some((row) => row.length !== width)) {
    throw new Error('Pixel-mask rows must share a width of at most 31 pixels.');
  }

  return {
    width,
    height: rows.length,
    rows: rows.map((row) => {
      let bits = 0;

      for (const pixel of row) {
        bits <<= 1;

        if (pixel === '#') {
          bits |= 1;
        } else if (pixel !== '.') {
          throw new Error(`Unknown pixel-mask symbol "${pixel}".`);
        }
      }

      return bits;
    }),
  };
}

export function mirrorPixelMask(mask: PixelMask): PixelMask {
  const rows = mask.rows.map((row) => {
    let mirrored = 0;

    for (let x = 0; x < mask.width; x++) {
      if (hasPixel(mask, x, 0, row)) {
        mirrored |= 1 << x;
      }
    }

    return mirrored;
  });

  return { ...mask, rows };
}

export function expandPixelMaskHorizontally(
  mask: PixelMask,
  pixels: number,
): PixelMask {
  if (!Number.isInteger(pixels) || pixels < 0) {
    throw new Error('Pixel-mask expansion must be a non-negative integer.');
  }

  const rowLimit = (1 << mask.width) - 1;
  const rows = mask.rows.map((row) => {
    let expanded = row;

    for (let offset = 1; offset <= pixels; offset++) {
      expanded |= row << offset;
      expanded |= row >> offset;
    }

    return expanded & rowLimit;
  });

  return { ...mask, rows };
}

export function masksOverlap(
  firstMask: PixelMask,
  firstX: number,
  firstY: number,
  secondMask: PixelMask,
  secondX: number,
  secondY: number,
): boolean {
  const overlapLeft = Math.max(firstX, secondX);
  const overlapRight = Math.min(
    firstX + firstMask.width,
    secondX + secondMask.width,
  );
  const overlapTop = Math.max(firstY, secondY);
  const overlapBottom = Math.min(
    firstY + firstMask.height,
    secondY + secondMask.height,
  );

  for (let y = overlapTop; y < overlapBottom; y++) {
    for (let x = overlapLeft; x < overlapRight; x++) {
      if (
        hasPixel(firstMask, x - firstX, y - firstY)
        && hasPixel(secondMask, x - secondX, y - secondY)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function maskOverlapsRectangle(
  mask: PixelMask,
  maskX: number,
  maskY: number,
  rectangleX: number,
  rectangleY: number,
  rectangleWidth: number,
  rectangleHeight: number,
): boolean {
  const rectangleMask: PixelMask = {
    width: rectangleWidth,
    height: rectangleHeight,
    rows: Array<number>(rectangleHeight).fill(
      (1 << rectangleWidth) - 1,
    ),
  };

  return masksOverlap(
    mask,
    maskX,
    maskY,
    rectangleMask,
    rectangleX,
    rectangleY,
  );
}

export function renderPixelMask(
  ctx: CanvasRenderingContext2D,
  mask: PixelMask,
  x: number,
  y: number,
): void {
  for (let row = 0; row < mask.height; row++) {
    for (let column = 0; column < mask.width; column++) {
      if (hasPixel(mask, column, row)) {
        ctx.fillRect(x + column, y + row, 1, 1);
      }
    }
  }
}

function hasPixel(
  mask: PixelMask,
  x: number,
  y: number,
  row: number = mask.rows[y],
): boolean {
  return (row & (1 << (mask.width - x - 1))) !== 0;
}
