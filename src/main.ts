import { InputHandler } from './core/InputHandler';
import { GameSession } from './core/GameSession';
import { centralCavern } from './levels/centralCavern';
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

const input = new InputHandler();
const gameSession = new GameSession(centralCavern);

/**
 * Updates the game simulation.
 */
function update(): void {
  if (input.consumeRestartRequest()) {
    gameSession.restartGame();
    return;
  }

  gameSession.update(input);
}

/**
 * Renders all game visual modules.
 */
function render(interpolationAlpha: number): void {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  gameSession.render(ctx, interpolationAlpha);
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
