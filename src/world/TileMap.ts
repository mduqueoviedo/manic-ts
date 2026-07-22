// Define the type of tiles available in the cavern
export const TILE_TYPES = {
  EMPTY: 0,
  SOLID: 1,      // Normal walls or floors
  COLLAPSIBLE: 2, // Floors that crumble when stepped on
  DEADLY: 3       // Spikes or hazards
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

    // Add some random platforms to verify spatial layout
    this.grid[12][5] = TILE_TYPES.SOLID;
    this.grid[12][6] = TILE_TYPES.SOLID;
    this.grid[12][7] = TILE_TYPES.SOLID;

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
        } else if (tile === TILE_TYPES.DEADLY) {
          ctx.fillStyle = '#ff0000'; // Bright red for spikes
        }

        // Draw the specific 8x8 pixel tile block
        ctx.fillRect(col * size, row * size, size, size);
      }
    }
  }
}