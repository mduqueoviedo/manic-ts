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

The same regression suite also covers the complete current route in one life.
It starts at Willy's spawn, preserves the mutable tile and collectible state,
collects all five items, crosses both collapsible sections, exercises conveyor
timing and enters the unlocked exit without touching a static hazard.

## Manual route

- [x] Jump right from the spawn floor onto the lower one-way platform.
- [x] Jump right over the plant on the lower platform.
- [x] Jump right onto the three raised solid blocks.
- [x] Cross the collapsible floor once and jump right onto the raised ledge.
- [x] Jump against the right wall to collect its item and land back on the
  ledge.
- [x] Turn left and jump down onto the left-moving conveyor.
- [x] Cross the conveyor and clear its plant.
- [x] Jump left from the conveyor across the gap to the lower-left platform.
- [x] Jump vertically from the lower-left platform onto the left ledge.
- [x] From the left ledge, jump right onto the upper platform.
- [x] Collect the three upper items while avoiding the stalactites.
- [x] Cross the upper collapsible sections and collect the item between the
  plants.
- [x] Return along the lower route and enter the exit after it unlocks.

Checked steps are covered by an isolated or continuous route regression. They
prove that the current enemy-free cavern works in one life with collectible and
collapsible-floor state preserved. The future enemy will require a separate
route validation once its movement and collision behavior exist.

## Corrected left-side route

The intended route does not require a direct jump from the conveyor to the
ledge at row 7. The lower-left platform at row 9, columns 1-4 is the intermediate
landing surface. Only columns 5-7 are empty between that platform and the
conveyor beginning at column 8, so the gap is 24 pixels. Willy's complete
horizontal jump travels 36 pixels and clears it without any collision-envelope
change.

After landing on the lower-left platform, a separate vertical jump reaches the
ledge at row 7, columns 1-3. Both transitions now have automated regressions.
The continuous regression also covers the preceding conveyor plant and confirms
that this complete left-side sequence is safe with the current pixel masks.
On the return journey, Willy opens a hole in the left upper collapsible section;
using the right section instead would drop him onto the lower plant.
