import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'AsterDrive - Modern Cloud Storage & Sync',
  description: 'Secure cloud storage, backup, and sync for all your files.',
  openGraph: {
    title: 'AsterDrive - Modern Cloud Storage & Sync',
    description: 'Secure cloud storage, backup, and sync for all your files.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
