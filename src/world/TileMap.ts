import {
  LEVEL_COLUMNS,
  LEVEL_ROWS,
  type DeadlyMaskDefinition,
  type LevelDefinition,
} from '../levels/LevelDefinition';
import { CANVAS_WIDTH } from '../core/GameConfig';
import {
  definePixelMask,
  masksOverlap,
  renderPixelMask,
  type PixelMask,
} from '../collision/PixelMask';

// Define the type of tiles available in the cavern
export const TILE_TYPES = {
  EMPTY: 0,
  SOLID: 1,       // Walls and floors that block movement from every direction
  COLLAPSIBLE: 2, // Floors that crumble when stepped on
  DEADLY: 3,      // Spikes or hazards
  ONE_WAY: 4,     // Platforms that only support Willy while he is descending
  CONVEYOR_LEFT: 5,
  CONVEYOR_RIGHT: 6,
} as const;

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

const TILE_SIZE = 8;
const LAST_PIXEL_OFFSET = 1;
// Seven support contacts preserve the observed CPC traversal rule: crossing a
// tile without jumping leaves no floor for a second pass.
const COLLAPSIBLE_LIFETIME_TICKS = 7;
const DEADLY_MASK = definePixelMask([
  '.#...#..',
  '..###...',
  '#....#..',
  '.#.....#',
  '..###..#',
  '#.#.###.',
  '...#....',
  '........',
]);

const TILE_BY_SYMBOL: Readonly<Record<string, TileType>> = {
  ' ': TILE_TYPES.EMPTY,
  '#': TILE_TYPES.SOLID,
  '-': TILE_TYPES.ONE_WAY,
  'x': TILE_TYPES.COLLAPSIBLE,
  '!': TILE_TYPES.DEADLY,
  '<': TILE_TYPES.CONVEYOR_LEFT,
  '>': TILE_TYPES.CONVEYOR_RIGHT,
};

const TILE_COLORS: Readonly<Record<TileType, string>> = {
  [TILE_TYPES.EMPTY]: '#000000',
  [TILE_TYPES.SOLID]: '#00ff00',
  [TILE_TYPES.ONE_WAY]: '#00ffff',
  [TILE_TYPES.COLLAPSIBLE]: '#ffff00',
  [TILE_TYPES.DEADLY]: '#ff0000',
  [TILE_TYPES.CONVEYOR_LEFT]: '#ff00ff',
  [TILE_TYPES.CONVEYOR_RIGHT]: '#ff00ff',
};

const COLLAPSIBLE_WEAR_COLORS: readonly string[] = [
  '#ffff00',
  '#dddd00',
  '#bbbb00',
  '#999900',
  '#777700',
  '#555500',
  '#333300',
];

const TILE_HEIGHT_BY_TYPE: Readonly<Record<TileType, number>> = {
  [TILE_TYPES.EMPTY]: 0,
  [TILE_TYPES.SOLID]: TILE_SIZE,
  [TILE_TYPES.ONE_WAY]: 5,
  [TILE_TYPES.COLLAPSIBLE]: 6,
  [TILE_TYPES.DEADLY]: TILE_SIZE,
  [TILE_TYPES.CONVEYOR_LEFT]: 7,
  [TILE_TYPES.CONVEYOR_RIGHT]: 7,
};

const SUPPORT_TILE_TYPES: ReadonlySet<TileType> = new Set([
  TILE_TYPES.SOLID,
  TILE_TYPES.ONE_WAY,
  TILE_TYPES.COLLAPSIBLE,
  TILE_TYPES.CONVEYOR_LEFT,
  TILE_TYPES.CONVEYOR_RIGHT,
]);

export class TileMap {
  public static readonly TILE_SIZE = TILE_SIZE;
  public static readonly COLLAPSIBLE_LIFETIME_TICKS =
    COLLAPSIBLE_LIFETIME_TICKS;
  public static readonly COLUMNS = LEVEL_COLUMNS;
  public static readonly ROWS = LEVEL_ROWS;
  public static readonly WIDTH = TileMap.COLUMNS * TileMap.TILE_SIZE;
  public static readonly HEIGHT = TileMap.ROWS * TileMap.TILE_SIZE;
  public static readonly ORIGIN_X = (CANVAS_WIDTH - TileMap.WIDTH) / 2;
  public static readonly ORIGIN_Y = 0;
  public static readonly RIGHT = TileMap.ORIGIN_X + TileMap.WIDTH;

