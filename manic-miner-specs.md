# Manic Miner Technical Specifications

## 1. Resolution and Grid
* **Native Resolution:** 320x200 pixels (Amstrad CPC Mode 1 aspect ratio mapping).
* **Tile Grid:** The screen is divided into 8x8 pixel character blocks.
* **Sprite Sizes:** Miner Willy and most enemies fit within a 16x16 pixel bounding box (2x2 tiles).

## 2. Movement Mechanics (Miner Willy)
* **Horizontal Speed:** Fixed speed. Willy moves exactly 2 pixels per frame horizontally. No inertia, no acceleration, no deceleration.
* **Directional Locking:** Willy can face 'LEFT' or 'RIGHT'.

## 3. Jumping Mechanics (The Rigid Curve)
* **The Golden Rule:** Willy **cannot** change his horizontal direction while in the air. 
  * If jumping from a standstill, he goes straight up and straight down.
  * If jumping while moving right, he follows a fixed parabolic arc to the right and cannot stop or turn left until he touches solid ground.
* **Jump Duration & Arc:** A standard jump lasts exactly 36 frames (or game ticks).
  * First 18 frames: Upward vertical movement. The upward speed decreases at fixed steps every few frames.
  * Remaining 18 frames: Downward vertical movement (falling).
* **Mid-Air Collisions (Interruption):** If Willy hits a solid tile during a jump, his current momentum is canceled:
  * **Ceiling Hit:** If his head touches a ceiling during the ascent phase, upward movement stops instantly, and he enters the falling phase immediately.
  * **Wall Hit:** If his side touches a wall mid-parabola, horizontal movement drops to zero instantly. Willy will fall strictly vertically from that exact X coordinate.
* **Fall Damage:** Falling from a height greater than 4 tiles (32 pixels) results in instant death.

## 4. Collision Rules
* **Tile-Based:** Collisions are evaluated against the 8x8 grid.
* **Solid Tiles:** Block horizontal movement if overlapping.
* **Collapsible Tiles (Crumbling Floors):** When Willy stands on them, their visual state changes, and they disappear completely after a fixed number of frames, turning into 'EMPTY' space.
* **Deadly Tiles:** Any intersection with spikes or environmental hazards triggers the death sequence immediately.

## 5. Timing and Frame Rate
* **Game Speed:** The original game logic ticks at 25 frames per second (FPS). 
* **Vite Loop Adaption:** Since the modern loop runs at 60 FPS (`step = 1000 / 60`), movement updates must be scaled to match the original 25 ticks per second behavior without drifting.