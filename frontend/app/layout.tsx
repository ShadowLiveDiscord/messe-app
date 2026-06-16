import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { BookOpen, Music, CalendarDays, Upload } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Messe App',
  description: 'Gestion des chants et PowerPoint de messe',
}

const navLinks = [
  { href: '/', label: 'Accueil', icon: CalendarDays },
  { href: '/bibliotheque', label: 'Bibliothèque', icon: Music },
  { href: '/importer', label: 'Importer', icon: Upload },
  { href: '/composer', label: 'Composer', icon: BookOpen },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-primary text-white shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gold text-xl">✠</span>
                <span className="font-bold text-lg tracking-wide">Messe App</span>
              </div>
              <nav className="flex items-center gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
