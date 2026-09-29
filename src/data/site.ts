export const SITE = {
  name: 'jonathas.net',
  author: 'Jonathas Costa',
  email: 'jonathas.costa@gmail.com',
  jobTitle: 'Senior Software Engineer',
  location: { city: 'Porto', country: 'Portugal' },
  title: 'Jonathas Costa · Senior Software Engineer',
  description:
    "I'm Jonathas Costa, a Senior Software Engineer in Porto, Portugal, who loves transforming ideas into reality. Explore my projects, articles and career journey.",
  locale: 'en_US',
  lang: 'en',
} as const;

/** Google AdSense: the publisher id, and the display units shown in articles. */
export const ADSENSE = {
  client: 'ca-pub-2968705923738055',
  slots: {
    /** In the middle of the text, placed by src/lib/markdown-plugins.ts. */
    inArticle: '4194994631',
    /** After the text. */
    afterArticle: '4194994631',
  },
} as const;

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/in/jonathas-costa/',
  github: 'https://github.com/jonathascosta',
} as const;

export const NAV = [
  { href: '/#portfolio', label: 'Portfolio' },
  { href: '/#articles', label: 'Articles' },
  { href: '/#journey', label: 'Journey' },
  { href: '/#contact', label: 'Contact' },
] as const;
