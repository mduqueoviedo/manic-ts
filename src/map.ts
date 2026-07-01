export const TILE_SIZE = 8
export const WIDTH = 256
export const HEIGHT = 128
export const TILES_X = WIDTH / TILE_SIZE
export const TILES_Y = HEIGHT / TILE_SIZE

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

// Test level with multiple platforms
export const testLevel: Level = {
  platforms: [
    // Floor
    { x: 0, y: HEIGHT - 8, width: WIDTH, height: 8, solid: true },
    // Left platform
    { x: 0, y: 96, width: 80, height: 8, solid: true },
    // Middle platform
    { x: 88, y: 80, width: 80, height: 8, solid: true },
    // Right platform
    { x: 176, y: 96, width: 80, height: 8, solid: true },
    // Upper left platform
    { x: 16, y: 48, width: 64, height: 8, solid: true },
    // Upper right platform
    { x: 176, y: 48, width: 64, height: 8, solid: true },
  ],
}
