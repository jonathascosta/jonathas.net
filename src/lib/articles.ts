import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

/** Published articles, newest first (drafts are only visible in `astro dev`). */
export async function getArticles(): Promise<Article[]> {
  const articles = await getCollection('articles', ({ data }) => import.meta.env.DEV || !data.draft);
  return articles.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id),
  );
}

export const articleUrl = (article: Article) => `/${article.id}.html`;

export function readingTime(markdown = ''): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

export function formatDate(date: Date, lang = 'en'): string {
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