  private readonly grid: TileType[][];
  private readonly collapsibleWear: number[][];
  private readonly deadlyMasks: ReadonlyMap<string, PixelMask>;

  constructor(private readonly level: LevelDefinition) {
    this.grid = this.createGrid(level.tiles);
    this.deadlyMasks = this.createDeadlyMasks(level.deadlyMasks ?? []);
    this.collapsibleWear = Array.from(
      { length: TileMap.ROWS },
      () => Array<number>(TileMap.COLUMNS).fill(0),
    );
  }

  /**
   * Returns the tile at a grid position, or undefined when outside the cavern.
   */
  private getTileAtGrid(column: number, row: number): TileType | undefined {
    if (
      !Number.isInteger(column) ||
      !Number.isInteger(row) ||
      column < 0 ||
      column >= TileMap.COLUMNS ||
      row < 0 ||
      row >= TileMap.ROWS
    ) {
      return undefined;
    }

    return this.grid[row][column];
  }

  /**
   * Returns the tile containing a pixel, or undefined when outside the cavern.
   */
  public getTileAtPixel(x: number, y: number): TileType | undefined {
    const column = Math.floor((x - TileMap.ORIGIN_X) / TileMap.TILE_SIZE);
    const row = Math.floor((y - TileMap.ORIGIN_Y) / TileMap.TILE_SIZE);

    return this.getTileAtGrid(column, row);
  }

  /**
   * Identifies tiles that block movement from every direction.
   */
  public isSolidTile(tile: TileType | undefined): boolean {
    return tile === TILE_TYPES.SOLID;
  }

  /**
   * Identifies floor-like tiles that support Willy from above.
   */
  public isSupportTile(tile: TileType | undefined): boolean {
    return tile !== undefined && SUPPORT_TILE_TYPES.has(tile);
  }

  /**
   * Advances every collapsible cell directly below Willy's collision body.
   * Wear is cumulative and each cell disappears independently.
   */
  public wearCollapsibleTilesBelow(
    x: number,
    width: number,
    feetY: number,
  ): void {
    const firstColumn = Math.floor(
      (x - TileMap.ORIGIN_X) / TileMap.TILE_SIZE,
    );
    const lastColumn = Math.floor(
      (x + width - LAST_PIXEL_OFFSET - TileMap.ORIGIN_X)
        / TileMap.TILE_SIZE,
    );
    const row = Math.floor(
      (feetY - TileMap.ORIGIN_Y) / TileMap.TILE_SIZE,
    );

    for (let column = firstColumn; column <= lastColumn; column++) {
      if (this.getTileAtGrid(column, row) !== TILE_TYPES.COLLAPSIBLE) {
        continue;
      }

      const nextWear = this.collapsibleWear[row][column] + 1;
      this.collapsibleWear[row][column] = nextWear;

      if (nextWear >= TileMap.COLLAPSIBLE_LIFETIME_TICKS) {
        this.grid[row][column] = TILE_TYPES.EMPTY;
      }
    }
  }

