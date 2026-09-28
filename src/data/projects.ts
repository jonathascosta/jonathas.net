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
    imageAlt: 'Illustration of a salary converter app on a phone, surrounded by currency rates and charts',
    tags: ['ECMAScript 6', 'Web app'],
  },
  {
    title: 'Sudoku',
    description:
      'A Sudoku game with annotations, undo functionality and hints to enhance the user experience.',
    url: 'https://sudoku.jonathas.net/',
    image: sudoku,
    imageAlt: 'Illustration of a Sudoku board next to a pencil on a soft green background',
    tags: ['ECMAScript 6', 'Game'],
  },
];
