# Manic Miner Technical Specifications

## 1. Resolution and Grid
* **Canvas Resolution:** 320x200 pixels (Amstrad CPC Mode 1 aspect ratio mapping).
* **Display Scaling:** The internal canvas remains 320x200. Its CSS display size
  uses the largest integer scale that fits the browser viewport so presentation
  can grow without changing coordinates, timing, collisions or movement.
  Fractional scaling is used only when the viewport is smaller than the native
  canvas.
* **Playable Area:** The cavern occupies 256x128 pixels, centered horizontally
  in the top of the canvas and arranged as a 32x16 grid of 8x8 pixel tiles.
* **HUD Area:** The bottom 72 pixels are reserved for the level name, remaining
  time, lives and score.
* **Sprite Frame:** Miner Willy's animation frames occupy a 16x16 pixel cell,
  but his visible body is taller than it is wide and does not fill the entire
  frame.
* **Provisional Visual Bounds:** Until sprite artwork is implemented, Willy is
  rendered as an 8x16 rectangle and collectibles as 7x7 rectangles. One-way,
  collapsible and conveyor tiles use visible heights of 5, 6 and 7 pixels
  respectively.
* **Provisional Collision Body:** Until sprite masks are implemented, Willy's
  8x16 pixel collision body matches the visible placeholder exactly. Invisible
  pixels must not collide with terrain or hazards.

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
* **Mid-Air Collisions:** Solid tiles affect the two components of the jump differently:
  * **Ceiling Hit:** If his head touches a ceiling during the ascent phase,
    upward and horizontal movement stop instantly, and he enters the falling
    phase immediately.
  * **Side Wall:** A side collision suppresses only that tick's horizontal
    step. The vertical arc and locked jump direction continue, allowing Willy
    to resume horizontal movement if he rises above or falls below the wall.
* **Fall Damage:** Falling from a height greater than 4 tiles (32 pixels) results in instant death.

## 4. Collision Rules
* **Tile-Based:** Collisions are evaluated against the 8x8 grid.
* **Solid Tiles:** Block Willy from every direction.
* **One-Way Platforms:** Can be crossed from below and from either side. Willy
  lands on their top surface only while descending, when his feet cross the
  platform between the previous and current game tick.
* **Collapsible Tiles (Crumbling Floors):** Each tile accumulates one wear step
  per simulation tick while Willy stands on it. Wear does not recover when he
  moves away. The tile progressively loses visible height and disappears after
  seven accumulated ticks, turning into `EMPTY` space. With the provisional
  8-pixel collision body, this makes one uninterrupted walking pass consume a
  tile completely, matching observed Amstrad CPC traversal. The Spectrum's
  [documented eight-frame behavior][zx-spectrum-tas] uses a different
  cell-contact model, so the exact CPC timing remains subject to frame-by-frame
  confirmation.
* **Deadly Tiles:** Any intersection with spikes or environmental hazards
  triggers the death sequence immediately. Static hazards will require
  pixel-mask collision once their sprites are available.
* **Conveyor Tiles:** A conveyor supports Willy from above and moves him in its
  defined horizontal direction.
  * Once Willy is walking on a conveyor, its direction takes control. Opposite
    directional input cannot turn him around, and he cannot start a jump
    against the conveyor.
  * There is a landing exception. If Willy lands on a conveyor from a jump
    whose locked direction is opposite to the conveyor, he keeps that direction
    for the landing moment. Jumping again immediately allows him to launch
    against the conveyor.
  * If that immediate jump is not taken, the conveyor assumes control and the
    opportunity is lost. Willy cannot later turn around or jump against it
    while he remains grounded on the conveyor.
  * The precise input window on the landing tick, including whether the jump
    button may be held before contact, must be confirmed against the Amstrad CPC
    version during implementation.
* **Collectibles:** A collectible disappears when Willy's collision body
  overlaps its 8x8 cell.
* **Exit:** The exit remains locked until every collectible has been collected.
  Entering the unlocked 16x16 exit marks the cavern as complete.

## 5. Lives and Level Restarts
* **Starting Lives:** A new game starts with 3 lives.
* **Life Loss:** Touching a deadly tile immediately consumes one life.
* **Full Restart:** When a life remains, the entire cavern restarts from its
  initial state. This includes Willy's position and all collected items, and
  will also include the air supply, enemies and mutable terrain as those
  systems are added.
* **Game Over:** Losing the final life stops the simulation.
* **Air Supply:** Running out of air will also consume a life, but the air
  countdown and its death condition are not implemented yet.

## 6. Timing and Frame Rate
* **Game Speed:** The game logic advances at 12.5 ticks per second.
* **Browser Loop:** Rendering uses `requestAnimationFrame`, while game logic is
  advanced through a fixed 12.5 Hz accumulator so movement does not depend on
  the display refresh rate.

[zx-spectrum-tas]: https://tasvideos.org/7913S
