import type { ImageMetadata } from 'astro';
import salaryConverter from '../assets/images/projects/salary-converter.webp';
import sudoku from '../assets/images/projects/sudoku.webp';

export interface Project {
  title: string;
  description: string;
  url: string;
  image: ImageMetadata;
  imageAlt: string;
  tags: string[];
}

export const projects: Project[] = [
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