  /**
   * Checks a sprite mask against every nearby deadly tile mask.
   */
  public overlapsDeadlyTile(
    x: number,
    y: number,
    mask: PixelMask,
  ): boolean {
    const lastX = x + mask.width - LAST_PIXEL_OFFSET;
    const lastY = y + mask.height - LAST_PIXEL_OFFSET;
    const firstColumn = Math.floor((x - TileMap.ORIGIN_X) / TileMap.TILE_SIZE);
    const lastColumn = Math.floor(
      (lastX - TileMap.ORIGIN_X) / TileMap.TILE_SIZE,
    );
    const firstRow = Math.floor((y - TileMap.ORIGIN_Y) / TileMap.TILE_SIZE);
    const lastRow = Math.floor(
      (lastY - TileMap.ORIGIN_Y) / TileMap.TILE_SIZE,
    );

    for (let row = firstRow; row <= lastRow; row++) {
      for (let column = firstColumn; column <= lastColumn; column++) {
        if (this.getTileAtGrid(column, row) === TILE_TYPES.DEADLY) {
          const tileX = TileMap.ORIGIN_X + column * TileMap.TILE_SIZE;
          const tileY = TileMap.ORIGIN_Y + row * TileMap.TILE_SIZE;
          const deadlyMask = this.getDeadlyMask(column, row);

          if (masksOverlap(mask, x, y, deadlyMask, tileX, tileY)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private createGrid(rows: readonly string[]): TileType[][] {
    if (rows.length !== TileMap.ROWS) {
      throw new Error(
        `Level "${this.level.name}" must have ${TileMap.ROWS} tile rows.`,
      );
    }

    return rows.map((row, rowIndex) => {
      if (row.length !== TileMap.COLUMNS) {
        throw new Error(
          `Row ${rowIndex} of level "${this.level.name}" must have ${TileMap.COLUMNS} tiles.`,
        );
      }

      return [...row].map((symbol, column) => {
        const tile = TILE_BY_SYMBOL[symbol];

        if (tile === undefined) {
          throw new Error(
            `Unknown tile symbol "${symbol}" at ${column},${rowIndex} in level "${this.level.name}".`,
          );
        }

        return tile;
      });
    });
  }

  /**
   * Draws the map to the canvas context based on the grid matrix data.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const size = TileMap.TILE_SIZE;

    for (let row = 0; row < TileMap.ROWS; row++) {
      for (let col = 0; col < TileMap.COLUMNS; col++) {
        const tile = this.grid[row][col];

        if (tile === TILE_TYPES.EMPTY) continue;

        ctx.fillStyle = this.getRenderedTileColor(tile, col, row);
        const x = TileMap.ORIGIN_X + col * size;
        const y = TileMap.ORIGIN_Y + row * size;

        if (tile === TILE_TYPES.DEADLY) {
          renderPixelMask(ctx, this.getDeadlyMask(col, row), x, y);
        } else {
          ctx.fillRect(x, y, size, TILE_HEIGHT_BY_TYPE[tile]);
        }
      }
    }
  }

  private getRenderedTileColor(
    tile: TileType,
    column: number,
    row: number,
  ): string {
    if (tile !== TILE_TYPES.COLLAPSIBLE) {
      return TILE_COLORS[tile];
    }

    return COLLAPSIBLE_WEAR_COLORS[this.collapsibleWear[row][column]];
  }

  private getDeadlyMask(column: number, row: number): PixelMask {
    return this.deadlyMasks.get(this.getDeadlyMaskKey(column, row))
      ?? DEADLY_MASK;
  }

  private getDeadlyMaskKey(column: number, row: number): string {
    return `${column},${row}`;
  }

  private createDeadlyMasks(
    definitions: readonly DeadlyMaskDefinition[],
  ): ReadonlyMap<string, PixelMask> {
    const masks = new Map<string, PixelMask>();

    for (const definition of definitions) {
      if (
        this.getTileAtGrid(definition.column, definition.row)
        !== TILE_TYPES.DEADLY
      ) {
        throw new Error(
          `Deadly mask at ${definition.column},${definition.row}`
          + ` in level "${this.level.name}" must target a deadly tile.`,
        );
      }

      const key = this.getDeadlyMaskKey(definition.column, definition.row);

      if (masks.has(key)) {
        throw new Error(
          `Duplicate deadly mask at ${key} in level "${this.level.name}".`,
        );
      }

      const mask = definePixelMask(definition.pixels);

      if (mask.width !== TILE_SIZE || mask.height !== TILE_SIZE) {
        throw new Error(
          `Deadly mask at ${key} in level "${this.level.name}"`
          + ` must be ${TILE_SIZE}x${TILE_SIZE} pixels.`,
        );
      }

      masks.set(key, mask);
    }

    return masks;
  }
}
