# Cover images

The images on the site are rendered from the HTML templates in this folder, as a blueprint series that matches the site.

| Template                                          | Output                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `salary-converter.html`, `sudoku.html`            | `src/assets/images/projects/*.webp`, from the screenshots in `screens/` |
| `sql-ctes.html`, `mermaid-diagrams-chatgpt.html`  | `src/assets/images/articles/*.webp`                               |
| `social-default.html`                             | `src/assets/images/social-default.webp`, the link preview of the home page |

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

`screens/` holds screenshots of the two apps running locally, with their fonts served locally and the ad slots hidden. The Salary Converter uses the exchange rates shown in its own README screenshot (14 May 2024).
