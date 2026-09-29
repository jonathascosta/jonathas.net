# Industry icons

Line icons drawn for the Journey section, where the Flaticon set in `src/assets/icons/industries/` has no match. They follow the same style: 512 px, 24 px rounded strokes, black on transparent. The page uses them as CSS masks, so only their shape matters.

After editing one, render it to PNG from the repository root:

```sh
node -e "require('sharp')('design/icons/mining.svg').png().toFile('src/assets/icons/industries/mining.png')"
```
