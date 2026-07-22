// Define the type of tiles available in the cavern
export const TILE_TYPES = {
  EMPTY: 0,
  SOLID: 1,       // Walls and floors that block movement from every direction
  COLLAPSIBLE: 2, // Floors that crumble when stepped on
  DEADLY: 3,      // Spikes or hazards
  ONE_WAY: 4      // Platforms that only support Willy while he is descending
} as const;

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

export class TileMap {
  public static readonly TILE_SIZE = 8; // Each tile is 8x8 pixels
  public static readonly COLUMNS = 40;  // 40 columns * 8px = 320px width
  public static readonly ROWS = 16;     // 16 rows * 8px = 128px play area height
  
  // A simple matrix representing a basic test level structure
  private grid: TileType[][];

  constructor() {
    this.grid = this.createEmptyGrid();
    this.buildTestLevel();
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
    const column = Math.floor(x / TileMap.TILE_SIZE);
    const row = Math.floor(y / TileMap.TILE_SIZE);

    return this.getTileAtGrid(column, row);
  }

  /**
   * Identifies tiles that block movement from every direction.
   */
  public isSolidTile(tile: TileType | undefined): boolean {
    return tile === TILE_TYPES.SOLID;
  }

  /**
   * Initializes a completely empty grid filled with zeros.
   */
  private createEmptyGrid(): TileType[][] {
    return Array.from({ length: TileMap.ROWS }, () => 
      Array(TileMap.COLUMNS).fill(TILE_TYPES.EMPTY)
    );
  }

  /**
   * Fills the matrix with a temporary layout to test rendering.
   */
  private buildTestLevel(): void {
    // Create a solid ground floor at the bottom row
    for (let col = 0; col < TileMap.COLUMNS; col++) {
      this.grid[TileMap.ROWS - 1][col] = TILE_TYPES.SOLID;
    }

    // Add a fully solid platform
    this.grid[12][5] = TILE_TYPES.SOLID;
    this.grid[12][6] = TILE_TYPES.SOLID;
    this.grid[12][7] = TILE_TYPES.SOLID;

    // Add a one-way platform
    this.grid[10][18] = TILE_TYPES.ONE_WAY;
    this.grid[10][19] = TILE_TYPES.ONE_WAY;
    this.grid[10][20] = TILE_TYPES.ONE_WAY;
    this.grid[10][21] = TILE_TYPES.ONE_WAY;

    // Add a collapsible platform
    this.grid[12][27] = TILE_TYPES.COLLAPSIBLE;
    this.grid[12][28] = TILE_TYPES.COLLAPSIBLE;
    this.grid[12][29] = TILE_TYPES.COLLAPSIBLE;

    // Add a couple of deadly spike tiles
    this.grid[14][15] = TILE_TYPES.DEADLY;
    this.grid[14][16] = TILE_TYPES.DEADLY;
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

        // Assign sharp, distinct colors depending on the tile behavior
        if (tile === TILE_TYPES.SOLID) {
          ctx.fillStyle = '#00ff00'; // Bright green for solid ground
        } else if (tile === TILE_TYPES.ONE_WAY) {
          ctx.fillStyle = '#00ffff'; // Cyan for one-way platforms
        } else if (tile === TILE_TYPES.COLLAPSIBLE) {
          ctx.fillStyle = '#ffff00'; // Yellow for collapsible floors
        } else if (tile === TILE_TYPES.DEADLY) {
          ctx.fillStyle = '#ff0000'; // Bright red for spikes
        }

        // Draw the specific 8x8 pixel tile block
        ctx.fillRect(col * size, row * size, size, size);
      }
    }
  }
}
