import {
  LEVEL_COLUMNS,
  LEVEL_ROWS,
  type LevelDefinition,
  type LevelObject,
  type LevelPosition,
} from '../levels/LevelDefinition';

export const EMPTY_TILE_ROW = ' '.repeat(LEVEL_COLUMNS);
export const SOLID_TILE_ROW = '#'.repeat(LEVEL_COLUMNS);

interface TestLevelOptions {
  readonly id?: string;
  readonly number?: number;
  readonly name?: string;
  readonly spawn?: LevelPosition;
  readonly tiles?: readonly string[];
  readonly objects?: readonly LevelObject[];
}

export function createEmptyTileRows(): string[] {
  return Array.from({ length: LEVEL_ROWS }, () => EMPTY_TILE_ROW);
}

export function createTestLevel(
  options: TestLevelOptions = {},
): LevelDefinition {
  return {
    id: options.id ?? 'test-level',
    number: options.number ?? 1,
    name: options.name ?? 'Test level',
    spawn: options.spawn ?? { x: 0, y: 0 },
    tiles: options.tiles ?? createEmptyTileRows(),
    objects: options.objects ?? [],
  };
}
