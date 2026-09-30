# Cover images

The images on the site are rendered from the HTML templates in this folder, as a blueprint series that matches the site.

| Template                                                  | Output                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| `casino-games.html`, `salary-converter.html`, `sudoku.html` | `src/assets/images/projects/*.webp`, from the screenshots in `screens/` |
| One per article, named after it (`sql-ctes.html`, …)      | `src/assets/images/articles/*.webp`                               |
| `social-default.html`                                     | `src/assets/images/social-default.webp`, the link preview of the home page |

The architecture diagram in `src/assets/diagrams/` is shared by the home page and `social-default.html`.

## Rendering

It needs Google Chrome (or `CHROME_PATH` set to another Chromium) and the site's dependencies installed at the repository root, which provide the fonts.

```sh
cd design/covers
npm install
npm run render                # every cover
npm run render -- sql-ctes    # only the named ones
```

## A cover for a new article

1. Copy `sql-ctes.html` or `mermaid-diagrams-chatgpt.html` to a file named after the article.
2. Draw something from the article itself: its diagram, its data or its code.
3. Add the file to `COVERS` in `render.mjs`, then run `npm run render -- <name>`.
4. Point the article's `heroImage` at the new image.

Keep the important content between 60 px and 690 px from the top: link previews crop the 1200×750 cover to 1200×630.

## Screenshots

`screens/` holds a screenshot of each app. The Salary Converter and the Sudoku are 1080 px wide, at 2×, taken from local builds with the ad slots hidden. The Salary Converter shows 3,000 EUR a month with the PTAX rates of 14 May 2024, the ones in its first version's README screenshot. The Original Table Games lobby is a 1902 px wide desktop screenshot of the live demo, at 1×, so its window on the cover is wider.

The link previews of the Salary Converter and the Sudoku (`public/og.png` in each app's repository) are 1200×630 crops of these covers.
