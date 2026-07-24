import { describe, expect, it } from 'vitest';
import type { LevelDefinition } from '../levels/LevelDefinition';
import {
  createEmptyTileRows,
  createTestLevel,
  EMPTY_TILE_ROW,
  SOLID_TILE_ROW,
} from '../test/levelFixtures';
import type { PlayerInput } from './InputHandler';
import { GameSession } from './GameSession';
import { TileMap } from '../world/TileMap';

const MAX_TICKS_UNTIL_DEATH = 10;
const TICKS_UNTIL_HAZARD_EDGE_CONTACT = 4;

const NO_INPUT: PlayerInput = {
  isLeftPressed: false,
  isRightPressed: false,
  isJumpPressed: false,
};

const RIGHT_INPUT: PlayerInput = {
  ...NO_INPUT,
  isRightPressed: true,
};

function createLevel(): LevelDefinition {
  const tiles = createEmptyTileRows();
  tiles[1] = '  !'.padEnd(EMPTY_TILE_ROW.length);
  tiles[3] = SOLID_TILE_ROW;
  tiles[15] = SOLID_TILE_ROW;

  return createTestLevel({
    name: 'Hazard test',
    spawn: { x: 0, y: 8 },
    tiles,
    objects: [
      { type: 'COLLECTIBLE', column: 0, row: 1 },
      { type: 'EXIT', column: 28, row: 1 },
    ],
  });
}

function createCollapsibleLevel(): LevelDefinition {
  const tiles = createEmptyTileRows();
  tiles[1] = '  !'.padEnd(EMPTY_TILE_ROW.length);
  tiles[3] = 'xxx'.padEnd(EMPTY_TILE_ROW.length);
  tiles[15] = SOLID_TILE_ROW;

  return createTestLevel({
    name: 'Collapsible floor test',
    spawn: { x: 0, y: 8 },
    tiles,
  });
}

function createFloorHazardLevel(): LevelDefinition {
  const tiles = createEmptyTileRows();
  tiles[2] = '  !'.padEnd(EMPTY_TILE_ROW.length);
  tiles[3] = SOLID_TILE_ROW;

  return createTestLevel({
    name: 'Floor hazard test',
    spawn: { x: 2 * TileMap.TILE_SIZE, y: 8 },
    tiles,
  });
}

function moveIntoHazard(session: GameSession): void {
  const livesBeforeHazard = session.livesRemaining;

  for (
    let tick = 0;
    tick < MAX_TICKS_UNTIL_DEATH
      && session.livesRemaining === livesBeforeHazard;
    tick++
  ) {
    session.update(RIGHT_INPUT);
  }

  if (session.livesRemaining === livesBeforeHazard) {
    throw new Error('Test player did not reach the hazard.');
  }
}

describe('GameSession', () => {
  it.each([0, -1, 1.5])(
    'rejects an invalid initial life count (%s)',
    (initialLives) => {
      expect(() => new GameSession(createLevel(), initialLives)).toThrow(
        'A game must start with at least one life.',
      );
    },
  );

  it('consumes a life and fully restarts the level after touching a hazard', () => {
    const session = new GameSession(createLevel());
    const spawn = session.playerPosition;

    session.update(NO_INPUT);
    expect(session.remainingCollectibles).toBe(0);

    moveIntoHazard(session);

    expect(session.livesRemaining).toBe(2);
    expect(session.playerPosition).toEqual(spawn);
    expect(session.remainingCollectibles).toBe(1);
    expect(session.isGameOver).toBe(false);
  });

  it('does not kill Willy before his visible body enters a hazard', () => {
    const session = new GameSession(createLevel());

    for (let tick = 0; tick < TICKS_UNTIL_HAZARD_EDGE_CONTACT; tick++) {
      session.update(RIGHT_INPUT);
    }

    expect(session.livesRemaining).toBe(3);

    session.update(RIGHT_INPUT);

    expect(session.livesRemaining).toBe(2);
  });

  it('keeps a floor hazard lethal during ordinary contact', () => {
    const session = new GameSession(createFloorHazardLevel());

    session.update(NO_INPUT);

    expect(session.livesRemaining).toBe(2);
  });

  it('stops updating after the final life is lost', () => {
    const session = new GameSession(createLevel(), 1);

    moveIntoHazard(session);

    expect(session.livesRemaining).toBe(0);
    expect(session.isGameOver).toBe(true);

    const deathPosition = session.playerPosition;
    session.update(RIGHT_INPUT);
    expect(session.playerPosition).toEqual(deathPosition);
  });

  it('restarts the whole game with its initial number of lives', () => {
    const session = new GameSession(createLevel());
    const spawn = session.playerPosition;

    session.update(NO_INPUT);
    moveIntoHazard(session);

    expect(session.livesRemaining).toBe(2);
    session.update(NO_INPUT);
    expect(session.remainingCollectibles).toBe(0);

    session.restartGame();

    expect(session.livesRemaining).toBe(3);
    expect(session.playerPosition).toEqual(spawn);
    expect(session.remainingCollectibles).toBe(1);
    expect(session.isGameOver).toBe(false);
  });

  it('restores collapsible floors after losing a life', () => {
    const session = new GameSession(createCollapsibleLevel());
    const spawn = session.playerPosition;

    for (let tick = 0; tick < 3; tick++) {
      session.update(NO_INPUT);
    }
    moveIntoHazard(session);

    expect(session.livesRemaining).toBe(2);
    expect(session.playerPosition).toEqual(spawn);

    for (
      let tick = 0;
      tick < TileMap.COLLAPSIBLE_LIFETIME_TICKS;
      tick++
    ) {
      session.update(NO_INPUT);
    }

    expect(session.playerPosition).toEqual(spawn);

    session.update(NO_INPUT);

    expect(session.playerPosition.y).toBe(spawn.y + 4);
  });

});
