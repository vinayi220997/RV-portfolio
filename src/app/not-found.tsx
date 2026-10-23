import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="font-serif text-7xl md:text-9xl text-accent">404</div>
      <h1 className="mt-4 font-serif text-2xl md:text-3xl">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        The page you were looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
    </main>
  )
}
