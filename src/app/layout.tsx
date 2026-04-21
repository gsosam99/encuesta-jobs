import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Perfiles de Representantes',
  description: 'Encuesta de perfiles para representantes de colegios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
