---
title: "How the Sudoku on This Site Makes Its Puzzles: A Bitmask Solver in TypeScript"
description: "Every puzzle in my Sudoku is generated in the browser, with exactly one solution, in a few milliseconds. Here's how: bit masks for candidates, a most-constrained-first solver, symmetric clue removal and a simple difficulty grader."
pubDate: 2026-09-29
heroImage: ../../assets/images/articles/sudoku-generator-typescript.webp
heroAlt: "A Sudoku grid next to the bit masks of one row, one column and one box, combined to find the candidates of a single cell"
tags: [TypeScript, Algorithms, Sudoku]
---

A Sudoku puzzle is only fair if it has **exactly one solution**. Anything else forces the player to guess at some point. So a generator has two jobs: produce a random valid grid, then remove as many digits as possible without ever allowing a second solution.

The first version of [my Sudoku](https://sudoku.jonathas.net/) did this by brute force and could take seconds, sometimes more than a minute, to produce a puzzle. The rebuilt one, in TypeScript, generates every puzzle in the browser in a few milliseconds. This is how it works. The code is [on GitHub](https://github.com/jonathascosta/sudoku).

## Candidates as bits

The grid is an array of 81 numbers, in row order, with `0` for an empty cell. Row, column and box of each cell are precomputed once, so the hot loops never divide by 9.

The trick that makes everything fast is keeping, for every row, column and box, a **9-bit mask of the digits already used**. Bit *n* set means digit *n* is taken. The candidates of a cell are then just the digits missing from all three of its units:

```ts
/** Bit mask of digits 1–9 (bit n set = digit n). */
export const ALL_DIGITS = 0b11_1111_1110;

const mask = ALL_DIGITS & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
```

Placing a digit is an OR into three masks, and removing it is an AND with the complement. Counting candidates is a lookup in a 1,024-entry table of bit counts. Candidates never live in arrays or sets: only the cell the search branches on gets its digits listed.

## A solver that picks the hardest cell first

The solver is a classic backtracking search with one important rule: at each step, branch on the **empty cell with the fewest candidates**. A cell with one candidate is forced, so it costs nothing to fill. A cell with zero candidates means the current path is dead, and the search can back out immediately.

```ts
const search = (): boolean => {
  // Find the empty cell with the fewest candidates.
  let best = -1, bestMask = 0, bestCount = 10;
  for (let i = 0; i < CELLS; i++) {
    if (grid[i]) continue;
    const mask = ALL_DIGITS & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
    const count = popcount(mask);
    if (count < bestCount) {
      best = i; bestMask = mask; bestCount = count;
      if (count <= 1) break;
    }
  }

  if (best === -1) {           // no empty cell left: a solution
    solutions++;
    solution ??= grid.slice();
    return solutions >= limit; // stop once we've seen enough
  }
  if (bestCount === 0) return false;

  for (const digit of digitsOf(bestMask)) {
    place(best, digit);   // set the cell and the three masks
    if (search()) return true;
    unplace(best, digit); // and undo it
  }
  return false;
};
```

(Slightly condensed: in the real code, `place` and `unplace` are inlined bit operations.)

The `limit` is what turns a solver into a **uniqueness checker**. With `limit: 2`, the search stops as soon as it finds a second solution. So "does this puzzle have a unique solution?" costs at most two solutions' worth of work:

```ts
export const hasUniqueSolution = (puzzle: Grid): boolean =>
  solve(puzzle, { limit: 2 }).solutions === 1;
```

## A random, reproducible full grid

To get a random complete grid, the generator runs the same solver on an empty grid and shuffles each cell's candidates before trying them. The shuffle uses a small seeded generator (mulberry32) rather than `Math.random`, so **the same seed always produces the same puzzle**. That makes bugs reproducible, tests deterministic, and a "puzzle of the day" trivial to add.

Filling an empty grid takes about 0.2 ms with the most-constrained-first rule.

## Removing clues, two at a time

Then comes the part that makes it a puzzle. The generator visits the cells in random order and tries to remove each clue **together with its mirror**, the cell rotated 180° around the centre (`i` and `80 − i`). Printed puzzles have that symmetry, and it looks better than random holes. A removal is only kept if the puzzle still has a unique solution:

```ts
const tryRemove = (cells: number[]): void => {
  const saved = cells.map((i) => puzzle[i]);
  for (const i of cells) puzzle[i] = 0;
  if (hasUniqueSolution(puzzle) && (!singlesOnly || solvableWithSingles(puzzle))) {
    clues -= cells.length;
  } else {
    cells.forEach((i, k) => (puzzle[i] = saved[k])); // put them back
  }
};
```

It stops at a target number of clues: 40 for easy, 32 for medium and 26 for hard. Because clues go in pairs, a puzzle can end one below the target.

## Difficulty is about technique, not only clues

Fewer clues usually means a harder puzzle, but not always. What really makes a puzzle hard is **which techniques you need** to solve it without guessing. The generator grades puzzles with the two techniques every player knows:

- **Naked single:** a cell with only one possible digit.
- **Hidden single:** a digit that fits in only one cell of a row, column or box.

`solvableWithSingles` applies both repeatedly, the way a person would. Easy and medium puzzles must be solvable that way from start to finish, which is the `singlesOnly` check in `tryRemove` above. Hard puzzles skip it, so they can require more advanced techniques.

Measuring the result was humbling. Over 300 generated puzzles per level:

| Level | Clues (average) | Solvable with singles only | Generation time (average / slowest) |
| --- | --- | --- | --- |
| Easy | 39.5 | 100% | 5.5 ms / 28 ms |
| Medium | 31.7 | 100% | 13.6 ms / 30 ms |
| Hard | 26.0 | 54% | 6.6 ms / 52 ms |

About half of the "hard" puzzles still fall to singles alone. They're hard in the sense of having few clues, but not in the techniques they demand. The next step is a grader that knows more techniques, such as naked pairs, pointing pairs and X-wings, and requires at least one of them for "hard".

Medium is the slowest level to generate: like easy, it runs the singles check on every removal, but it removes more clues. That's still fast enough to generate on the main thread without a Web Worker.

## Testing something random

Random output doesn't mean untestable output. The Vitest suite generates puzzles for several fixed seeds at every level and checks properties, not exact grids:

- the solution is a valid Sudoku, and every clue agrees with it;
- the puzzle has exactly one solution, and solving it gives back that solution;
- easier levels have more clues;
- the same seed produces the same puzzle, and different seeds produce different ones;
- generating a hard puzzle takes well under a quarter of a second on average.

The last test is there to catch a regression back to seconds-long generation before any player does.

You can [play the result here](https://sudoku.jonathas.net/). It saves your game as you go and works offline.
