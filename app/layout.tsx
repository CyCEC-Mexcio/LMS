import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CYCEC México - Certificaciones Oficiales y Capacitación Empresarial',
  description:
    'Capacitación, consultoría y certificación de competencias alineadas a estándares ISO y oficiales para profesionales y empresas en México.',
  openGraph: {
    title: 'CYCEC México',
    description:
      'Certificaciones oficiales y capacitación empresarial alineadas a estándares ISO.',
    url: 'https://cycecmexico.com',
    siteName: 'CYCEC México',
    images: [
      {
        url: 'https://cycecmexico.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CYCEC México',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
