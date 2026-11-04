import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PionerosHex',
  description: 'Juego multijugador de estrategia sobre mapas hexagonales',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
