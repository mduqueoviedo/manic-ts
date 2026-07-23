import { describe, expect, it } from 'vitest';
import { MinerWilly } from '../entities/MinerWilly';
import { createTestLevel } from '../test/levelFixtures';
import { LevelState } from './LevelState';
import { TileMap } from './TileMap';

function moveToObject(willy: MinerWilly, column: number, row: number): void {
  willy.x = TileMap.ORIGIN_X + column * TileMap.TILE_SIZE;
  willy.y = row * TileMap.TILE_SIZE;
}

describe('LevelState', () => {
  it('unlocks the exit only after every collectible has been collected', () => {
    const levelState = new LevelState(createTestLevel({
      objects: [
        { type: 'COLLECTIBLE', column: 2, row: 2 },
        { type: 'COLLECTIBLE', column: 4, row: 2 },
        { type: 'EXIT', column: 8, row: 2 },
      ],
    }));
    const willy = new MinerWilly(0, 0);

    expect(levelState.remainingCollectibles).toBe(2);
    expect(levelState.isExitUnlocked).toBe(false);

    moveToObject(willy, 2, 2);
    levelState.update(willy);
    levelState.update(willy);

    expect(levelState.remainingCollectibles).toBe(1);
    expect(levelState.isExitUnlocked).toBe(false);

    moveToObject(willy, 4, 2);
    levelState.update(willy);

    expect(levelState.remainingCollectibles).toBe(0);
    expect(levelState.isExitUnlocked).toBe(true);
  });

  it('ignores the exit while locked and completes after returning unlocked', () => {
    const levelState = new LevelState(createTestLevel({
      objects: [
        { type: 'COLLECTIBLE', column: 2, row: 2 },
        { type: 'EXIT', column: 8, row: 2 },
      ],
    }));
    const willy = new MinerWilly(0, 0);

    moveToObject(willy, 8, 2);
    levelState.update(willy);
    expect(levelState.isComplete).toBe(false);

    moveToObject(willy, 2, 2);
    levelState.update(willy);
    expect(levelState.isComplete).toBe(false);

    moveToObject(willy, 8, 2);
    levelState.update(willy);
    expect(levelState.isComplete).toBe(true);
  });

  it('starts with an unlocked exit when the level has no collectibles', () => {
    const levelState = new LevelState(createTestLevel({
      objects: [
        { type: 'EXIT', column: 8, row: 2 },
      ],
    }));

    expect(levelState.remainingCollectibles).toBe(0);
    expect(levelState.isExitUnlocked).toBe(true);
  });
});
