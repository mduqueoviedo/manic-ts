# Manic Miner Technical Specifications

## 1. Resolution and Grid
* **Canvas Resolution:** 320x200 pixels (Amstrad CPC Mode 1 aspect ratio mapping).
* **Playable Area:** The cavern occupies 256x128 pixels, centered horizontally
  in the top of the canvas and arranged as a 32x16 grid of 8x8 pixel tiles.
* **HUD Area:** The bottom 72 pixels are reserved for the level name, remaining
  time, lives and score.
* **Sprite Frame:** Miner Willy's animation frames occupy a 16x16 pixel cell,
  but his visible body is taller than it is wide and does not fill the entire
  frame.
* **Provisional Collision Body:** Until sprite masks are implemented, Willy uses
  a centered 10x16 pixel collision body.

## 2. Movement Mechanics (Miner Willy)
* **Horizontal Speed:** Fixed speed. Willy moves exactly 2 pixels per frame horizontally. No inertia, no acceleration, no deceleration.
* **Directional Locking:** Willy can face 'LEFT' or 'RIGHT'.

## 3. Jumping Mechanics (The Rigid Curve)
* **The Golden Rule:** Willy **cannot** change his horizontal direction while in the air. 
  * If jumping from a standstill, he goes straight up and straight down.
  * If jumping while moving right, he follows a fixed parabolic arc to the right and cannot stop or turn left until he touches solid ground.
* **Jump Duration & Arc:** A standard jump lasts exactly 18 frames (or game ticks)
  and rises 20 pixels above its starting position.
  * First 9 frames: Upward vertical movement. The upward speed decreases at fixed steps every few frames.
  * Remaining 9 frames: Downward vertical movement (falling).
  * There are no stationary frames at the apex: vertical movement changes
    directly from 1 pixel upward to 1 pixel downward.
* **Mid-Air Collisions (Interruption):** If Willy hits a solid tile during a jump, his current momentum is canceled:
  * **Ceiling Hit:** If his head touches a ceiling during the ascent phase, upward movement stops instantly, and he enters the falling phase immediately.
  * **Wall Hit:** If his side touches a wall mid-parabola, horizontal movement drops to zero instantly. Willy will fall strictly vertically from that exact X coordinate.
* **Fall Damage:** Falling from a height greater than 4 tiles (32 pixels) results in instant death.

## 4. Collision Rules
* **Tile-Based:** Collisions are evaluated against the 8x8 grid.
* **Solid Tiles:** Block Willy from every direction.
* **One-Way Platforms:** Can be crossed from below and from either side. Willy
  lands on their top surface only while descending, when his feet cross the
  platform between the previous and current game tick.
* **Collapsible Tiles (Crumbling Floors):** When Willy stands on them, their visual state changes, and they disappear completely after a fixed number of frames, turning into 'EMPTY' space.
* **Deadly Tiles:** Any intersection with spikes or environmental hazards triggers the death sequence immediately.

## 5. Timing and Frame Rate
* **Game Speed:** The game logic advances at 12.5 ticks per second.
* **Browser Loop:** Rendering uses `requestAnimationFrame`, while game logic is
  advanced through a fixed 12.5 Hz accumulator so movement does not depend on
  the display refresh rate.
