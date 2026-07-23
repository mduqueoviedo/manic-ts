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

It does not cover final sprites, tile artwork, animation, sprite masks, HUD
layout or enemy implementation.

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
- Route completion cannot be signed off until collapsible floors, conveyor
  movement and the Central Cavern enemy are implemented.

## Placeholder dimensions

These dimensions describe visible placeholder bounds, not collision masks.

| Element | Placeholder size |
| --- | --- |
| Willy's initial visible frame | 8x16 pixels |
| Willy's provisional collision body | 8x16 pixels |
| Collectible | 7x7 pixels |
| One-way floor | 8x5 pixels |
| Collapsible floor | 8x6 pixels |
| Conveyor | 8x7 pixels |
| Solid and deadly tile envelope | 8x8 pixels |
| Exit | 16x16 pixels |

## Remaining validation

- Verify static jumps and landings with the provisional collision body.
- Record the intended collectible route as mechanics become available.
- Check for unintended shortcuts and trapping positions.
- Revisit only traversal-relevant dimensions before sprite masks exist.

[cpc-power]: https://www.cpc-power.com/index.php?num=1347&page=detail
[mobygames]: https://www.mobygames.com/game/6440/manic-miner/screenshots/cpc/441969/
[conveyor-discussion]: https://jswmm.co.uk/topic/580-automated-generation-of-manic-miner-speedrunwalkthrough/?comment=14676&do=findComment
