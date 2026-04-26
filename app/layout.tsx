import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'QuickDrop — Your personal clipboard',
  description: 'Instantly send text, links, and files between your devices. Fast, private, minimal.',
}

export const viewport: Viewport = {
  themeColor: '#0f0f12',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-[#0f0f12] antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#e8e8f0',
              border: '1px solid #ffffff10',
              borderRadius: '12px',
              fontSize: '13px',
              padding: '10px 16px',
            },
            success: {
              iconTheme: { primary: '#7c6af5', secondary: '#1a1a24' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#1a1a24' },
            },
          }}
        />
      </body>
    </html>
  )
}
