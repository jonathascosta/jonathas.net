import type { ImageMetadata } from 'astro';
import medicine from '../assets/icons/industries/medicine.png';
import creditCard from '../assets/icons/industries/credit-card.png';
import gamepad from '../assets/icons/industries/console.png';
import flask from '../assets/icons/industries/test.png';
import shield from '../assets/icons/industries/insurance.png';
import train from '../assets/icons/industries/train.png';
import handbag from '../assets/icons/industries/fashion.png';
import chart from '../assets/icons/industries/finance.png';
import haulTruck from '../assets/icons/industries/mining.png';

export interface Industry {
  label: string;
  icon: ImageMetadata;
  /** Flaticon requires attribution for its free icons. The ones drawn for this site (design/icons/) need none. */
  credit?: { text: string; href: string };
}

export const industries = {
  veterinary: {
    label: 'Veterinary pharmaceuticals',
    icon: medicine,
    credit: { text: 'Drug icons created by Freepik', href: 'https://www.flaticon.com/free-icons/drug' },
  },
  payments: {
    label: 'Credit cards & payments',
    icon: creditCard,
    credit: { text: 'Credit card icons created by Freepik', href: 'https://www.flaticon.com/free-icons/credit-card' },
  },
  gaming: {
    label: 'Gaming',
    icon: gamepad,
    credit: { text: 'Joystick icons created by Good Ware', href: 'https://www.flaticon.com/free-icons/joystick' },
  },
  research: {
    label: 'Scientific research',
    icon: flask,
    credit: { text: 'Test icons created by Freepik', href: 'https://www.flaticon.com/free-icons/test' },
  },
  insurance: {
    label: 'Insurance',
    icon: shield,
    credit: { text: 'Insurance icons created by Fir3Ghost', href: 'https://www.flaticon.com/free-icons/insurance' },
  },
  transportation: {
    label: 'Transportation',
    icon: train,
    credit: { text: 'Train icons created by Freepik', href: 'https://www.flaticon.com/free-icons/train' },
  },
  fashion: {
    label: 'Luxury fashion',
    icon: handbag,
    credit: { text: 'Handbag icons created by Eucalyp', href: 'https://www.flaticon.com/free-icons/handbag' },
  },
  finance: {
    label: 'Financial analytics',
    icon: chart,
  },
  mining: {
    label: 'Mining',
    icon: haulTruck,
  },
} satisfies Record<string, Industry>;

export type IndustryKey = keyof typeof industries;

export interface Role {
  role: string;
  company: string;
  period: string;
  industries: IndustryKey[];
  summary: string;
  stack: string[];
}

export const experience: Role[] = [
  {
    role: 'Software Engineer',
    company: 'Univet',
    period: '2026 – present',
    industries: ['veterinary'],
    summary:
      'I’ve shipped 23 features across Univet’s warehouse system and Cockpit, built the deployment tool every release goes through, and added 212 automated tests.',
    stack: ['WMS', 'E-signatures', 'Test automation'],
  },
  {
    role: 'Senior Software Engineer',
    company: 'Ardanis / Plain Concepts',
    period: '2025 – present',
    industries: ['insurance', 'finance', 'mining'],
    summary:
      'Three clients so far: .NET, SQL Server and Azure for PremFina; Aileen, Ardanis’s AI contact-center platform, for SOBI Analytics; and an AI agent that answers questions about Anglo American’s haul trucks and mining equipment.',
    stack: ['.NET', 'SQL Server', 'Azure', 'AI agents'],
  },
  {
    role: 'Senior Software Engineer',
    company: 'Proxify / Univet',
    period: '2024 – 2025',
    industries: ['veterinary'],
    summary:
      'For a veterinary-pharmaceutical client, I automated batch creation and deployment, migrated the legacy app to .NET 8, and developed a proactive monitoring system.',
    stack: ['.NET 8', 'Automation', 'Monitoring'],
  },
  {
    role: 'Senior Software Engineer',
    company: 'YLD / NewDay',
    period: '2024',
    industries: ['payments'],
    summary:
      'I worked at NewDay through YLD, on a team responsible for payments, utilizing .NET Core, Cosmos, and REST APIs.',
    stack: ['.NET Core', 'Cosmos DB', 'REST APIs'],
  },
  {
    role: 'Senior Software Engineer',
    company: '22 cans',
    period: '2023 – 2024',
    industries: ['gaming'],
    summary:
      'Transformed software pipelines with GitHub Actions, authored open-source libraries, overhauled server architecture with AWS Lambda, and built monitoring tools using ASP.NET and ECMAScript 6.',
    stack: ['GitHub Actions', 'AWS Lambda', 'ASP.NET', 'ECMAScript 6'],
  },
  {
    role: 'Technical Architect',
    company: 'Ascent',
    period: '2022',
    industries: ['research'],
    summary:
      'Strengthened SQL Server infrastructure, contributed to a global pharma research app, and conducted code reviews.',
    stack: ['SQL Server', 'Code review'],
  },
  {
    role: 'Senior Software Engineer',
    company: 'KCSIT / Mindera',
    period: '2020 – 2022',
    industries: ['insurance', 'transportation', 'payments'],
    summary:
      'Built a new API for claims ticket management in the insurance industry using SQL, REST, and ASP.NET Core; contributed to a hybrid ticket type in transportation, integrated systems for customer credit and address validations, improved system resilience to 99.99%, implemented a high-speed batch process for 1 million customers, and developed a Grafana dashboard for real-time API monitoring.',
    stack: ['ASP.NET Core', 'SQL', 'REST', 'Grafana'],
  },
  {
    role: 'Lead Engineer',
    company: 'Farfetch',
    period: '2017 – 2019',
    industries: ['fashion'],
    summary:
      'Performed as a lead developer for the high-traffic product display page, overseeing 10,000+ requests per minute, conducted monthly one-on-one meetings with a team of ten engineers and QA professionals, balanced team backlog with the product owner, and managed feature releases and A/B testing.',
    stack: ['Leadership', 'High traffic', 'A/B testing'],
  },
];
