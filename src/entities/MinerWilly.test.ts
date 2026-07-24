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
const JUMP_Y_OFFSETS = [
  -4, -7, -10,
  -12, -14, -16, -18,
  -19, -20,
  -19, -18,
  -16, -14, -12, -10,
  -7, -4, 0,
] as const;
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

const LEFT_INPUT: PlayerInput = {
  ...NO_INPUT,
  isLeftPressed: true,
};

function createTileMap(rows: Readonly<Record<number, string>> = {}): TileMap {
  const tiles = createEmptyTileRows();

  for (const [row, tilesAtRow] of Object.entries(rows)) {
    tiles[Number(row)] = tilesAtRow;
  }

  return new TileMap(createTestLevel({ name: 'Movement test', tiles }));
}

describe('MinerWilly', () => {
  it('centers the terrain envelope within the 16-pixel sprite cell', () => {
    const willy = new MinerWilly(START_X, START_Y);

    expect(willy.collisionX).toBe(willy.x + 4);
    expect(willy.collisionY).toBe(willy.y);
    expect(MinerWilly.COLLISION_WIDTH).toBe(10);
    expect(MinerWilly.COLLISION_HEIGHT).toBe(16);
  });

  it('walks by one fixed horizontal step while supported', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(START_X + HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y);
  });

  it('keeps the wide-leg frame at the full standing height', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.collisionMask.height).toBe(MinerWilly.SPRITE_HEIGHT);
    expect(willy.collisionMask.rows[0]).not.toBe(0);
    expect(willy.collisionMask.rows[MinerWilly.SPRITE_HEIGHT - 1]).not.toBe(0);
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
    expect(willy.y).toBe(START_Y + JUMP_Y_OFFSETS[1]);
  });

  it('pairs every horizontal jump step with the complete vertical arc', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);
    const jumpRight: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };

    willy.update(jumpRight, tileMap);

    expect({ x: willy.x, y: willy.y }).toEqual({
      x: START_X + HORIZONTAL_STEP,
      y: START_Y - FIRST_JUMP_RISE,
    });

    for (let frame = 1; frame < JUMP_Y_OFFSETS.length; frame++) {
      willy.update(NO_INPUT, tileMap);

      expect({ x: willy.x, y: willy.y }).toEqual({
        x: START_X + (frame + 1) * HORIZONTAL_STEP,
        y: START_Y + JUMP_Y_OFFSETS[frame],
      });
    }

    expect(willy.isGrounded).toBe(true);
  });

  it('falls vertically after walking off a ledge', () => {
    const ledgeRow = `${' '.repeat(START_COLUMN)}#`.padEnd(TileMap.COLUMNS);
    const tileMap = createTileMap({ [GROUND_ROW]: ledgeRow });
    const ledgeX =
      TileMap.ORIGIN_X
      + START_COLUMN * TileMap.TILE_SIZE
      - 4;
    const willy = new MinerWilly(ledgeX, START_Y);

    for (let tick = 0; tick < 4; tick++) {
      willy.update(RIGHT_INPUT, tileMap);
    }

    expect(willy.isGrounded).toBe(false);
    const fallX = willy.x;

    willy.update(LEFT_INPUT, tileMap);
    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(fallX);
    expect(willy.y).toBe(START_Y + 2 * 4);
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
      - 4;
    const willy = new MinerWilly(flushWithWall, START_Y);

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(flushWithWall);
  });

  it('uses occupied sprite pixels for rectangle overlap', () => {
    const willy = new MinerWilly(START_X, START_Y);

    expect(
      willy.overlapsRectangle(
        willy.x + 11,
        willy.collisionY,
        TileMap.TILE_SIZE,
        TileMap.TILE_SIZE,
      ),
    ).toBe(false);
    expect(
      willy.overlapsRectangle(
        willy.x + 10,
        willy.collisionY,
        TileMap.TILE_SIZE,
        TileMap.TILE_SIZE,
      ),
    ).toBe(true);
  });
});
