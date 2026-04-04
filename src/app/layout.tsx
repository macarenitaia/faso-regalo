import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'Feliz cumpleaños Faso',
  description: 'Sube una foto y reconstruye la imagen moviendo las piezas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Faso 🎂',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  )
}
