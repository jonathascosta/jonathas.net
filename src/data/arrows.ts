/**
 * Arrows: Tap Puzzle, an iPhone game (github.com/jonathascosta/Arrows). Its App Store
 * listing points here: /arrows.html and /arrows/pt.html for support and marketing,
 * /arrows/privacy.html and /arrows/privacidade.html for the privacy policy.
 */
export const ARROWS = {
  support: 'jonathaspcosta@gmail.com',
  /** The date both privacy pages show; change it with the policy. */
  policyDate: '2026-10-03',
} as const;

/** The policy's date as its page shows it: "3 October 2026", "3 de outubro de 2026". */
export function formatPolicyDate(locale: 'en-GB' | 'pt-BR'): string {
  return new Date(`${ARROWS.policyDate}T00:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
