import type { ImageMetadata } from 'astro';
import casinoGames from '../assets/images/projects/casino-games.webp';
import salaryConverter from '../assets/images/projects/salary-converter.webp';
import sudoku from '../assets/images/projects/sudoku.webp';

export interface Project {
  title: string;
  description: string;
  url: string;
  image: ImageMetadata;
  imageAlt: string;
  tags: string[];
  /** Shown before the tags while the project is unfinished. */
  status?: string;
}

export const projects: Project[] = [
  {
    title: 'Original Table Games',
    description:
      'Four original casino table games: the player rolls the dice and the dealer deals the cards. Three are ready to play with virtual chips, their math proven exactly and by simulation.',
    url: 'https://jonathascosta.github.io/CasinoGames/',
    image: casinoGames,
    imageAlt: 'Screenshot of the Original Table Games lobby: Entre Dados, Alvo Móvel and Espelho open to play, Trancar in development, and a balance in virtual chips',
    tags: ['TypeScript', 'PixiJS'],
    status: 'In development',
  },
  {
    title: 'Salary Converter',
    description:
      'Converts a salary between hourly, daily, weekly, monthly and yearly pay in BRL, USD, EUR and GBP, with the Central Bank of Brazil’s exchange rates and shareable links.',
    url: 'https://salary-converter.jonathas.net/',
    image: salaryConverter,
    imageAlt: 'Screenshot of the Salary Converter: 3,000 euros a month converted to BRL, USD and GBP per hour, day, week, month and year',
    tags: ['TypeScript', 'Vite', 'Web app'],
  },
  {
    title: 'Sudoku',
    description:
      'A Sudoku with three levels, notes, undo and hints. It saves your game as you play and works offline.',
    url: 'https://sudoku.jonathas.net/',
    image: sudoku,
    imageAlt: 'Screenshot of the Sudoku: a medium puzzle in progress, with the player’s digits in blue, pencil-mark notes, a selected cell and the number pad',
    tags: ['TypeScript', 'PWA', 'Game'],
  },
];
