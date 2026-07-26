import { describe, expect, it } from 'vitest';
import { centralCavern } from './01-central-cavern';
import { defineLevelRegistry, LEVELS } from './levelRegistry';

describe('level registry', () => {
  it('defines the playable cavern sequence explicitly', () => {
    expect(LEVELS).toEqual([centralCavern]);
    expect(LEVELS.map(({ id, number }) => ({ id, number }))).toEqual([
      { id: 'central-cavern', number: 1 },
    ]);
  });

  it('rejects a level whose declared number disagrees with its position', () => {
    const misplacedLevel = {
      ...centralCavern,
      number: 2,
    };

    expect(() => defineLevelRegistry([misplacedLevel])).toThrow(
      'is at registry position 1 but declares number 2',
    );
  });

  it('rejects an unstable level id format', () => {
    const invalidIdLevel = {
      ...centralCavern,
      id: 'Central Cavern',
    };

    expect(() => defineLevelRegistry([invalidIdLevel])).toThrow(
      'must be a lowercase kebab-case slug',
    );
  });

  it('rejects duplicate stable ids', () => {
    const secondLevel = {
      ...centralCavern,
      number: 2,
      name: 'Second cavern',
    };

    expect(() => defineLevelRegistry([
      centralCavern,
      secondLevel,
    ])).toThrow('Duplicate level id "central-cavern"');
  });
});
