import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cosmos Predictions | Vraag de kosmos over jouw toekomst',
  description: 'AI-powered toekomstvoorspellingen gebaseerd op jouw vragen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
