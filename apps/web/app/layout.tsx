import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArkFlow — AI Invoice Automation',
  description: 'AI-native accounts payable and receivable automation — from PDF invoice to reconciled ledger in minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-ark-bg text-ark-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
