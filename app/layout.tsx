import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RoofSite Studio',
  description: 'Generate and manage websites for local roofing contractors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
