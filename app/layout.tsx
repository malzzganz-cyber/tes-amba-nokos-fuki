import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Malzz Nokos',
  description: 'Platform cepat & simpel untuk membeli nomor virtual & menerima OTP otomatis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <div className="mx-auto max-w-[420px] min-h-screen bg-white relative shadow-xl">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
