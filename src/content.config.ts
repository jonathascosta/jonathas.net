import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  // The file name becomes the URL: src/content/articles/sql-ctes.md -> /sql-ctes.html
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image(),
      heroAlt: z.string(),
      tags: z.array(z.string()).default([]),
      /** Language of the article, e.g. "pt-BR" for Portuguese posts. */
      lang: z.string().default('en'),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles };
