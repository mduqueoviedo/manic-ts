import { describe, expect, it } from 'vitest';
import type { LevelDefinition } from '../levels/LevelDefinition';
import type { PlayerInput } from './InputHandler';
import { GameSession } from './GameSession';

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
  return {
    name: 'Hazard test',
    spawn: { x: 0, y: 8 },
    tiles: [
      '                                ',
      '  !                             ',
      '                                ',
      '################################',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '                                ',
      '################################',
    ],
    objects: [
      { type: 'COLLECTIBLE', column: 0, row: 1 },
      { type: 'EXIT', column: 28, row: 1 },
    ],
  };
}

describe('GameSession', () => {
  it('consumes a life and fully restarts the level after touching a hazard', () => {
    const session = new GameSession(createLevel());
    const spawn = session.playerPosition;

    session.update(NO_INPUT);
    expect(session.remainingCollectibles).toBe(0);

    for (let tick = 0; tick < 10 && session.livesRemaining === 3; tick++) {
      session.update(RIGHT_INPUT);
    }

    expect(session.livesRemaining).toBe(2);
    expect(session.playerPosition).toEqual(spawn);
    expect(session.remainingCollectibles).toBe(1);
    expect(session.isGameOver).toBe(false);
  });

  it('stops updating after the final life is lost', () => {
    const session = new GameSession(createLevel(), 1);

    for (let tick = 0; tick < 4; tick++) {
      session.update(RIGHT_INPUT);
    }

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
    for (let tick = 0; tick < 10 && session.livesRemaining === 3; tick++) {
      session.update(RIGHT_INPUT);
    }

    expect(session.livesRemaining).toBe(2);
    session.update(NO_INPUT);
    expect(session.remainingCollectibles).toBe(0);

    session.restartGame();

    expect(session.livesRemaining).toBe(3);
    expect(session.playerPosition).toEqual(spawn);
    expect(session.remainingCollectibles).toBe(1);
    expect(session.isGameOver).toBe(false);
  });
});
