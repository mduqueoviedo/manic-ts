import {
  LEVEL_COLUMNS,
  LEVEL_ROWS,
  type LevelDefinition,
} from '../levels/LevelDefinition';
import { CANVAS_WIDTH } from '../core/GameConfig';

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
  public static readonly COLUMNS = LEVEL_COLUMNS;
  public static readonly ROWS = LEVEL_ROWS;
  public static readonly WIDTH = TileMap.COLUMNS * TileMap.TILE_SIZE;
  public static readonly HEIGHT = TileMap.ROWS * TileMap.TILE_SIZE;
  public static readonly ORIGIN_X = (CANVAS_WIDTH - TileMap.WIDTH) / 2;
  public static readonly ORIGIN_Y = 0;
  public static readonly RIGHT = TileMap.ORIGIN_X + TileMap.WIDTH;

  private readonly grid: TileType[][];

  constructor(private readonly level: LevelDefinition) {
    this.grid = this.createGrid(level.tiles);
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
   * Checks every tile touched by a pixel rectangle for a deadly tile.
   */
  public overlapsDeadlyTile(
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean {
    const lastX = x + width - LAST_PIXEL_OFFSET;
    const lastY = y + height - LAST_PIXEL_OFFSET;
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
          return true;
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

        ctx.fillStyle = TILE_COLORS[tile];
        ctx.fillRect(
          TileMap.ORIGIN_X + col * size,
          TileMap.ORIGIN_Y + row * size,
          size,
          TILE_HEIGHT_BY_TYPE[tile],
        );
      }
    }
  }
}
