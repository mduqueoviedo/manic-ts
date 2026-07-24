import type { LevelDefinition } from './LevelDefinition';

/**
 * Initial Central Cavern reconstruction.
 *
 * Symbols describe terrain only; level objects remain separate so they can
 * later gain their own state without changing the tile grid.
 */
export const centralCavern = {
  name: 'Central Cavern',
  spawn: { x: 16, y: 104 },
  tiles: [
    '#          !    !              #',
    '#                              #',
    '#                              #',
    '#                              #',
    '#                      !   !   #',
    '#-------------xxxx-xxxx--------#',
    '#                              #',
    '#---                           #',
    '#                ### !         #',
    '#----   <<<<<<<<<<<<<<<<<<<<   #',
    '#                            --#',
    '#                              #',
    '#           !       ###xxxxx---#',
    '#    ---------------           #',
    '#                              #',
    '#------------------------------#',
  ],
  objects: [
    { type: 'COLLECTIBLE', column: 9, row: 0 },
    { type: 'COLLECTIBLE', column: 29, row: 0 },
    { type: 'COLLECTIBLE', column: 16, row: 1 },
    { type: 'COLLECTIBLE', column: 24, row: 4 },
    { type: 'COLLECTIBLE', column: 30, row: 6 },
    { type: 'EXIT', column: 29, row: 13 },
  ],
  deadlyMasks: [
    {
      column: 11,
      row: 0,
      pixels: [
        '########',
        '#######.',
        '.######.',
        '.#####..',
        '.#..##..',
        '.#..##..',
        '....#...',
        '....#...',
      ],
    },
    {
      column: 16,
      row: 0,
      pixels: [
        '########',
        '#######.',
        '.######.',
        '.#####..',
        '.#..##..',
        '.#..##..',
        '....#...',
        '....#...',
      ],
    },
    {
      column: 23,
      row: 4,
      pixels: [
        '.#...#..',
        '..###...',
        '#.##.#.#',
        '.###...#',
        '..###...',
        '###..##.',
        '..###...',
        '..##....',
      ],
    },
    {
      column: 27,
      row: 4,
      pixels: [
        '.#...#..',
        '.#####..',
        '#....#..',
        '..#...##',
        '.####.##',
        '###..#..',
        '...#....',
        '........',
      ],
    },
    {
      column: 21,
      row: 8,
      pixels: [
        '.#...#..',
        '..###...',
        '#....#..',
        '.#.....#',
        '..###..#',
        '#.#.###.',
        '...#....',
        '........',
      ],
    },
    {
      column: 12,
      row: 12,
      pixels: [
        '.#...#..',
        '..#.#...',
        '#..#.#..',
        '.#.#...#',
        '..###..#',
        '#.#..##.',
        '.#.##...',
        '...#....',
      ],
    },
  ],
} satisfies LevelDefinition;
