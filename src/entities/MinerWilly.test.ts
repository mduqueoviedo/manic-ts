import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../core/InputHandler';
import {
  definePixelMask,
  mirrorPixelMask,
  type PixelMask,
} from '../collision/PixelMask';
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

function createSurfaceRow(
  symbol: '#' | '<' | '>',
  firstColumn: number = 0,
  lastColumn: number = TileMap.COLUMNS - 1,
): string {
  return (
    ' '.repeat(firstColumn)
    + symbol.repeat(lastColumn - firstColumn + 1)
  ).padEnd(TileMap.COLUMNS);
}

// The sheet stores the right-facing phases from leftmost to rightmost sprite
// position. Willy starts on its third phase, then wraps through 4, 1 and 2.
// Horizontal source offsets are removed because world movement applies them.
const EXPECTED_RIGHT_MASKS: readonly PixelMask[] = [
  definePixelMask([
    '.........##.....',
    '......#####.....',
    '.....#####......',
    '......##.#......',
    '......#####.....',
    '......####......',
    '.......##.......',
    '......####......',
    '.....######.....',
    '.....######.....',
    '....####.###....',
    '....#####.##....',
    '......####......',
    '.....###.##.....',
    '.....##.###.....',
    '.....###.###....',
  ]),
  definePixelMask([
    '.........##.....',
    '......#####.....',
    '.....#####......',
    '......##.#......',
    '......#####.....',
    '......####......',
    '.......##.......',
    '......####......',
    '.....######.....',
    '....########....',
    '...##########...',
    '...##.####.##...',
    '......#####.....',
    '.....###.##.#...',
    '....##....###...',
    '....###....#....',
  ]),
  definePixelMask([
    '.........##.....',
    '......#####.....',
    '.....#####......',
    '......##.#......',
    '......#####.....',
    '......####......',
    '.......##.......',
    '......####......',
    '.....######.....',
    '.....######.....',
    '....####.###....',
    '....#####.##....',
    '......####......',
    '.....###.##.....',
    '.....##.###.....',
    '.....###.###....',
  ]),
  definePixelMask([
    '.........##.....',
    '......#####.....',
    '.....#####......',
    '......##.#......',
    '......#####.....',
    '......####......',
    '.......##.......',
    '......####......',
    '.....##.###.....',
    '.....##.###.....',
    '.....##.###.....',
    '.....###.##.....',
    '......####......',
    '.......##.......',
    '.......##.......',
    '.......###......',
  ]),
];

function createTileMap(rows: Readonly<Record<number, string>> = {}): TileMap {
  const tiles = createEmptyTileRows();

  for (const [row, tilesAtRow] of Object.entries(rows)) {
    tiles[Number(row)] = tilesAtRow;
  }

  return new TileMap(createTestLevel({ name: 'Movement test', tiles }));
}

