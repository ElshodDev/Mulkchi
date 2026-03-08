import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mulkchi - Премиум недвижимость',
  description: 'Найдите лучшие предложения премиум недвижимости в Узбекистане',
  keywords: 'недвижимость, квартиры, дома, премиум',
  openGraph: {
    title: 'Mulkchi - Премиум недвижимость',
    description: 'Найдите лучшие предложения премиум недвижимости в Узбекистане',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F3EE' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1410' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  )
}
