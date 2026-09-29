import { defineHastPlugin } from 'satteri';
import type { Element } from 'hast';

/**
 * Wraps each table in a container that scrolls sideways, so a wide table scrolls on its own
 * instead of widening the page on a phone. The container is focusable, so keyboard users can
 * scroll it too.
 */
export const scrollTables = defineHastPlugin({
  name: 'scroll-tables',
  element: {
    filter: ['table'],
    visit(table, ctx) {
      ctx.wrapNode(table, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0 },
        children: [],
      });
    },
  },
});

/** Shorter articles (in characters of text, code included) get no ad in the middle. */
const MIN_LENGTH = 4000;

/**
 * Puts an ad slot in the middle of an article: before the h2 closest to half of its text, as long
 * as that h2 sits between 30% and 70% of the text. src/scripts/ads.ts fills it, like every slot.
 */
export const inArticleAd = (slot: string) =>
  defineHastPlugin({
    name: 'in-article-ad',
    after(root, ctx) {
      const lengths = root.children.map((node) => ctx.textContent(node).length);
      const total = lengths.reduce((sum, length) => sum + length, 0);
      if (total < MIN_LENGTH) return;

      let before = 0;
      let best: Element | undefined;
      let bestDistance = 0.2;
      root.children.forEach((node, index) => {
        const distance = Math.abs(before / total - 0.5);
        if (node.type === 'element' && node.tagName === 'h2' && distance <= bestDistance) {
          best = node;
          bestDistance = distance;
        }
        before += lengths[index];
      });

      if (best) ctx.insertBefore(best, adSlot(slot));
    },
  });

/** The same markup as src/components/AdSlot.astro. */
const adSlot = (slot: string): Element => ({
  type: 'element',
  tagName: 'div',
  properties: { className: ['ad'], dataSlot: slot },
  children: [
    {
      type: 'element',
      tagName: 'p',
      properties: { className: ['ad-label'] },
      children: [{ type: 'text', value: 'Advertisement' }],
    },
  ],
});
