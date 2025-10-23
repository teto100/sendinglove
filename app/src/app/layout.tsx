import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import SyncStatus from '@/components/ui/SyncStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sending Love - Sistema de Gestión',
  description: 'Sistema integral de gestión para Sending Love',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
        {/* <SyncStatus /> */}
      </body>
    </html>
  )
}