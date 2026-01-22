import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers'; // Import the provider
import { Toaster } from 'sonner'; // We'll verify this is installed, if not we use standard

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Job Queue Dashboard',
  description: 'Monitor and manage background jobs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* We will add a Navbar here later */}
            <div className="container mx-auto py-6 px-4">
              {children}
            </div>
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}