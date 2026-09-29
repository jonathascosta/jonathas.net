import { ADSENSE } from '../data/site';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Only the live site counts impressions: anywhere else (astro dev, previews) asks for test ads.
const LIVE_HOST = new URL(import.meta.env.SITE).hostname;

/**
 * Fills the AdSense slots (elements with data-slot, from AdSlot.astro or the Markdown plugin)
 * once they have a size on screen.
 *
 * AdSense can't size a unit that has no width, and each push() fills the first unfilled unit on
 * the page. So each <ins> is only created when its slot has a width, right before its push, and a
 * slot that is never shown is never requested. Consent in the EEA and the UK is handled by
 * Google's own consent message (Privacy & messaging in AdSense), which the AdSense script shows
 * before any ad.
 */
function initAds(): void {
  const slots = document.querySelectorAll<HTMLElement>('[data-slot]');
  if (!slots.length || !('ResizeObserver' in window)) return;

  const observer = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      if (contentRect.width === 0) continue;
      observer.unobserve(target);
      fill(target as HTMLElement);
    }
  });
  slots.forEach((slot) => observer.observe(slot));
}

function fill(slot: HTMLElement): void {
  const unit = document.createElement('ins');
  unit.className = 'adsbygoogle';
  unit.style.display = 'block';
  unit.dataset.adClient = ADSENSE.client;
  unit.dataset.adSlot = slot.dataset.slot;
  unit.dataset.adFormat = 'auto';
  unit.dataset.fullWidthResponsive = 'true';
  if (location.hostname !== LIVE_HOST) unit.dataset.adtest = 'on';
  slot.append(unit);
  try {
    (window.adsbygoogle = window.adsbygoogle ?? []).push({});
  } catch {
    // The AdSense script reports its own errors; the slot just stays empty.
  }
}

initAds();
