export const LEVEL_COLUMNS = 32;
export const LEVEL_ROWS = 16;

export interface LevelPosition {
  readonly x: number;
  readonly y: number;
}

export interface CollectibleObject {
  readonly type: 'COLLECTIBLE';
  readonly column: number;
  readonly row: number;
}

export interface ExitObject {
  readonly type: 'EXIT';
  readonly column: number;
  readonly row: number;
}

export type LevelObject = CollectibleObject | ExitObject;

export interface DeadlyMaskDefinition {
  readonly column: number;
  readonly row: number;
  readonly pixels: readonly string[];
}

export interface LevelDefinition {
  readonly name: string;
  /** Pixel position relative to the top-left corner of the cavern. */
  readonly spawn: LevelPosition;
  readonly tiles: readonly string[];
  readonly objects: readonly LevelObject[];
  readonly deadlyMasks?: readonly DeadlyMaskDefinition[];
}
