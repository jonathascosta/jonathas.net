import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/** 1200×630 JPEG: the most widely supported social card format (LinkedIn, X, WhatsApp…). */
export async function getSocialImageUrl(src: ImageMetadata, site: URL): Promise<string> {
  // layout 'none': a single file, not the responsive srcset the global image layout would generate.
  const image = await getImage({ src, width: 1200, height: 630, fit: 'cover', format: 'jpeg', quality: 80, layout: 'none' });
  return new URL(image.src, site).href;
}
