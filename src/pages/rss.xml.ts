import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../data/site';
import { articleUrl, getArticles } from '../lib/articles';

export async function GET(context: APIContext) {
  const articles = await getArticles();

  return rss({
    title: `${SITE.name} · Articles`,
    description: `Articles by ${SITE.author} on software engineering, SQL, tooling and more.`,
    site: context.site!,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.pubDate,
      link: articleUrl(article),
      categories: article.data.tags,
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}
