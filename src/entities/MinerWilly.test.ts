import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../core/InputHandler';
import {
  createEmptyTileRows,
  createTestLevel,
  SOLID_TILE_ROW,
} from '../test/levelFixtures';
import { TileMap } from '../world/TileMap';
import { MinerWilly } from './MinerWilly';

const GROUND_ROW = 4;
const START_COLUMN = 4;
const WALL_COLUMN = 5;
const HORIZONTAL_STEP = 2;
const FIRST_JUMP_RISE = 4;
const START_X = TileMap.ORIGIN_X + START_COLUMN * TileMap.TILE_SIZE;
const START_Y =
  GROUND_ROW * TileMap.TILE_SIZE - MinerWilly.COLLISION_HEIGHT;

const NO_INPUT: PlayerInput = {
  isLeftPressed: false,
  isRightPressed: false,
  isJumpPressed: false,
};

const RIGHT_INPUT: PlayerInput = {
  ...NO_INPUT,
  isRightPressed: true,
};

function createTileMap(rows: Readonly<Record<number, string>> = {}): TileMap {
  const tiles = createEmptyTileRows();

  for (const [row, tilesAtRow] of Object.entries(rows)) {
    tiles[Number(row)] = tilesAtRow;
  }

  return new TileMap(createTestLevel({ name: 'Movement test', tiles }));
}

describe('MinerWilly', () => {
  it('walks by one fixed horizontal step while supported', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(START_X + HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y);
  });

  it('keeps the launch direction throughout a jump', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);
    const jumpRight: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };
    const changeToLeft: PlayerInput = {
      ...NO_INPUT,
      isLeftPressed: true,
    };

    willy.update(jumpRight, tileMap);
    willy.update(changeToLeft, tileMap);

    expect(willy.x).toBe(START_X + 2 * HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y - FIRST_JUMP_RISE);
  });

  it('stops at a solid wall instead of entering it', () => {
    const wallRow = `${' '.repeat(WALL_COLUMN)}#`.padEnd(TileMap.COLUMNS);
    const tileMap = createTileMap({
      2: wallRow,
      3: wallRow,
      [GROUND_ROW]: SOLID_TILE_ROW,
    });
    const flushWithWall =
      TileMap.ORIGIN_X
      + WALL_COLUMN * TileMap.TILE_SIZE
      - MinerWilly.COLLISION_WIDTH
      - (MinerWilly.SPRITE_WIDTH - MinerWilly.COLLISION_WIDTH) / 2;
    const willy = new MinerWilly(flushWithWall, START_Y);

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(flushWithWall);
  });

  it('uses strict rectangle overlap at collision-body edges', () => {
    const willy = new MinerWilly(START_X, START_Y);

    expect(
      willy.overlapsRectangle(
        willy.collisionX + MinerWilly.COLLISION_WIDTH,
        willy.collisionY,
        TileMap.TILE_SIZE,
        TileMap.TILE_SIZE,
      ),
    ).toBe(false);
    expect(
      willy.overlapsRectangle(
        willy.collisionX + MinerWilly.COLLISION_WIDTH - 1,
        willy.collisionY,
        TileMap.TILE_SIZE,
        TileMap.TILE_SIZE,
      ),
    ).toBe(true);
  });
});
