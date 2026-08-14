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

const COMPLETE_JUMP_TICKS = 18;

function cavernX(relativeX: number): number {
  return TileMap.ORIGIN_X + relativeX;
}

function jumpUntilLanding(
  willy: MinerWilly,
  tileMap: TileMap,
  launchInput: PlayerInput,
  heldInput: PlayerInput,
): void {
  willy.update(launchInput, tileMap);

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
    willy.update(heldInput, tileMap);
  }

  expect(
    tileMap.overlapsDeadlyTile(
      willy.x,
      willy.y,
      willy.deadlyCollisionMask,
    ),
  ).toBe(false);
  expect(willy.isGrounded).toBe(true);
}

describe('Central Cavern static route', () => {
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
});
