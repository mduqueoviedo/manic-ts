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
* **Provisional Visual Bounds:** Willy is rendered from the monochrome pixels
  of his four CPC movement masks, without final sprite colors. Collectibles
  remain 7x7 rectangles. One-way and collapsible tiles use visible heights of
  5 and 6 pixels respectively. Conveyors use four CPC-derived directional 8x8
  animation masks. Solid terrain uses the measured red-and-green CPC brick
  pattern: horizontal blocks normalize their transparent leading scanline
  above the collision cell and close their lower edge in red, while vertically
  chained wall cells close their upper edge with a complete red row.
* **Collision Geometry:** Willy keeps a provisional 9x16 terrain envelope,
  aligned four pixels from the left edge of his sprite cell. Removing the
  always-empty rightmost column lets his visible silhouette meet walls without
  changing the established left-side alignment. Static-hazard and level-object
  overlap uses the occupied pixels of his current 16x16 movement mask.
  Static-hazard collision adds a one-pixel horizontal guard to the captured
  silhouette.

## 2. Movement Mechanics (Miner Willy)
* **Horizontal Speed:** Fixed speed. Willy moves exactly 2 pixels per frame horizontally. No inertia, no acceleration, no deceleration.
* **Directional Locking:** Willy can face 'LEFT' or 'RIGHT'.
* **Walking Off Ledges:** Leaving a ledge starts a strictly vertical fall.
  Horizontal input and the previous walking direction are ignored until Willy
  lands.

## 3. Jumping Mechanics (The Rigid Curve)
* **The Golden Rule:** Willy **cannot** change his horizontal direction while in the air.
  * If jumping from a standstill, he goes straight up and straight down.
  * If jumping while moving right, he follows a fixed parabolic arc to the right and cannot stop or turn left until he touches solid ground.
* **Jump Duration & Arc:** A standard jump lasts exactly 18 frames (or game ticks)
  and rises 20 pixels above its starting position.
  * The launch input applies the first arc frame immediately; it does not add
    a preliminary walking step or a stationary transition tick.
  * A horizontal jump advances 2 pixels on every arc frame, including the
    landing frame, for a total horizontal distance of 36 pixels.
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
* **Fall Damage:** Fall safety follows the original airborne-counter behavior
  [documented by the Manic Miner community][movement-explanation]. Walking off
  a ledge starts with an empty distance budget: landing after 40 pixels is
  fatal, while the last tile-aligned safe landing is 32 pixels below the
  starting surface. If Willy exhausts his jump arc or hits a ceiling before
  landing, the fall counter is already equivalent to 16 pixels; landing after
  another 24 pixels is fatal. The life is consumed on landing rather than while
  Willy is still airborne.

## 4. Collision Rules
* **Tile-Based:** Collisions are evaluated against the 8x8 grid.
* **Solid Tiles:** Block Willy from every direction. Their full 8x8 collision
  cell is independent of the transparent first scanline in the horizontal
  brick artwork.
* **One-Way Platforms:** Can be crossed from below and from either side. Willy
  lands on their top surface only while descending, when his feet cross the
  platform between the previous and current game tick.
* **Collapsible Tiles (Crumbling Floors):** Each tile accumulates one wear step
  per simulation tick while Willy stands on it. Wear does not recover when he
  moves away. The tile progressively loses visible height and disappears after
  seven accumulated ticks, turning into `EMPTY` space. With the provisional
  terrain collision body, this makes one uninterrupted walking pass consume a
  tile completely, matching observed Amstrad CPC traversal. The Spectrum's
  [documented eight-frame behavior][zx-spectrum-tas] uses a different
  cell-contact model, so the exact CPC timing remains subject to frame-by-frame
  confirmation.
* **Deadly Tiles:** An occupied pixel shared by Willy's current animation mask
  and a static-hazard mask triggers the death sequence immediately. Central
  Cavern defines one 8x8 mask per obstacle variant and reuses it for every
  matching placement.
* **Conveyor Tiles:** A conveyor supports Willy from above and moves him in its
  defined horizontal direction. Its four recorded directional masks advance
  once per simulation tick, independently of the browser render rate. The top
  row moves two pixels in the conveyor direction, the next row stays fixed,
  and the third row moves two pixels in the opposite direction. The remaining
  five rows stay fixed, creating the appearance of a belt rotating around its
  rollers. Like a one-way platform, the conveyor itself can be crossed from
  below; nearby solid tiles still cause ceiling contacts.
  * Once Willy is walking on a conveyor, its direction takes control. Opposite
    directional input cannot turn him around, and he cannot start a jump
    against the conveyor.
  * There is a landing exception. If Willy lands on a conveyor from a jump
    whose locked direction is opposite to the conveyor, holding that direction
    lets him keep walking against the belt. He can also jump in that direction.
  * Releasing the opposing direction or walking into an obstacle hands control
    back to the conveyor. The opposing movement cannot be recovered while
    Willy remains grounded on the belt.
  * A safe landing on a conveyor below the jump's starting height has a
    different exception. Holding the direction opposite to the conveyor keeps
    Willy stationary rather than moving against it. Jumping while continuing
    to hold that direction produces a vertical jump, and the stationary state
    resumes after landing for as long as the direction remains held.
  * Releasing the opposing direction while stationary or during its vertical
    jump hands control back to the conveyor after landing.
  * The precise input window on the landing tick, including whether the jump
    button may be held before contact, must be confirmed against the Amstrad CPC
    version during route validation.
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

## 6. Level Definitions
* **Directory Order:** Each cavern lives in a two-digit, sequence-prefixed
  directory such as `01-central-cavern`. The prefix makes the original
  20-cavern order visible while browsing the source tree.
* **Runtime Order:** `levelRegistry.ts` is the source of truth for progression.
  It lists caverns explicitly and rejects declared level numbers that do not
  match their one-based registry position or reuse an existing stable ID.
* **Stable Identity:** Every level definition has a slug-like ID for future
  persisted state, a sequence number and its player-facing name.
* **Local Variants:** Cavern-specific masks live beside their level definition.
  A local catalog may contain multiple visual variants of the same broad
  entity type, and each placement selects the appropriate variant. Assets
  should move to a shared catalog only after multiple caverns genuinely reuse
  them.
* **Optional Modules:** Additional files such as `enemies.ts` or
  `mechanisms.ts` should be introduced within a cavern directory when its
  complexity warrants them; simple caverns do not need empty placeholder
  modules.

## 7. Timing and Frame Rate
* **Game Speed:** The game logic advances at 12.5 ticks per second.
* **Browser Loop:** Rendering uses `requestAnimationFrame`, while game logic is
  advanced through a fixed 12.5 Hz accumulator so movement does not depend on
  the display refresh rate.

[zx-spectrum-tas]: https://tasvideos.org/7913S
[movement-explanation]: https://jswmm.co.uk/topic/890-mm-movement-and-collision-detection-explanation/
