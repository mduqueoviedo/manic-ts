# Development Roadmap

This is a living reference for deciding what to work on next. It describes the
current direction rather than a fixed commitment: milestones may be reordered,
split or revised as the game becomes better understood.

## How to use this roadmap

- Work from the earliest incomplete milestone unless a focused experiment
  justifies working ahead.
- Keep each pull request small enough to validate independently.
- Update this document in the same pull request when work completes an item or
  materially changes the planned direction.
- Use external references when checking original game behavior. Do not add
  disassembly or third-party source code to the repository.
- Treat placeholder visuals as acceptable until the underlying gameplay and
  geometry are stable.

## Current focus

Refine Central Cavern as a reliable gameplay graybox before adding systems
whose behavior depends on exact positions and routes.

The immediate goal is spatial and mechanical fidelity, not final artwork:
terrain placement, object placement, collision geometry and intended routes
should be trustworthy enough to support dynamic terrain and enemies.

## Milestone 0: Playable foundation

- [x] Establish the 320x200 canvas, 32x16 cavern grid and fixed simulation rate.
- [x] Add fixed-speed horizontal movement and the rigid jump arc.
- [x] Add solid terrain, one-way support, ceilings, walls and ledge falling.
- [x] Define an initial data-driven version of Central Cavern.
- [x] Add collectibles and an exit that unlocks when the cavern is cleared.
- [x] Add deadly terrain, lives, full cavern restart and game over.
- [x] Add a temporary `1` shortcut for restarting the complete game state.
- [x] Add automated coverage for the life-loss and restart loop.

## Milestone 1: Central Cavern graybox validation

- [ ] Audit terrain placement against external visual references.
- [ ] Audit Willy's spawn, collectibles, hazards and exit positions.
- [ ] Verify that every intended route works with the current movement rules.
- [ ] Identify unintended shortcuts, unreachable areas and trapping positions.
- [ ] Refine provisional collision dimensions where they affect traversal.
- [ ] Record a short manual route checklist for future regression testing.
- [ ] Separate tile-level accuracy from later sprite-mask and pixel-art work.

### Completion criteria

Central Cavern's static layout can be traversed reliably, every collectible is
reachable, the exit can be reached after collecting them, and the remaining
known inaccuracies are visual rather than structural.

## Milestone 2: Dynamic terrain

- [ ] Make collapsible floors react while Willy stands on them.
- [ ] Add their visual degradation states and eventual disappearance.
- [ ] Restore all collapsible floors after losing a life.
- [ ] Implement conveyor direction and horizontal movement.
- [ ] Implement conveyor direction locking while Willy remains grounded.
- [ ] Implement the immediate opposite-jump exception when landing against a
  conveyor's direction.
- [ ] Verify the exact landing input window against the Amstrad CPC version.
- [ ] Define how conveyors interact with nearby walls and platform edges.
- [ ] Restore conveyor state as part of a cavern restart if it becomes mutable.

## Milestone 3: Remaining death and pressure systems

- [ ] Define and implement the special fall-distance death rule.
- [ ] Add an air supply that advances on simulation ticks.
- [ ] Lose a life when the air supply reaches zero.
- [ ] Restore the full air supply after losing a life.
- [ ] Expand the placeholder HUD with air, cavern name and score information.
- [ ] Decide whether a short death transition is needed before restarting.

The duration and scoring behavior of the air supply should be tuned only after
Central Cavern's intended route and major obstacles are playable.

## Milestone 4: Enemies

- [ ] Add data-driven enemy definitions to level data.
- [ ] Implement the first horizontal patrol behavior.
- [ ] Add enemy contact as a life-loss condition.
- [ ] Restore every enemy to its initial position and phase after a death.
- [ ] Add additional movement patterns required by Central Cavern.
- [ ] Validate patrol bounds and timing against the stable graybox.

## Milestone 5: Cavern completion and scoring

- [ ] Replace the current completion flag with a cavern-complete transition.
- [ ] Define score events for collectibles, remaining air and other actions.
- [ ] Preserve game-wide score and lives while changing caverns.
- [ ] Introduce a level sequence and load the next cavern.
- [ ] Define completion behavior for the final cavern.

## Milestone 6: Visual and audio fidelity

- [ ] Replace placeholder geometry with tile and object artwork.
- [ ] Add Willy's animation frames and facing direction.
- [ ] Revisit collision precision when sprite masks are available.
- [ ] Add enemy animation and final visual layering.
- [ ] Recreate the HUD presentation.
- [ ] Add sound effects and music with appropriate asset provenance.

## Milestone 7: Game shell

- [ ] Add the proper title and start flow.
- [ ] Replace the provisional game-over overlay with the intended screen.
- [ ] Define restart, pause and focus-loss behavior.
- [ ] Document keyboard controls in the game and README.

## Milestone 8: Additional caverns

- [ ] Establish a repeatable workflow for defining and validating cavern data.
- [ ] Add level-definition validation for objects and enemy routes.
- [ ] Implement additional caverns incrementally.
- [ ] Track cavern-specific mechanics without coupling them to Central Cavern.
- [ ] Validate full-game progression, lives and scoring.

## Ongoing quality work

- Add focused automated tests with each stateful mechanic.
- Keep simulation behavior deterministic and independent of render frame rate.
- Keep level data separate from mutable runtime state.
- Remove temporary shortcuts and placeholder UI when their permanent
  replacements exist.
- Record known limitations rather than hiding them in implementation details.
