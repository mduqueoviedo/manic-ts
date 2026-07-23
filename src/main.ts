import { InputHandler } from './core/InputHandler';
import { GameSession } from './core/GameSession';
import { fitCanvasToViewport } from './core/CanvasDisplay';
import { centralCavern } from './levels/centralCavern';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  LOGIC_TICK_RATE,
  MILLISECONDS_PER_SECOND,
} from './core/GameConfig';

const BACKGROUND_COLOR = '#000000';
const CANVAS_ID = 'game-canvas';

function getCanvas(): HTMLCanvasElement {
  const element = document.getElementById(CANVAS_ID);

  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error(`Canvas element "#${CANVAS_ID}" was not found.`);
  }

  return element;
}

function getRenderingContext(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('A 2D canvas context is required to run the game.');
  }

  return context;
}

const canvas = getCanvas();
const ctx = getRenderingContext(canvas);

function resizeCanvasDisplay(): void {
  fitCanvasToViewport(canvas, window.innerWidth, window.innerHeight);
}

const TICK_TIME = MILLISECONDS_PER_SECOND / LOGIC_TICK_RATE;
let lastTime = 0;
let accumulatedTime = 0;

const input = new InputHandler();
const gameSession = new GameSession(centralCavern);

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
resizeCanvasDisplay();
window.addEventListener('resize', resizeCanvasDisplay);

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
