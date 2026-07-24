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
- The visual placeholders now use audited bounding boxes even though they
  remain flat colored rectangles.
- Collapsible tiles now degrade independently over seven accumulated support
  ticks. One uninterrupted walking pass removes them completely, and a life
  restart returns them to their initial state.
- Collapsible placeholder wear changes color without changing the audited
  six-pixel visual envelope.
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
- Route completion cannot be signed off until conveyor movement, the Central
  Cavern enemy and the remaining route checks are implemented.

## Placeholder dimensions

These dimensions describe visible placeholder bounds, not collision masks.

| Element | Placeholder size |
| --- | --- |
| Willy's sprite cell | 16x16 pixels |
| Willy's terrain collision envelope | 10x16 pixels, offset 4px into the cell |
| Collectible | 7x7 pixels |
| One-way floor | 8x5 pixels |
| Collapsible floor | 8x6 pixels |
| Conveyor | 8x7 pixels |
| Solid tile envelope | 8x8 pixels |
| Static-hazard mask cell | 8x8 pixels |
| Exit | 16x16 pixels |

## Remaining validation

- Verify static jumps and landings with the provisional collision body.
- Record the intended collectible route as mechanics become available.
- Check for unintended shortcuts and trapping positions.
- Confirm the provisional seven-contact collapsible-floor lifetime frame by
  frame against the Amstrad CPC version.
- Extend pixel-mask collision to other sprite interactions when their artwork
  and frame data become available.

[cpc-power]: https://www.cpc-power.com/index.php?num=1347&page=detail
[mobygames]: https://www.mobygames.com/game/6440/manic-miner/screenshots/cpc/441969/
[conveyor-discussion]: https://jswmm.co.uk/topic/580-automated-generation-of-manic-miner-speedrunwalkthrough/?comment=14676&do=findComment
