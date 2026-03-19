import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conversational Email Editor',
  description: 'Edit AI-generated emails via natural language conversation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
