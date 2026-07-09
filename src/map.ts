export const TILE_SIZE = 8
export const WIDTH = 320   // Adjusted to classic standard
export const HEIGHT = 200  // Adjusted to classic standard
export const TILES_X = WIDTH / TILE_SIZE  // 40 tiles horizontally
export const TILES_Y = HEIGHT / TILE_SIZE // 25 tiles vertically

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  solid: boolean
}

export interface Level {
  platforms: Platform[]
}

export const testLevel: Level = {
  platforms: [
    // Floor (Row 24)
    { x: 0, y: HEIGHT - TILE_SIZE, width: WIDTH, height: TILE_SIZE, solid: true },
    
    // Left platform (Row 18)
    { x: 0, y: 144, width: 96, height: TILE_SIZE, solid: true },
    
    // Middle higher platform (Row 14)
    { x: 112, y: 112, width: 96, height: TILE_SIZE, solid: true },
    
    // Right platform (Row 18)
    { x: 224, y: 144, width: 96, height: TILE_SIZE, solid: true },
    
    // Upper left platform (Row 8)
    { x: 32, y: 64, width: 80, height: TILE_SIZE, solid: true },
    
    // Upper right platform (Row 8)
    { x: 208, y: 64, width: 80, height: TILE_SIZE, solid: true },
  ],
}