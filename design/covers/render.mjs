// Renders the cover templates in this folder into the images used by the site.
// Usage: npm run render            (every cover)
//        npm run render -- sudoku  (only the named ones)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../..');

const COVERS = {
  'salary-converter': { size: [1200, 750], out: 'src/assets/images/projects/salary-converter.webp' },
  sudoku: { size: [1200, 750], out: 'src/assets/images/projects/sudoku.webp' },
  'sql-ctes': { size: [1200, 750], out: 'src/assets/images/articles/sql-ctes.webp' },
  'mermaid-diagrams-chatgpt': { size: [1200, 750], out: 'src/assets/images/articles/mermaid-diagrams-chatgpt.webp' },
  'dotnet-8-to-dotnet-10': { size: [1200, 750], out: 'src/assets/images/articles/dotnet-8-to-dotnet-10.webp' },
  'sql-server-2025-regular-expressions': { size: [1200, 750], out: 'src/assets/images/articles/sql-server-2025-regular-expressions.webp' },
  'dotnet-lambda-cold-starts': { size: [1200, 750], out: 'src/assets/images/articles/dotnet-lambda-cold-starts.webp' },
  'opentelemetry-aspnet-core-grafana': { size: [1200, 750], out: 'src/assets/images/articles/opentelemetry-aspnet-core-grafana.webp' },
  'sudoku-generator-typescript': { size: [1200, 750], out: 'src/assets/images/articles/sudoku-generator-typescript.webp' },
  'social-default': { size: [1200, 630], out: 'src/assets/images/social-default.webp' },
};

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(COVERS);
const unknown = names.filter((name) => !COVERS[name]);
if (unknown.length) throw new Error(`Unknown cover(s): ${unknown.join(', ')}. Known: ${Object.keys(COVERS).join(', ')}`);

// Uses the installed Google Chrome unless CHROME_PATH points to another Chromium.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
);

for (const name of names) {
  const { size: [width, height], out } = COVERS[name];
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(resolve(here, `${name}.html`)).href);

  // Inline <div data-include="…svg"> so the SVG text is set in the page fonts.
  for (const element of await page.locator('[data-include]').all()) {
    const svg = readFileSync(resolve(here, await element.getAttribute('data-include')), 'utf8');
    await element.evaluate((node, markup) => (node.innerHTML = markup), svg);
  }

  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 92 }).toFile(resolve(root, out));
  await page.close();
  console.log(`${name} → ${out}`);
}

await browser.close();
