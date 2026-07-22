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
  CONVEYOR: 5,    // Floors that will move Willy horizontally
} as const;

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

const TILE_BY_SYMBOL: Readonly<Record<string, TileType>> = {
  ' ': TILE_TYPES.EMPTY,
  '#': TILE_TYPES.SOLID,
  '-': TILE_TYPES.ONE_WAY,
  'x': TILE_TYPES.COLLAPSIBLE,
  '!': TILE_TYPES.DEADLY,
  '>': TILE_TYPES.CONVEYOR,
};

const TILE_COLORS: Readonly<Record<TileType, string>> = {
  [TILE_TYPES.EMPTY]: '#000000',
  [TILE_TYPES.SOLID]: '#00ff00',
  [TILE_TYPES.ONE_WAY]: '#00ffff',
  [TILE_TYPES.COLLAPSIBLE]: '#ffff00',
  [TILE_TYPES.DEADLY]: '#ff0000',
  [TILE_TYPES.CONVEYOR]: '#ff00ff',
};

export class TileMap {
  public static readonly TILE_SIZE = 8; // Each tile is 8x8 pixels
  public static readonly COLUMNS = LEVEL_COLUMNS;
  public static readonly ROWS = LEVEL_ROWS;
  public static readonly WIDTH = TileMap.COLUMNS * TileMap.TILE_SIZE;
  public static readonly ORIGIN_X = (CANVAS_WIDTH - TileMap.WIDTH) / 2;
  public static readonly ORIGIN_Y = 0;
  public static readonly RIGHT = TileMap.ORIGIN_X + TileMap.WIDTH;

  private static readonly THIN_TILE_HEIGHT = TileMap.TILE_SIZE / 2;

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
    return tile === TILE_TYPES.SOLID
      || tile === TILE_TYPES.ONE_WAY
      || tile === TILE_TYPES.COLLAPSIBLE
      || tile === TILE_TYPES.CONVEYOR;
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

  private getTileHeight(tile: TileType, row: number): number {
    if (row === TileMap.ROWS - 1) {
      return TileMap.TILE_SIZE;
    }

    return tile === TILE_TYPES.ONE_WAY
      || tile === TILE_TYPES.COLLAPSIBLE
      || tile === TILE_TYPES.CONVEYOR
      ? TileMap.THIN_TILE_HEIGHT
      : TileMap.TILE_SIZE;
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
          this.getTileHeight(tile, row),
        );
      }
    }
  }
}
