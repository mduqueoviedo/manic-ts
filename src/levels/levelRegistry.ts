import type { LevelDefinition } from './LevelDefinition';
import { centralCavern } from './01-central-cavern';

const LEVEL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function defineLevelRegistry<
  const Levels extends readonly LevelDefinition[],
>(levels: Levels): Levels {
  const ids = new Set<string>();

  for (const [index, level] of levels.entries()) {
    const expectedNumber = index + 1;

    if (level.number !== expectedNumber) {
      throw new Error(
        `Level "${level.name}" is at registry position ${expectedNumber}`
        + ` but declares number ${level.number}.`,
      );
    }

    if (!LEVEL_ID_PATTERN.test(level.id)) {
      throw new Error(
        `Level id "${level.id}" must be a lowercase kebab-case slug.`,
      );
    }

    if (ids.has(level.id)) {
      throw new Error(`Duplicate level id "${level.id}".`);
    }

    ids.add(level.id);
  }

  return levels;
}

/**
 * Source of truth for the original cavern sequence.
 *
 * Numeric level-directory prefixes mirror this order for navigation, while
 * this explicit registry controls progression at runtime.
 */
export const LEVELS = defineLevelRegistry([
  centralCavern,
] as const);