describe('MinerWilly', () => {
  it('aligns the terrain envelope with the visible horizontal body', () => {
    const willy = new MinerWilly(START_X, START_Y);

    expect(willy.collisionX).toBe(willy.x + 4);
    expect(willy.collisionY).toBe(willy.y);
    expect(MinerWilly.COLLISION_WIDTH).toBe(9);
    expect(MinerWilly.COLLISION_HEIGHT).toBe(16);
  });

  it('walks by one fixed horizontal step while supported', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(START_X + HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y);
  });

  it('moves with a conveyor while idle or pressing against it', () => {
    const leftConveyor = createTileMap({
      [GROUND_ROW]: createSurfaceRow('<'),
    });
    const rightConveyor = createTileMap({
      [GROUND_ROW]: createSurfaceRow('>'),
    });
    const leftWilly = new MinerWilly(START_X, START_Y);
    const rightWilly = new MinerWilly(START_X, START_Y);

    leftWilly.update(NO_INPUT, leftConveyor);
    leftWilly.update(RIGHT_INPUT, leftConveyor);
    rightWilly.update(NO_INPUT, rightConveyor);
    rightWilly.update(LEFT_INPUT, rightConveyor);

    expect(leftWilly.x).toBe(START_X - 2 * HORIZONTAL_STEP);
    expect(rightWilly.x).toBe(START_X + 2 * HORIZONTAL_STEP);
  });

  it('locks a jump launched from a conveyor to its direction', () => {
    const tileMap = createTileMap({
      [GROUND_ROW]: createSurfaceRow('<'),
    });
    const willy = new MinerWilly(START_X, START_Y);
    const opposingJump: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };

    willy.update(opposingJump, tileMap);
    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(START_X - 2 * HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y + JUMP_Y_OFFSETS[1]);
  });

  it('walks against a conveyor while the opposing direction stays pressed', () => {
    const tileMap = createTileMap({
      [GROUND_ROW]: `######${'<'.repeat(TileMap.COLUMNS - 6)}`,
    });
    const willy = new MinerWilly(START_X, START_Y);
    const jumpRight: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };

    willy.update(jumpRight, tileMap);

    for (let frame = 1; frame < JUMP_Y_OFFSETS.length; frame++) {
      willy.update(RIGHT_INPUT, tileMap);
    }

    const landingX = START_X + JUMP_Y_OFFSETS.length * HORIZONTAL_STEP;
    expect({ x: willy.x, y: willy.y, grounded: willy.isGrounded }).toEqual({
      x: landingX,
      y: START_Y,
      grounded: true,
    });

    willy.update(RIGHT_INPUT, tileMap);
    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(landingX + 2 * HORIZONTAL_STEP);

    willy.update(jumpRight, tileMap);
    expect(willy.x).toBe(landingX + 3 * HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y - FIRST_JUMP_RISE);
  });

  it('hands control back after opposing conveyor input is released', () => {
    const tileMap = createTileMap({
      [GROUND_ROW]: `######${'<'.repeat(TileMap.COLUMNS - 6)}`,
    });
    const willy = new MinerWilly(START_X, START_Y);
    const jumpRight: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };

    willy.update(jumpRight, tileMap);
    for (let frame = 1; frame < JUMP_Y_OFFSETS.length; frame++) {
      willy.update(RIGHT_INPUT, tileMap);
    }

    const landingX = willy.x;
    willy.update(NO_INPUT, tileMap);
    expect(willy.x).toBe(landingX - HORIZONTAL_STEP);

    willy.update(jumpRight, tileMap);
    expect(willy.x).toBe(landingX - 2 * HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y - FIRST_JUMP_RISE);
  });

  it('hands control to the conveyor after opposing travel hits a wall', () => {
    const wallColumn = 12;
    const wallRow = `${' '.repeat(wallColumn)}#`.padEnd(TileMap.COLUMNS);
    const tileMap = createTileMap({
      2: wallRow,
      3: wallRow,
      [GROUND_ROW]: `######${'<'.repeat(TileMap.COLUMNS - 6)}`,
    });
    const willy = new MinerWilly(START_X, START_Y);
    const jumpRight: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };

    willy.update(jumpRight, tileMap);
    for (let frame = 1; frame < JUMP_Y_OFFSETS.length; frame++) {
      willy.update(RIGHT_INPUT, tileMap);
    }

    let previousX = willy.x;
    let conveyorTookControl = false;
    for (let tick = 0; tick < 10; tick++) {
      willy.update(RIGHT_INPUT, tileMap);
      if (willy.x < previousX) {
        conveyorTookControl = true;
        break;
      }
      previousX = willy.x;
    }

    expect(conveyorTookControl).toBe(true);
    const capturedX = willy.x;

    willy.update(jumpRight, tileMap);

    expect(willy.x).toBe(capturedX - HORIZONTAL_STEP);
    expect(willy.y).toBe(START_Y - FIRST_JUMP_RISE);
  });

  it('stands still after landing on a lower opposing conveyor', () => {
    const lowerConveyorRow = GROUND_ROW + 2;
    const upperPlatform = `${' '.repeat(START_COLUMN)}##`
      .padEnd(TileMap.COLUMNS);
    const tileMap = createTileMap({
      [GROUND_ROW]: upperPlatform,
      [lowerConveyorRow]: createSurfaceRow('<'),
    });
    const willy = new MinerWilly(START_X, START_Y);
    const jumpRight: PlayerInput = {
      ...RIGHT_INPUT,
      isJumpPressed: true,
    };

    willy.update(jumpRight, tileMap);
    for (let frame = 1; frame < JUMP_Y_OFFSETS.length; frame++) {
      willy.update(RIGHT_INPUT, tileMap);
    }
    for (let tick = 0; tick < 8 && !willy.isGrounded; tick++) {
      willy.update(RIGHT_INPUT, tileMap);
    }

    const standingX = willy.x;
    const lowerSurfaceY =
      lowerConveyorRow * TileMap.TILE_SIZE
      - MinerWilly.COLLISION_HEIGHT;

    expect({ y: willy.y, grounded: willy.isGrounded }).toEqual({
      y: lowerSurfaceY,
      grounded: true,
    });
    willy.update(RIGHT_INPUT, tileMap);
    willy.update(RIGHT_INPUT, tileMap);
    expect(willy.x).toBe(standingX);

    willy.update(jumpRight, tileMap);
    expect({ x: willy.x, y: willy.y }).toEqual({
      x: standingX,
      y: lowerSurfaceY - FIRST_JUMP_RISE,
    });

    for (let frame = 1; frame < JUMP_Y_OFFSETS.length; frame++) {
      willy.update(RIGHT_INPUT, tileMap);
    }

    expect({ x: willy.x, y: willy.y, grounded: willy.isGrounded }).toEqual({
      x: standingX,
      y: lowerSurfaceY,
      grounded: true,
    });

    willy.update(RIGHT_INPUT, tileMap);
    expect(willy.x).toBe(standingX);

    willy.update(NO_INPUT, tileMap);
    expect(willy.x).toBe(standingX - HORIZONTAL_STEP);
  });

  it('stops conveyor movement at a solid wall', () => {
    const wallRow = `${' '.repeat(WALL_COLUMN)}#`.padEnd(TileMap.COLUMNS);
    const tileMap = createTileMap({
      2: wallRow,
      3: wallRow,
      [GROUND_ROW]: createSurfaceRow('>'),
    });
    const flushWithWall =
      TileMap.ORIGIN_X
      + WALL_COLUMN * TileMap.TILE_SIZE
      - MinerWilly.COLLISION_WIDTH
      - 4;
    const willy = new MinerWilly(flushWithWall, START_Y);

    willy.update(NO_INPUT, tileMap);

    expect(willy.x).toBe(flushWithWall);
    expect(willy.isGrounded).toBe(true);
  });

  it('falls vertically after a conveyor pushes him off its edge', () => {
    const tileMap = createTileMap({
      [GROUND_ROW]: createSurfaceRow('>', START_COLUMN, START_COLUMN),
    });
    const edgeX =
      TileMap.ORIGIN_X
      + (START_COLUMN + 1) * TileMap.TILE_SIZE
      - MinerWilly.COLLISION_WIDTH
      - 4;
    const willy = new MinerWilly(edgeX, START_Y);

    for (let tick = 0; tick < 5 && willy.isGrounded; tick++) {
      willy.update(LEFT_INPUT, tileMap);
    }

    expect(willy.isGrounded).toBe(false);
    const fallX = willy.x;

    willy.update(RIGHT_INPUT, tileMap);

    expect(willy.x).toBe(fallX);
    expect(willy.y).toBe(START_Y + 4);
  });

  it('preserves all four source silhouettes while walking right', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);
    const actualMasks = [willy.collisionMask];

    for (let phase = 1; phase < EXPECTED_RIGHT_MASKS.length; phase++) {
      willy.update(RIGHT_INPUT, tileMap);
      actualMasks.push(willy.collisionMask);
    }

    expect(actualMasks).toEqual(EXPECTED_RIGHT_MASKS);

    for (const mask of actualMasks) {
      expect(mask.height).toBe(MinerWilly.SPRITE_HEIGHT);
      expect(mask.rows[0]).not.toBe(0);
      expect(mask.rows[MinerWilly.SPRITE_HEIGHT - 1]).not.toBe(0);
    }
  });

  it('mirrors every source phase exactly while walking left', () => {
    const tileMap = createTileMap({ [GROUND_ROW]: SOLID_TILE_ROW });
    const willy = new MinerWilly(START_X, START_Y);
    const expectedLeftMasks = [
      EXPECTED_RIGHT_MASKS[3],
      EXPECTED_RIGHT_MASKS[2],
      EXPECTED_RIGHT_MASKS[1],
      EXPECTED_RIGHT_MASKS[0],
    ].map(mirrorPixelMask);

    for (const expectedMask of expectedLeftMasks) {
      willy.update(LEFT_INPUT, tileMap);
      expect(willy.collisionMask).toEqual(expectedMask);
    }
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
