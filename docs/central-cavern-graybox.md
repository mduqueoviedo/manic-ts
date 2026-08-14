# Central Cavern Graybox Audit

This audit separates structural level accuracy from placeholder artwork. Its
purpose is to keep the 32x16 gameplay grid stable while movement and level
mechanics are implemented.

## Scope

The audit covers:

- terrain type and position;
- Willy's initial position;
- collectible, hazard and exit cells;
- conveyor extent and direction.

It does not cover final sprite colors, tile artwork, HUD layout or enemy
implementation.

## References

- [CPC-Power Manic Miner archive][cpc-power] for Amstrad CPC release metadata
  and screenshots.
- [MobyGames Central Cavern screenshot][mobygames] for a clean capture of the
  initial Amstrad CPC cavern.
- [The Spriters Resource Miner Willy sheet][willy-sheet] for the exact 16x16
  source grid of the four ZX Spectrum movement phases, cross-checked against
  the matching Willy silhouettes in CPC captures.
- [JSW/MM community conveyor discussion][conveyor-discussion] for the
  CPC-specific ability to travel right against Central Cavern's left-moving
  conveyor under the landing exception.

Reference images remain external and are not copied into this repository.

## Audited layout

The CPC playfield is directly measurable as 256x128 pixels: 32 columns by
16 rows of 8x8 cells. The existing terrain rows match the reference captures.

| Element | Audited position |
| --- | --- |
| Cavern walls | Columns 0 and 31 |
| Bottom floor | Row 15 |
| Conveyor | Row 9, columns 8-27, moving left |
| Solid blocks | Row 8, columns 17-19; row 12, columns 20-22 |
| Collapsible floor | Row 5, columns 14-17 and 19-22; row 12, columns 23-27 |
| Willy spawn | Pixel position (16, 104), relative to the cavern |
| Exit | Column 29, row 13; 16x16 pixels |

Collectibles are at `(9, 0)`, `(29, 0)`, `(16, 1)`, `(24, 4)` and `(30, 6)`.
Deadly cells are at `(11, 0)`, `(16, 0)`, `(23, 4)`, `(27, 4)`, `(21, 8)`
and `(12, 12)`.

## Findings

- Terrain geometry, spawn, collectibles, hazards and exit positions already
  match the CPC captures.
- The conveyor was previously encoded as moving right. CPC behavior confirms
  that it moves left, so the level symbol and tile model now preserve its
  direction explicitly.
- Solid terrain now uses the measured red-and-green CPC brick bond. Raised
  horizontal blocks normalize their captured transparent leading scanline
  above the tile, aligning their visible top with Willy's feet and adjacent
  collapsible floors, and finish with a complete red lower scanline. Vertically
  chained side-wall cells retain a complete red upper scanline to close each
  seam. Their collision geometry remains the full 8x8 solid cell.
- Collapsible tiles now degrade independently over seven accumulated support
  ticks. One uninterrupted walking pass removes them completely, and a life
  restart returns them to their initial state.
- Collapsible placeholder wear changes color without changing the audited
  six-pixel visual envelope.
- Conveyors now move Willy in their declared direction, override opposite
  grounded input and lock new jumps to that direction. Their graybox rendering
  cycles through the four recorded CPC phases for a left-moving conveyor and
  mirrors the complete cycle for right-moving definitions. The top band moves
  left, the next band stays fixed, the third moves right and the lower five
  rows remain fixed. This layered motion makes the direction readable at the
  original resolution.
- Willy's four movement silhouettes and all six static-hazard masks were
  measured from a CPC gameplay capture. Static-hazard contact now compares
  occupied pixels instead of rectangular envelopes.
- The raised-block jump below the conveyor hazard is covered by an automated
  route regression using the exact blue floor, three overhead solid blocks,
  conveyor and plant rows. Willy remains under the last overhead block long
  enough to hit it with his head, then falls vertically onto the raised
  blocks without touching the plant. The conveyor remains traversable from
  below.
- A CPC frame-by-frame capture confirms that horizontal jumps apply one
  2-pixel horizontal step on each of the 18 arc frames. The launch input has
  no preliminary walking step or stationary transition tick, and the landing
  frame is not vertical-only.
- Landing against a conveyor preserves opposing movement while its direction
  remains pressed. Releasing the direction or meeting an obstacle hands control
  back to the belt. A safe landing on a lower conveyor instead holds Willy
  stationary and permits vertical jumps while the opposing direction remains
  pressed. Route completion cannot be signed off until the Central Cavern
  enemy and the remaining route checks are implemented.
- Seven static route checks now run against the Central Cavern definition,
  including the lower plant and both side ledges. They verify exact landing
  positions and reject any static-hazard contact.
- The conveyor-to-left-ledge transition is currently unreachable with the
  provisional 9x16 terrain envelope. Willy descends through the ledge height
  before his footprint can overlap it, so collision geometry needs CPC-specific
  validation before the complete route can be signed off.

## Placeholder dimensions

These dimensions describe visible placeholder bounds, not collision masks.

| Element | Placeholder size |
| --- | --- |
| Willy's sprite cell | 16x16 pixels |
| Willy's terrain collision envelope | 9x16 pixels, offset 4px into the cell |
| Collectible | 7x7 pixels |
| One-way floor | 8x5 pixels |
| Collapsible floor | 8x6 pixels |
| Conveyor | Four 8x8 animation-mask phases |
| Solid tile artwork | Horizontal and vertical 8x8 brick masks |
| Static-hazard mask cell | 8x8 pixels |
| Exit | 16x16 pixels |

## Route checklist

See the [Central Cavern route checklist](./central-cavern-route-checklist.md)
for reproducible launch positions, automated coverage and the manual sequence.

## Remaining validation

- Resolve the conveyor-to-left-ledge route blocker against a CPC reference.
- Extend route regression through the upper items and back to the exit.
- Check for unintended shortcuts and trapping positions.
- Confirm the provisional seven-contact collapsible-floor lifetime frame by
  frame against the Amstrad CPC version.
- Extend pixel-mask collision to other sprite interactions when their artwork
  and frame data become available.

[cpc-power]: https://www.cpc-power.com/index.php?num=1347&page=detail
[mobygames]: https://www.mobygames.com/game/6440/manic-miner/screenshots/cpc/441969/
[willy-sheet]: https://www.spriters-resource.com/zx_spectrum/manicminer/asset/113060/
[conveyor-discussion]: https://jswmm.co.uk/topic/580-automated-generation-of-manic-miner-speedrunwalkthrough/?comment=14676&do=findComment
