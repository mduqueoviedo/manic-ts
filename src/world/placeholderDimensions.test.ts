import { describe, expect, it } from 'vitest';
import { MinerWilly } from '../entities/MinerWilly';
import { centralCavern } from '../levels/centralCavern';
import { LevelState } from './LevelState';
import { TileMap } from './TileMap';

interface FillRectCall {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function createRecordingContext(): {
  readonly ctx: CanvasRenderingContext2D;
  readonly fillRectCalls: FillRectCall[];
} {
  const fillRectCalls: FillRectCall[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    fillRect(x: number, y: number, width: number, height: number): void {
      fillRectCalls.push({ x, y, width, height });
    },
    strokeRect(): void {},
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fillRectCalls };
}

describe('CPC-sized visual placeholders', () => {
  it('renders Willy with the visible bounds of his initial frame', () => {
    const { ctx, fillRectCalls } = createRecordingContext();
    const willy = new MinerWilly(16, 104);

    willy.render(ctx, 0);

    expect(fillRectCalls).toEqual([
      { x: 16, y: 104, width: 8, height: 16 },
    ]);
  });

  it('renders collectibles with their audited visual bounds', () => {
    const { ctx, fillRectCalls } = createRecordingContext();
    const levelState = new LevelState(centralCavern);

    levelState.render(ctx);

    expect(fillRectCalls[0]).toEqual({
      x: TileMap.ORIGIN_X + 9 * TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y,
      width: 7,
      height: 7,
    });
    expect(fillRectCalls).toContainEqual({
      x: TileMap.ORIGIN_X + 29 * TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y + 13 * TileMap.TILE_SIZE,
      width: 16,
      height: 16,
    });
  });

  it('renders each platform type with its audited resting height', () => {
    const { ctx, fillRectCalls } = createRecordingContext();
    const tileMap = new TileMap(centralCavern);

    tileMap.render(ctx);

    expect(fillRectCalls).toContainEqual({
      x: TileMap.ORIGIN_X + TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y + 5 * TileMap.TILE_SIZE,
      width: 8,
      height: 5,
    });
    expect(fillRectCalls).toContainEqual({
      x: TileMap.ORIGIN_X + 14 * TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y + 5 * TileMap.TILE_SIZE,
      width: 8,
      height: 6,
    });
    expect(fillRectCalls).toContainEqual({
      x: TileMap.ORIGIN_X + 8 * TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y + 9 * TileMap.TILE_SIZE,
      width: 8,
      height: 7,
    });
    expect(fillRectCalls).toContainEqual({
      x: TileMap.ORIGIN_X + TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y + 15 * TileMap.TILE_SIZE,
      width: 8,
      height: 5,
    });
    expect(fillRectCalls).toContainEqual({
      x: TileMap.ORIGIN_X + 11 * TileMap.TILE_SIZE,
      y: TileMap.ORIGIN_Y,
      width: 8,
      height: 8,
    });
  });
});
