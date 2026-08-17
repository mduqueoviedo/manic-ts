import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../../core/InputHandler';
import { MinerWilly } from '../../entities/MinerWilly';
import { LevelState } from '../../world/LevelState';
import { TileMap } from '../../world/TileMap';
import { centralCavern } from '.';

const RIGHT_INPUT: PlayerInput = {
  isLeftPressed: false,
  isRightPressed: true,
  isJumpPressed: false,
};

const JUMP_RIGHT_INPUT: PlayerInput = {
  ...RIGHT_INPUT,
  isJumpPressed: true,
};

const LEFT_INPUT: PlayerInput = {
  isLeftPressed: true,
  isRightPressed: false,
  isJumpPressed: false,
};

const JUMP_LEFT_INPUT: PlayerInput = {
  ...LEFT_INPUT,
  isJumpPressed: true,
};

const JUMP_INPUT: PlayerInput = {
  isLeftPressed: false,
  isRightPressed: false,
  isJumpPressed: true,
};

const NO_INPUT: PlayerInput = {
  isLeftPressed: false,
  isRightPressed: false,
  isJumpPressed: false,
};

const COMPLETE_JUMP_TICKS = 18;
const MAX_LANDING_TICKS = COMPLETE_JUMP_TICKS + 2;

function cavernX(relativeX: number): number {
  return TileMap.ORIGIN_X + relativeX;
}

function updateRoute(
  willy: MinerWilly,
  tileMap: TileMap,
  input: PlayerInput,
  levelState?: LevelState,
): void {
  willy.update(input, tileMap);

  if (levelState && willy.isGrounded) {
    tileMap.wearCollapsibleTilesBelow(
      willy.collisionX,
      MinerWilly.COLLISION_WIDTH,
      willy.collisionY + MinerWilly.COLLISION_HEIGHT,
    );
  }

  expect(
    tileMap.overlapsDeadlyTile(
      willy.x,
      willy.y,
      willy.deadlyCollisionMask,
    ),
  ).toBe(false);
  levelState?.update(willy);
}

function jumpUntilLanding(
  willy: MinerWilly,
  tileMap: TileMap,
  launchInput: PlayerInput,
  heldInput: PlayerInput,
  levelState?: LevelState,
): void {
  updateRoute(willy, tileMap, launchInput, levelState);

  for (
    let tick = 1;
    tick < MAX_LANDING_TICKS && !willy.isGrounded;
    tick++
  ) {
    updateRoute(willy, tileMap, heldInput, levelState);
  }

  expect(willy.isGrounded).toBe(true);
}

function updateRouteTicks(
  willy: MinerWilly,
  tileMap: TileMap,
  input: PlayerInput,
  ticks: number,
  levelState: LevelState,
): void {
  for (let tick = 0; tick < ticks; tick++) {
    updateRoute(willy, tileMap, input, levelState);
  }
}

