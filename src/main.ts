import { TileMap } from './world/TileMap';
import { InputHandler } from './core/InputHandler';
import { MinerWilly } from './entities/MinerWilly';
import { centralCavern } from './levels/centralCavern';
import { LevelState } from './world/LevelState';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  LOGIC_TICK_RATE,
  MILLISECONDS_PER_SECOND,
} from './core/GameConfig';

const BACKGROUND_COLOR = '#000000';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const TICK_TIME = MILLISECONDS_PER_SECOND / LOGIC_TICK_RATE;
let lastTime = 0;
let accumulatedTime = 0;

const tileMap = new TileMap(centralCavern);
const levelState = new LevelState(centralCavern);
const input = new InputHandler();

const willy = new MinerWilly(
  TileMap.ORIGIN_X + centralCavern.spawn.x,
  TileMap.ORIGIN_Y + centralCavern.spawn.y,
);

/**
 * Updates the game simulation.
 */
function update(): void {
  willy.update(input, tileMap);
  levelState.update(willy);
}

/**
 * Renders all game visual modules.
 */
function render(interpolationAlpha: number): void {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  tileMap.render(ctx);
  levelState.render(ctx);
  willy.render(ctx, interpolationAlpha);
}

function gameLoop(currentTime: number): void {
  if (!lastTime) lastTime = currentTime;
  
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulatedTime += deltaTime;

  while (accumulatedTime >= TICK_TIME) {
    update();
    accumulatedTime -= TICK_TIME;
  }

  render(accumulatedTime / TICK_TIME);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
