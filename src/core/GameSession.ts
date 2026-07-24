import type { PlayerInput } from './InputHandler';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_LIVES,
} from './GameConfig';
import { MinerWilly } from '../entities/MinerWilly';
import type { LevelDefinition } from '../levels/LevelDefinition';
import { LevelState } from '../world/LevelState';
import { TileMap } from '../world/TileMap';

const HUD_FONT = '8px monospace';
const HUD_COLOR = '#ffffff';
const HUD_TOP_MARGIN = 12;
const HUD_TOP = TileMap.ORIGIN_Y + TileMap.HEIGHT + HUD_TOP_MARGIN;

const GAME_OVER_FONT = '24px monospace';
const GAME_OVER_COLOR = '#ff0000';
const GAME_OVER_TEXT = 'GAME OVER';
const GAME_OVER_VERTICAL_OFFSET = 8;
const GAME_OVER_Y = CANVAS_HEIGHT / 2 - GAME_OVER_VERTICAL_OFFSET;

const RESTART_PROMPT_FONT = '10px monospace';
const RESTART_PROMPT_TEXT = 'Press 1 to restart';
const RESTART_PROMPT_GAP = 24;
const RESTART_PROMPT_Y = GAME_OVER_Y + RESTART_PROMPT_GAP;
const SCREEN_CENTER_X = CANVAS_WIDTH / 2;

/**
 * Owns the current life and recreates all level-scoped state after a death.
 */
export class GameSession {
  private tileMap!: TileMap;
  private levelState!: LevelState;
  private willy!: MinerWilly;
  private remainingLives: number;

  constructor(
    private readonly level: LevelDefinition,
    private readonly initialLives: number = INITIAL_LIVES,
  ) {
    if (!Number.isInteger(initialLives) || initialLives <= 0) {
      throw new Error('A game must start with at least one life.');
    }

    this.remainingLives = initialLives;
    this.restartLevel();
  }

  public restartGame(): void {
    this.remainingLives = this.initialLives;
    this.restartLevel();
  }

  public get livesRemaining(): number {
    return this.remainingLives;
  }

  public get isGameOver(): boolean {
    return this.remainingLives === 0;
  }

  public get remainingCollectibles(): number {
    return this.levelState.remainingCollectibles;
  }

  public get playerPosition(): Readonly<{ x: number; y: number }> {
    return { x: this.willy.x, y: this.willy.y };
  }

  public update(input: PlayerInput): void {
    if (this.isGameOver) {
      return;
    }

    this.willy.update(input, this.tileMap);
    if (this.willy.isGrounded) {
      this.tileMap.wearCollapsibleTilesBelow(
        this.willy.collisionX,
        MinerWilly.COLLISION_WIDTH,
        this.willy.collisionY + MinerWilly.COLLISION_HEIGHT,
      );
    }

    if (
      this.tileMap.overlapsDeadlyTile(
        this.willy.x,
        this.willy.y,
        this.willy.deadlyCollisionMask,
      )
    ) {
      this.loseLife();
      return;
    }

    this.levelState.update(this.willy);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    interpolationAlpha: number,
  ): void {
    this.tileMap.render(ctx);
    this.levelState.render(ctx);

    if (!this.isGameOver) {
      this.willy.render(ctx, interpolationAlpha);
    }

    this.renderHud(ctx);
  }

  private loseLife(): void {
    this.remainingLives--;

    if (!this.isGameOver) {
      this.restartLevel();
    }
  }

  private restartLevel(): void {
    this.tileMap = new TileMap(this.level);
    this.levelState = new LevelState(this.level);
    this.willy = new MinerWilly(
      TileMap.ORIGIN_X + this.level.spawn.x,
      TileMap.ORIGIN_Y + this.level.spawn.y,
    );
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    if (this.isGameOver) {
      this.renderGameOver(ctx);
      return;
    }

    ctx.font = HUD_FONT;
    ctx.textBaseline = 'top';
    ctx.fillStyle = HUD_COLOR;
    ctx.fillText(`LIVES ${this.remainingLives}`, TileMap.ORIGIN_X, HUD_TOP);
  }

  private renderGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = GAME_OVER_FONT;
    ctx.fillStyle = GAME_OVER_COLOR;
    ctx.fillText(GAME_OVER_TEXT, SCREEN_CENTER_X, GAME_OVER_Y);

    ctx.font = RESTART_PROMPT_FONT;
    ctx.fillStyle = HUD_COLOR;
    ctx.fillText(
      RESTART_PROMPT_TEXT,
      SCREEN_CENTER_X,
      RESTART_PROMPT_Y,
    );

    ctx.restore();
  }
}
