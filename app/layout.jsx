import './globals.css'

export const metadata = {
  title: 'StockSense – Real-Time Stock Analysis & Predictions',
  description: 'Real-time stock analysis and price predictions using Trend, Momentum, and Statistical models.',
  keywords: 'stock prediction, trading, finance, real-time, stock analysis',
  // Favicons — Next.js App Router auto-serves app/icon.png as /icon.png
  // and app/apple-icon.png as /apple-icon.png (180x180 for Safari)
  icons: {
    icon: [
      { url: '/favicon.ico',         sizes: 'any' },       // Legacy browsers & bookmarks
      { url: '/favicon-16x16.png',   sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png',   sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png',   sizes: '48x48', type: 'image/png' },
      { url: '/icon-192x192.png',    sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png',    sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#080c18',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Explicit favicon links for maximum browser compatibility */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#080c18" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        <meta name="theme-color" content="#080c18" />
      </head>
      <body className="bg-[#080c18] text-[#e2e8f0] antialiased">
        {children}
      </body>
    </html>
  )
}
