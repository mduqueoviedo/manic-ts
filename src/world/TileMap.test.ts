import { describe, expect, it } from 'vitest';
import {
  createEmptyTileRows,
  createTestLevel,
  SOLID_TILE_ROW,
} from '../test/levelFixtures';
import { definePixelMask } from '../collision/PixelMask';
import { TILE_TYPES, TileMap } from './TileMap';

const LEVEL_NAME = 'Tile map test';

describe('TileMap', () => {
  it('translates every supported terrain symbol into its tile type', () => {
    const rows = createEmptyTileRows();
    rows[2] = ' #-x!<>'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const y = 2 * TileMap.TILE_SIZE;

    expect(tileMap.getTileAtPixel(TileMap.ORIGIN_X, y)).toBe(TILE_TYPES.EMPTY);
    expect(tileMap.getTileAtPixel(
      TileMap.ORIGIN_X + TileMap.TILE_SIZE,
      y,
    )).toBe(
      TILE_TYPES.SOLID,
    );
    expect(tileMap.getTileAtPixel(
      TileMap.ORIGIN_X + 2 * TileMap.TILE_SIZE,
      y,
    )).toBe(
      TILE_TYPES.ONE_WAY,
    );
    expect(tileMap.getTileAtPixel(
      TileMap.ORIGIN_X + 3 * TileMap.TILE_SIZE,
      y,
    )).toBe(
      TILE_TYPES.COLLAPSIBLE,
    );
    expect(tileMap.getTileAtPixel(
      TileMap.ORIGIN_X + 4 * TileMap.TILE_SIZE,
      y,
    )).toBe(
      TILE_TYPES.DEADLY,
    );
    expect(tileMap.getTileAtPixel(
      TileMap.ORIGIN_X + 5 * TileMap.TILE_SIZE,
      y,
    )).toBe(
      TILE_TYPES.CONVEYOR_LEFT,
    );
    expect(tileMap.getTileAtPixel(
      TileMap.ORIGIN_X + 6 * TileMap.TILE_SIZE,
      y,
    )).toBe(
      TILE_TYPES.CONVEYOR_RIGHT,
    );
  });

  it('returns undefined for pixels outside the cavern', () => {
    const tileMap = new TileMap(createTestLevel());

    expect(tileMap.getTileAtPixel(TileMap.ORIGIN_X - 1, 0)).toBeUndefined();
    expect(tileMap.getTileAtPixel(TileMap.RIGHT, 0)).toBeUndefined();
    expect(tileMap.getTileAtPixel(TileMap.ORIGIN_X, -1)).toBeUndefined();
    expect(
      tileMap.getTileAtPixel(TileMap.ORIGIN_X, TileMap.HEIGHT),
    ).toBeUndefined();
  });

  it('classifies full solids separately from every supporting surface', () => {
    const tileMap = new TileMap(createTestLevel());

    expect(tileMap.isSolidTile(TILE_TYPES.SOLID)).toBe(true);
    expect(tileMap.isSolidTile(TILE_TYPES.ONE_WAY)).toBe(false);
    expect(tileMap.isSolidTile(TILE_TYPES.CONVEYOR_LEFT)).toBe(false);
    expect(tileMap.isSolidTile(TILE_TYPES.CONVEYOR_RIGHT)).toBe(false);

    for (const tile of [
      TILE_TYPES.SOLID,
      TILE_TYPES.ONE_WAY,
      TILE_TYPES.COLLAPSIBLE,
      TILE_TYPES.CONVEYOR_LEFT,
      TILE_TYPES.CONVEYOR_RIGHT,
    ]) {
      expect(tileMap.isSupportTile(tile)).toBe(true);
    }

    expect(tileMap.isSupportTile(TILE_TYPES.EMPTY)).toBe(false);
    expect(tileMap.isSupportTile(TILE_TYPES.DEADLY)).toBe(false);
    expect(tileMap.isSupportTile(undefined)).toBe(false);
  });

  it('renders the measured horizontal and vertical brick masks', () => {
    const rows = createEmptyTileRows();
    rows[1] = ' #'.padEnd(TileMap.COLUMNS);
    rows[2] = ' #  ##'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const renderedPixels = new Map<string, string>();
    const ctx = {
      fillStyle: '',
      fillRect(x: number, y: number, width: number, height: number): void {
        if (width === 1 && height === 1) {
          renderedPixels.set(`${x},${y}`, String(this.fillStyle));
        }
      },
    } as CanvasRenderingContext2D;
    const tileY = 2 * TileMap.TILE_SIZE;
    const readRenderedBrick = (column: number): string[] => {
      const tileX = TileMap.ORIGIN_X + column * TileMap.TILE_SIZE;

      return Array.from(
        { length: TileMap.TILE_SIZE },
        (_, y) => Array.from(
          { length: TileMap.TILE_SIZE },
          (_, x) => {
            const color = renderedPixels.get(`${tileX + x},${tileY + y}`);

            if (color === '#ff0000') return 'R';
            if (color === '#00ff00') return 'G';

            return '.';
          },
        ).join(''),
      );
    };

    tileMap.render(ctx);

    expect(readRenderedBrick(1)).toEqual([
      'RRRRRRRR',
      'GGRGGGRG',
      'RRRRRRRR',
      'GGGGGRGG',
      'RRRRRRRR',
      'GGRGGGGG',
      'RRRRRRRR',
      'GGGGGRGG',
    ]);
    expect(readRenderedBrick(4)).toEqual([
      'GGRGGGRG',
      'RRRRRRRR',
      'GGGGGRGG',
      'RRRRRRRR',
      'GGRGGGGG',
      'RRRRRRRR',
      'GGGGGRGG',
      'RRRRRRRR',
    ]);
  });

  it('reports the conveyor direction below a complete footprint', () => {
    const rows = createEmptyTileRows();
    rows[3] = '  <<  >>'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const rowY = 3 * TileMap.TILE_SIZE;

    expect(tileMap.getConveyorDirectionBelow(
      TileMap.ORIGIN_X + 2 * TileMap.TILE_SIZE,
      2 * TileMap.TILE_SIZE,
      rowY,
    )).toBe(-1);
    expect(tileMap.getConveyorDirectionBelow(
      TileMap.ORIGIN_X + 6 * TileMap.TILE_SIZE,
      2 * TileMap.TILE_SIZE,
      rowY,
    )).toBe(1);
    expect(tileMap.getConveyorDirectionBelow(
      TileMap.ORIGIN_X + 3 * TileMap.TILE_SIZE,
      4 * TileMap.TILE_SIZE,
      rowY,
    )).toBe(0);
  });

  it('mirrors the conveyor mask to communicate its direction', () => {
    const rows = createEmptyTileRows();
    rows[2] = '<>'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const filledPixels: Array<Readonly<{ x: number; y: number }>> = [];
    const ctx = {
      fillStyle: '',
      fillRect(x: number, y: number, width: number, height: number): void {
        if (width === 1 && height === 1) {
          filledPixels.push({ x, y });
        }
      },
    } as CanvasRenderingContext2D;
    const leftX = TileMap.ORIGIN_X;
    const rightX = leftX + TileMap.TILE_SIZE;
    const tileY = 2 * TileMap.TILE_SIZE;
    const readRenderedMask = (tileX: number): string[] =>
      Array.from(
        { length: TileMap.TILE_SIZE },
        (_, y) => Array.from(
          { length: TileMap.TILE_SIZE },
          (_, x) => filledPixels.some(
            (pixel) => pixel.x === tileX + x && pixel.y === tileY + y,
          ) ? '#' : '.',
        ).join(''),
      );

    tileMap.render(ctx);

    expect(readRenderedMask(leftX)).toEqual([
      '####....',
      '..####..',
      '####....',
      '..####..',
      '....##..',
      '........',
      '##....##',
      '########',
    ]);
    expect(readRenderedMask(rightX)).toEqual([
      '....####',
      '..####..',
      '....####',
      '..####..',
      '..##....',
      '........',
      '##....##',
      '########',
    ]);
  });

  it('moves the two conveyor bands in opposite directions', () => {
    const rows = createEmptyTileRows();
    rows[2] = '<'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const filledPixels: Array<Readonly<{ x: number; y: number }>> = [];
    const ctx = {
      fillStyle: '',
      fillRect(x: number, y: number, width: number, height: number): void {
        if (width === 1 && height === 1) {
          filledPixels.push({ x, y });
        }
      },
    } as CanvasRenderingContext2D;
    const tileX = TileMap.ORIGIN_X;
    const tileY = 2 * TileMap.TILE_SIZE;
    const readRenderedMask = (): string[] =>
      Array.from(
        { length: TileMap.TILE_SIZE },
        (_, y) => Array.from(
          { length: TileMap.TILE_SIZE },
          (_, x) => filledPixels.some(
            (pixel) => pixel.x === tileX + x && pixel.y === tileY + y,
          ) ? '#' : '.',
        ).join(''),
      );
    const expectedFrames = [
      [
        '##....##',
        '..####..',
        '..####..',
        '..####..',
        '....##..',
        '........',
        '##....##',
        '########',
      ],
      [
        '....####',
        '..####..',
        '....####',
        '..####..',
        '....##..',
        '........',
        '##....##',
        '########',
      ],
      [
        '..####..',
        '..####..',
        '##....##',
        '..####..',
        '....##..',
        '........',
        '##....##',
        '########',
      ],
      [
        '####....',
        '..####..',
        '####....',
        '..####..',
        '....##..',
        '........',
        '##....##',
        '########',
      ],
    ];

    for (const expectedFrame of expectedFrames) {
      tileMap.advanceAnimations();
      filledPixels.length = 0;
      tileMap.render(ctx);

      expect(readRenderedMask()).toEqual(expectedFrame);
      expect(expectedFrame[1]).toBe('..####..');
      expect(expectedFrame[3]).toBe('..####..');
      expect(expectedFrame.slice(4)).toEqual([
        '....##..',
        '........',
        '##....##',
        '########',
      ]);
    }
  });

  it('detects occupied deadly pixels without hitting transparent pixels', () => {
    const rows = createEmptyTileRows();
    rows[2] = '  !'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const hazardX = TileMap.ORIGIN_X + 2 * TileMap.TILE_SIZE;
    const hazardY = 2 * TileMap.TILE_SIZE;
    const pixel = definePixelMask(['#']);

    expect(
      tileMap.overlapsDeadlyTile(hazardX + 1, hazardY + 3, pixel),
    ).toBe(true);
    expect(tileMap.overlapsDeadlyTile(hazardX, hazardY, pixel)).toBe(false);
    expect(
      tileMap.overlapsDeadlyTile(hazardX, hazardY + 3, pixel),
    ).toBe(false);
  });

  it('wears collapsible tiles cumulatively until each touched cell disappears', () => {
    const rows = createEmptyTileRows();
    rows[3] = '  xx'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const firstTileX = TileMap.ORIGIN_X + 2 * TileMap.TILE_SIZE;
    const secondTileX = firstTileX + TileMap.TILE_SIZE;
    const tileY = 3 * TileMap.TILE_SIZE;

    for (
      let tick = 0;
      tick < TileMap.COLLAPSIBLE_LIFETIME_TICKS - 1;
      tick++
    ) {
      tileMap.wearCollapsibleTilesBelow(
        firstTileX,
        TileMap.TILE_SIZE,
        tileY,
      );
    }

    expect(tileMap.getTileAtPixel(firstTileX, tileY)).toBe(
      TILE_TYPES.COLLAPSIBLE,
    );
    expect(tileMap.getTileAtPixel(secondTileX, tileY)).toBe(
      TILE_TYPES.COLLAPSIBLE,
    );

    tileMap.wearCollapsibleTilesBelow(
      firstTileX,
      2 * TileMap.TILE_SIZE,
      tileY,
    );

    expect(tileMap.getTileAtPixel(firstTileX, tileY)).toBe(TILE_TYPES.EMPTY);
    expect(tileMap.getTileAtPixel(secondTileX, tileY)).toBe(
      TILE_TYPES.COLLAPSIBLE,
    );
  });

  it('fully removes a collapsible tile during one uninterrupted walking pass', () => {
    const rows = createEmptyTileRows();
    rows[3] = '   #x#'.padEnd(TileMap.COLUMNS);
    const tileMap = new TileMap(createTestLevel({ tiles: rows }));
    const tileX = TileMap.ORIGIN_X + 4 * TileMap.TILE_SIZE;
    const tileY = 3 * TileMap.TILE_SIZE;
    const startX = tileX - TileMap.TILE_SIZE;
    const endX = tileX + TileMap.TILE_SIZE;
    const walkingStep = 2;

    for (
      let willyX = startX + walkingStep;
      willyX <= endX;
      willyX += walkingStep
    ) {
      tileMap.wearCollapsibleTilesBelow(
        willyX,
        TileMap.TILE_SIZE,
        tileY,
      );
    }

    expect(tileMap.getTileAtPixel(tileX, tileY)).toBe(TILE_TYPES.EMPTY);
  });

  it('rejects malformed level grids with useful errors', () => {
    expect(() => new TileMap(createTestLevel({
      tiles: createEmptyTileRows().slice(1),
    }))).toThrow(
      `must have ${TileMap.ROWS} tile rows`,
    );

    const shortRow = createEmptyTileRows();
    shortRow[4] = shortRow[4].slice(1);
    expect(() => new TileMap(createTestLevel({
      name: LEVEL_NAME,
      tiles: shortRow,
    }))).toThrow(
      `Row 4 of level "${LEVEL_NAME}" must have ${TileMap.COLUMNS} tiles`,
    );

    const unknownSymbol = createEmptyTileRows();
    unknownSymbol[3] = '?'.padEnd(TileMap.COLUMNS);
    expect(() => new TileMap(createTestLevel({
      name: LEVEL_NAME,
      tiles: unknownSymbol,
    }))).toThrow(
      `Unknown tile symbol "?" at 0,3 in level "${LEVEL_NAME}"`,
    );
  });
});
