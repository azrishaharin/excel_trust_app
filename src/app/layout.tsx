import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AIAssistantProvider } from '@/context/AIAssistantContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Navbar from '@/components/Navbar'
import CollapsibleChatbox from '@/components/CollapsibleChatbox'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Excel Trust App',
  description: 'Excel Trust App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <AIAssistantProvider>
            <div className="min-h-full">
              <Navbar />
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                  {children}
                </div>
              </main>
              <CollapsibleChatbox />
            </div>
          </AIAssistantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
