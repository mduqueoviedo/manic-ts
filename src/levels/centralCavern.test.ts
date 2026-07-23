import { describe, expect, it } from 'vitest';
import { TILE_TYPES, TileMap } from '../world/TileMap';
import { centralCavern } from './centralCavern';

describe('Central Cavern graybox', () => {
  it('matches the audited CPC terrain layout', () => {
    expect(centralCavern.tiles).toEqual([
      '#          !    !              #',
      '#                              #',
      '#                              #',
      '#                              #',
      '#                      !   !   #',
      '#-------------xxxx-xxxx--------#',
      '#                              #',
      '#---                           #',
      '#                ### !         #',
      '#----   <<<<<<<<<<<<<<<<<<<<   #',
      '#                            --#',
      '#                              #',
      '#           !       ###xxxxx---#',
      '#    ---------------           #',
      '#                              #',
      '#------------------------------#',
    ]);
  });

  it('matches the audited spawn and level-object positions', () => {
    expect(centralCavern.spawn).toEqual({ x: 16, y: 104 });
    expect(centralCavern.objects).toEqual([
      { type: 'COLLECTIBLE', column: 9, row: 0 },
      { type: 'COLLECTIBLE', column: 29, row: 0 },
      { type: 'COLLECTIBLE', column: 16, row: 1 },
      { type: 'COLLECTIBLE', column: 24, row: 4 },
      { type: 'COLLECTIBLE', column: 30, row: 6 },
      { type: 'EXIT', column: 29, row: 13 },
    ]);
  });

  it('identifies the Central Cavern conveyor as moving left', () => {
    const tileMap = new TileMap(centralCavern);
    const conveyorX = TileMap.ORIGIN_X + 8 * TileMap.TILE_SIZE;
    const conveyorY = TileMap.ORIGIN_Y + 9 * TileMap.TILE_SIZE;

    expect(tileMap.getTileAtPixel(conveyorX, conveyorY)).toBe(
      TILE_TYPES.CONVEYOR_LEFT,
    );
  });
});
