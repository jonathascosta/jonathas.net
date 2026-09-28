// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.jonathas.net',

  build: {
    // `file` keeps the historical URLs (/sql-ctes.html, /mermaid-diagrams-chatgpt.html).
    format: 'file',
    // The CSS is only a few KB: inlining it removes render-blocking requests.
    inlineStylesheets: 'always',
  },
  trailingSlash: 'never',

  integrations: [
    sitemap({
      // Match the canonical URLs, which keep the .html extension of build.format 'file'.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/' && !/\.[a-z0-9]+$/i.test(url.pathname)) {
          url.pathname = `${url.pathname.replace(/\/$/, '')}.html`;
          item.url = url.href;
        }
        return item;
      },
    }),
  ],

  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },

  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      // Colours come from CSS variables so code blocks follow the site theme toggle.
      defaultColor: false,
    },
  },

  // Self-hosted fonts, read from the @fontsource packages in node_modules: builds never
  // depend on a font CDN and visitors never hit Google Fonts.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Serif',
      cssVariable: '--font-instrument-serif',
      fallbacks: ['serif'],
      options: {
        variants: [
          {
            src: ['@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
          },
          {
            src: ['@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'],
            weight: 400,
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'],
            weight: '100 800',
            style: 'normal',
          },
        ],
      },
    },
  ],
});
