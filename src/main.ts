import { TileMap } from './world/TileMap';
import { InputHandler } from './core/InputHandler';
import { MinerWilly } from './entities/MinerWilly';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = 320;
canvas.height = 200;

const TARGET_FPS = 25;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastTime = 0;
let accumulatedTime = 0;

const tileMap = new TileMap();
const input = new InputHandler();

// Create Willy at a temporary ground level position (y: 104 aligns with the green floor)
const willy = new MinerWilly(50, 104);

/**
 * Updates the game simulation.
 */
function update(): void {
  willy.update(input);
}

/**
 * Renders all game visual modules.
 */
function render(): void {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  tileMap.render(ctx);
  willy.render(ctx);
}

function gameLoop(currentTime: number): void {
  if (!lastTime) lastTime = currentTime;
  
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulatedTime += deltaTime;

  while (accumulatedTime >= FRAME_TIME) {
    update();
    accumulatedTime -= FRAME_TIME;
  }

  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);