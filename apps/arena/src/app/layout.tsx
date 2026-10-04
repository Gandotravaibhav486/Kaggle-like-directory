import type { Metadata } from 'next';
import { ThemeScript } from '@mi/ui';
import { mono, sans } from '@/fonts';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MockInterview / Arena',
  description: 'The settled scoreboard for MockInterview seasons.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
