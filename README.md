# jonathas.net

Personal website of Jonathas Costa: portfolio, articles and career journey. Live at [www.jonathas.net](https://www.jonathas.net).

Built with [Astro](https://astro.build) as a fully static site: no client-side framework, self-hosted fonts, responsive AVIF/WebP images, light and dark themes, an RSS feed and a sitemap.

## Development

Requires Node.js 22.12 or newer (see `.nvmrc`).

| Command           | Action                                          |
| ----------------- | ----------------------------------------------- |
| `npm install`     | Install dependencies                            |
| `npm run dev`     | Start the dev server at `http://localhost:4321` |
| `npm run check`   | Type-check `.astro` and `.ts` files             |
| `npm run build`   | Build the production site into `dist/`          |
| `npm run preview` | Preview the production build locally            |

## Writing an article

Add a Markdown file to `src/content/articles/`. The file name becomes the URL: `my-post.md` is published at `/my-post.html`.

```md
---
title: 'My new article'
description: 'One or two sentences for the home page, search results and social cards.'
pubDate: 2026-10-01
heroImage: ../../assets/images/articles/my-post.webp
heroAlt: 'Short description of the image'
tags: [SQL]
# lang: pt-BR   # for articles written in Portuguese
# draft: true   # only visible with `npm run dev`
---

The article, in Markdown.
```

Code blocks are highlighted at build time, with colours for both themes, and wide tables scroll sideways on phones. The article shows up on the articles page (`/articles.html`), on the home page while it's one of the four newest, in the RSS feed and in the sitemap automatically.

Every article gets an ad slot after the text. Articles long enough also get one in the middle, before the `h2` nearest the halfway point; the Markdown plugins that place it are in `src/lib/markdown-plugins.ts`.

The cover images are rendered from HTML templates in [`design/covers/`](design/covers/README.md), which also explains how to make one for a new article.

## Editing the site

| What                                         | Where                     |
| -------------------------------------------- | ------------------------- |
| Name, job title, social links and navigation | `src/data/site.ts`        |
| AdSense publisher id and ad units            | `ADSENSE` in `src/data/site.ts` |
| Arrows support e-mail and policy date        | `src/data/arrows.ts` (the policy changes with Arrows' `apps/game/privacy.html`) |
| Portfolio projects                           | `src/data/projects.ts`    |
| Career journey                               | `src/data/experience.ts`  |
| Colours, typography and spacing              | `src/styles/global.css`   |
| Architecture diagram on the home page        | `src/assets/diagrams/`    |
| Cover images                                 | `design/covers/`          |
| Fonts                                        | `astro.config.mjs`        |
| Files served as-is (`CNAME`, `ads.txt`, …)   | `public/`                 |

## Ads

`src/components/BaseHead.astro` loads the AdSense script on every page, and `src/scripts/ads.ts` fills each ad slot once it has a width. Anywhere but www.jonathas.net (the dev server, previews), the slots request test ads, which don't count as impressions. A slot that AdSense leaves empty, or that an ad blocker stops, collapses instead of leaving a gap.

Consent in the EEA, the UK and Switzerland is handled by Google's consent message, set up under **Privacy & messaging** in AdSense.

## Deployment

GitHub Actions builds every push (`.github/workflows/deploy.yml`) and deploys `main` to GitHub Pages.

One-time setup: in the repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. The custom domain (`www.jonathas.net`) remains configured on that page.
