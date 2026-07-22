import type {
  CollectibleObject,
  ExitObject,
  LevelDefinition,
  LevelObject,
} from '../levels/LevelDefinition';
import type { MinerWilly } from '../entities/MinerWilly';
import { TileMap } from './TileMap';

const COLLECTIBLE_COLOR = '#ffffff';
const EXIT_LOCKED_COLOR = '#0000ff';
const EXIT_UNLOCKED_COLOR = '#ffff00';
const EXIT_COMPLETE_COLOR = '#00ff00';

export class LevelState {
  private static readonly COLLECTIBLE_SIZE = TileMap.TILE_SIZE / 2;
  private static readonly COLLECTIBLE_OFFSET =
    (TileMap.TILE_SIZE - LevelState.COLLECTIBLE_SIZE) / 2;
  private static readonly EXIT_SIZE_IN_TILES = 2;
  private static readonly EXIT_SIZE =
    TileMap.TILE_SIZE * LevelState.EXIT_SIZE_IN_TILES;
  private static readonly STROKE_ALIGNMENT_OFFSET = 0.5;
  private static readonly STROKE_INSET_TOTAL =
    LevelState.STROKE_ALIGNMENT_OFFSET + LevelState.STROKE_ALIGNMENT_OFFSET;

  private readonly collectibles: readonly CollectibleObject[];
  private readonly exit: ExitObject | undefined;
  private readonly collected = new Set<CollectibleObject>();
  private levelComplete = false;

  constructor(level: LevelDefinition) {
    this.collectibles = level.objects.filter(LevelState.isCollectible);
    this.exit = level.objects.find(LevelState.isExit);
  }

  public get remainingCollectibles(): number {
    return this.collectibles.length - this.collected.size;
  }

  public get isExitUnlocked(): boolean {
    return this.remainingCollectibles === 0;
  }

  public get isComplete(): boolean {
    return this.levelComplete;
  }

  public update(willy: MinerWilly): void {
    for (const collectible of this.collectibles) {
      if (
        !this.collected.has(collectible)
        && this.overlapsObject(willy, collectible, TileMap.TILE_SIZE)
      ) {
        this.collected.add(collectible);
      }
    }

    if (
      this.exit
      && this.isExitUnlocked
      && this.overlapsObject(willy, this.exit, LevelState.EXIT_SIZE)
    ) {
      this.levelComplete = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (const collectible of this.collectibles) {
      if (!this.collected.has(collectible)) {
        this.renderCollectible(ctx, collectible);
      }
    }

    if (this.exit) {
      this.renderExit(ctx, this.exit);
    }
  }

  private renderCollectible(
    ctx: CanvasRenderingContext2D,
    collectible: CollectibleObject,
  ): void {
    const x = this.getObjectX(collectible) + LevelState.COLLECTIBLE_OFFSET;
    const y = this.getObjectY(collectible) + LevelState.COLLECTIBLE_OFFSET;

    ctx.fillStyle = COLLECTIBLE_COLOR;
    ctx.fillRect(
      x,
      y,
      LevelState.COLLECTIBLE_SIZE,
      LevelState.COLLECTIBLE_SIZE,
    );
  }

  private renderExit(ctx: CanvasRenderingContext2D, exit: ExitObject): void {
    const x = this.getObjectX(exit);
    const y = this.getObjectY(exit);
    const strokeOffset = LevelState.STROKE_ALIGNMENT_OFFSET;

    ctx.fillStyle = this.getExitColor();
    ctx.fillRect(x, y, LevelState.EXIT_SIZE, LevelState.EXIT_SIZE);

    ctx.strokeStyle = COLLECTIBLE_COLOR;
    ctx.strokeRect(
      x + strokeOffset,
      y + strokeOffset,
      LevelState.EXIT_SIZE - LevelState.STROKE_INSET_TOTAL,
      LevelState.EXIT_SIZE - LevelState.STROKE_INSET_TOTAL,
    );
  }

  private overlapsObject(
    willy: MinerWilly,
    object: LevelObject,
    size: number,
  ): boolean {
    return willy.overlapsRectangle(
      this.getObjectX(object),
      this.getObjectY(object),
      size,
      size,
    );
  }

  private getObjectX(object: LevelObject): number {
    return TileMap.ORIGIN_X + object.column * TileMap.TILE_SIZE;
  }

  private getObjectY(object: LevelObject): number {
    return TileMap.ORIGIN_Y + object.row * TileMap.TILE_SIZE;
  }

  private getExitColor(): string {
    if (this.levelComplete) {
      return EXIT_COMPLETE_COLOR;
    }

    return this.isExitUnlocked ? EXIT_UNLOCKED_COLOR : EXIT_LOCKED_COLOR;
  }

  private static isCollectible(object: LevelObject): object is CollectibleObject {
    return object.type === 'COLLECTIBLE';
  }

  private static isExit(object: LevelObject): object is ExitObject {
    return object.type === 'EXIT';
  }
}
