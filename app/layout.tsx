import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SPIN DAT',
  description: 'Professional hip-hop DJ workstation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
