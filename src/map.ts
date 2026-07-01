export const TILE_SIZE = 8
export const WIDTH = 256
export const HEIGHT = 128
export const TILES_X = WIDTH / TILE_SIZE
export const TILES_Y = HEIGHT / TILE_SIZE

// Simple test map: floor at the bottom
export const testMap: number[][] = Array.from({ length: TILES_Y }, (_, y) => {
  if (y === TILES_Y - 1) return Array.from({ length: TILES_X }, () => 1)
  return Array.from({ length: TILES_X }, () => 0)
})
