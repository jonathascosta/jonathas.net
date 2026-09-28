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
      'Versatile tool designed to facilitate salary conversions between different currencies and time periods.',
    url: 'https://salary-converter.jonathas.net/',
    image: salaryConverter,
    imageAlt: 'Screenshot of the Salary Converter: 3,000 euros a month converted to BRL, USD and GBP per hour, day, week, month and year',
    tags: ['ECMAScript 6', 'Web app'],
  },
  {
    title: 'Sudoku',
    description:
      'A Sudoku game with annotations, undo functionality and hints to enhance the user experience.',
    url: 'https://sudoku.jonathas.net/',
    image: sudoku,
    imageAlt: 'Screenshot of the Sudoku game with pencil-mark annotations, a selected cell and the Undo, Erase and Hint buttons',
    tags: ['ECMAScript 6', 'Game'],
  },
];