describe('Central Cavern route', () => {
  it.each([
    {
      transition: 'from the spawn floor to the lower platform',
      start: { x: centralCavern.spawn.x, y: centralCavern.spawn.y },
      landing: { x: 40, y: 88 },
      launchInput: JUMP_RIGHT_INPUT,
      heldInput: RIGHT_INPUT,
    },
    {
      transition: 'over the lower-platform plant',
      start: { x: 68, y: 88 },
      landing: { x: 104, y: 88 },
      launchInput: JUMP_RIGHT_INPUT,
      heldInput: RIGHT_INPUT,
    },
    {
      transition: 'from the lower platform to the raised blocks',
      start: { x: 136, y: 88 },
      landing: { x: 148, y: 80 },
      launchInput: JUMP_RIGHT_INPUT,
      heldInput: RIGHT_INPUT,
    },
    {
      transition: 'from the collapsible floor to the right ledge',
      start: { x: 200, y: 80 },
      landing: { x: 224, y: 64 },
      launchInput: JUMP_RIGHT_INPUT,
      heldInput: RIGHT_INPUT,
    },
    {
      transition: 'from the right ledge to the conveyor',
      start: { x: 220, y: 64 },
      landing: { x: 188, y: 56 },
      launchInput: JUMP_LEFT_INPUT,
      heldInput: LEFT_INPUT,
    },
    {
      transition: 'from the conveyor to the lower-left platform',
      start: { x: 64, y: 56 },
      landing: { x: 28, y: 56 },
      launchInput: JUMP_LEFT_INPUT,
      heldInput: LEFT_INPUT,
    },
    {
      transition: 'from the lower-left platform to the left ledge',
      start: { x: 16, y: 56 },
      landing: { x: 16, y: 40 },
      launchInput: JUMP_INPUT,
      heldInput: NO_INPUT,
    },
    {
      transition: 'from the left ledge to the upper platform',
      start: { x: 8, y: 40 },
      landing: { x: 32, y: 24 },
      launchInput: JUMP_RIGHT_INPUT,
      heldInput: RIGHT_INPUT,
    },
  ])(
    'supports the jump $transition',
    ({ start, landing, launchInput, heldInput }) => {
      const tileMap = new TileMap(centralCavern);
      const willy = new MinerWilly(cavernX(start.x), start.y);

      jumpUntilLanding(willy, tileMap, launchInput, heldInput);

      expect({ x: willy.x, y: willy.y }).toEqual({
        x: cavernX(landing.x),
        y: landing.y,
      });
    },
  );

  it('reaches the right-wall collectible and returns to the ledge', () => {
    const tileMap = new TileMap(centralCavern);
    const levelState = new LevelState(centralCavern);
    const willy = new MinerWilly(cavernX(224), 64);

    willy.update(JUMP_RIGHT_INPUT, tileMap);
    levelState.update(willy);

    for (
      let tick = 1;
      tick < COMPLETE_JUMP_TICKS && !willy.isGrounded;
      tick++
    ) {
      expect(
        tileMap.overlapsDeadlyTile(
          willy.x,
          willy.y,
          willy.deadlyCollisionMask,
        ),
      ).toBe(false);
      willy.update(RIGHT_INPUT, tileMap);
      levelState.update(willy);
    }

    expect(willy.isGrounded).toBe(true);
    expect({ x: willy.x, y: willy.y }).toEqual({
      x: cavernX(235),
      y: 64,
    });
    expect(levelState.remainingCollectibles).toBe(
      centralCavern.objects.filter(({ type }) => type === 'COLLECTIBLE').length
        - 1,
    );
  });

  it('completes the current cavern route in one life', () => {
    const tileMap = new TileMap(centralCavern);
    const levelState = new LevelState(centralCavern);
    const willy = new MinerWilly(
      cavernX(centralCavern.spawn.x),
      centralCavern.spawn.y,
    );

    const jumpRight = (): void => {
      jumpUntilLanding(
        willy,
        tileMap,
        JUMP_RIGHT_INPUT,
        RIGHT_INPUT,
        levelState,
      );
    };
    const jumpLeft = (): void => {
      jumpUntilLanding(
        willy,
        tileMap,
        JUMP_LEFT_INPUT,
        LEFT_INPUT,
        levelState,
      );
    };
    const jumpVertical = (): void => {
      jumpUntilLanding(willy, tileMap, JUMP_INPUT, NO_INPUT, levelState);
    };
    const moveRight = (ticks: number): void => {
      updateRouteTicks(willy, tileMap, RIGHT_INPUT, ticks, levelState);
    };
    const moveLeft = (ticks: number): void => {
      updateRouteTicks(willy, tileMap, LEFT_INPUT, ticks, levelState);
    };
    const expectPosition = (x: number, y: number): void => {
      expect({ x: willy.x, y: willy.y }).toEqual({ x: cavernX(x), y });
    };
    const waitForPosition = (
      x: number,
      y: number,
      maxTicks: number,
    ): void => {
      for (
        let tick = 0;
        tick < maxTicks
          && !(willy.x === cavernX(x) && willy.y === y && willy.isGrounded);
        tick++
      ) {
        updateRoute(willy, tileMap, NO_INPUT, levelState);
      }
      expectPosition(x, y);
    };

    // Reach the right ledge and collect the item against the cavern wall.
    jumpRight();
    moveRight(14);
    jumpRight();
    moveRight(16);
    jumpRight();
    moveRight(8);
    jumpRight();
    jumpRight();
    expectPosition(224, 64);
    jumpRight();
    expectPosition(235, 64);
    expect(levelState.remainingCollectibles).toBe(4);

    // Cross the conveyor plant and climb to the upper platform.
    jumpLeft();
    expectPosition(203, 56);
    moveLeft(9);
    jumpLeft();
    expectPosition(153, 48);
    jumpLeft();
    expectPosition(117, 56);
    moveLeft(26);
    expectPosition(65, 56);
    jumpLeft();
    expectPosition(29, 56);
    moveLeft(6);
    jumpVertical();
    jumpRight();
    expectPosition(41, 24);

    // Collect all four upper items without resetting collapsible-floor state.
    moveRight(2);
    jumpRight();
    expectPosition(81, 24);
    expect(levelState.remainingCollectibles).toBe(3);
    jumpRight();
    expectPosition(117, 24);
    jumpRight();
    expectPosition(153, 24);
    expect(levelState.remainingCollectibles).toBe(2);
    moveRight(6);
    jumpRight();
    expectPosition(201, 24);
    moveLeft(4);
    expect(levelState.remainingCollectibles).toBe(1);
    jumpRight();
    expectPosition(229, 24);
    jumpVertical();
    expect(levelState.remainingCollectibles).toBe(0);
    expect(levelState.isExitUnlocked).toBe(true);

    // Open the safe return hole, descend and enter the unlocked exit.
    jumpLeft();
    jumpLeft();
    jumpLeft();
    expectPosition(121, 24);
    waitForPosition(121, 56, 20);
    moveLeft(28);
    jumpLeft();
    expectPosition(29, 56);
    moveRight(4);
    waitForPosition(37, 88, 12);
    moveRight(16);
    jumpRight();
    moveRight(16);
    jumpRight();
    moveRight(8);
    jumpRight();
    expectPosition(201, 80);
    waitForPosition(201, 104, 20);

    for (let tick = 0; tick < 20 && !levelState.isComplete; tick++) {
      updateRoute(willy, tileMap, RIGHT_INPUT, levelState);
    }
    expect(levelState.isComplete).toBe(true);
  });
});
