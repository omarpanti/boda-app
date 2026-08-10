import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plataforma de Bodas Premium",
  description: "Gestión completa de invitados, gastos e invitaciones",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/mobile-drag-drop/release/default.min.css" />
      </head>
      <body className={inter.className}>
        {children}
        
        {/* Polyfills táctiles para HTML5 Drag and Drop en iOS / Safari */}
        <Script src="https://unpkg.com/mobile-drag-drop/release/index.min.js" strategy="beforeInteractive" />
        <Script src="https://unpkg.com/mobile-drag-drop/release/scroll-behaviour.min.js" strategy="beforeInteractive" />
        <Script id="drag-drop-polyfill" strategy="lazyOnload">
          {`
            setTimeout(() => {
              if (window.MobileDragDrop) {
                window.MobileDragDrop.polyfill({
                  dragImageTranslateOverride: window.MobileDragDrop.scrollBehaviourDragImageTranslateOverride
                });
                // Fix para Safari iOS
                window.addEventListener('touchmove', function() {}, {passive: false});
              }
            }, 1000);
          `}
        </Script>
      </body>
    </html>
  );
}
