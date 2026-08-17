# Central Cavern Route Checklist

This checklist records the currently intended manual route through the Central
Cavern graybox. It is deliberately split into short transitions so collision,
hazard and dynamic-terrain regressions can be isolated.

Coordinates are pixel positions relative to the cavern's top-left corner. They
describe reproducible launch and landing positions for the provisional
collision body, not the only positions from which a jump may work.

## Automated static transitions

The route regression covers these transitions against the real Central Cavern
definition and fails if Willy touches a static hazard:

| Transition | Launch | Direction | Expected landing |
| --- | --- | --- | --- |
| Spawn floor to lower platform | `(16, 104)` | Right | `(40, 88)` |
| Across the plant on the lower platform | `(68, 88)` | Right | `(104, 88)` |
| Lower platform to raised blocks | `(136, 88)` | Right | `(148, 80)` |
| Collapsible floor to right ledge | `(200, 80)` | Right | `(224, 64)` |
| Right ledge to right-wall item | `(224, 64)` | Right | `(235, 64)` |
| Right ledge to conveyor | `(220, 64)` | Left | `(188, 56)` |
| Conveyor to lower-left platform | `(64, 56)` | Left | `(28, 56)` |
| Lower-left platform to left ledge | `(16, 56)` | Vertical | `(16, 40)` |
| Left ledge to upper platform | `(8, 40)` | Right | `(32, 24)` |

Run these checks with:

```sh
pnpm test --run src/levels/01-central-cavern/route.test.ts
```

## Manual route

- [x] Jump right from the spawn floor onto the lower one-way platform.
- [x] Jump right over the plant on the lower platform.
- [x] Jump right onto the three raised solid blocks.
- [x] Cross the collapsible floor once and jump right onto the raised ledge.
- [x] Jump against the right wall to collect its item and land back on the
  ledge.
- [x] Turn left and jump down onto the left-moving conveyor.
- [ ] Cross the conveyor and clear its plant.
- [x] Jump left from the conveyor across the gap to the lower-left platform.
- [x] Jump vertically from the lower-left platform onto the left ledge.
- [x] From the left ledge, jump right onto the upper platform.
- [ ] Collect the three upper items while avoiding the stalactites.
- [ ] Cross the upper collapsible sections and collect the item between the
  plants.
- [ ] Return along the lower route and enter the exit after it unlocks.

Checked steps mean the isolated static transition works. They do not yet prove
that the complete sequence works in one life: collapsible-floor wear, conveyor
timing and the future enemy must also be exercised continuously.

## Corrected left-side route

The intended route does not require a direct jump from the conveyor to the
ledge at row 7. The lower-left platform at row 9, columns 1-4 is the intermediate
landing surface. Only columns 5-7 are empty between that platform and the
conveyor beginning at column 8, so the gap is 24 pixels. Willy's complete
horizontal jump travels 36 pixels and clears it without any collision-envelope
change.

After landing on the lower-left platform, a separate vertical jump reaches the
ledge at row 7, columns 1-3. Both transitions now have automated regressions.
The remaining unchecked conveyor step concerns clearing the plant as part of a
continuous route, not the width of the gap on its left.
