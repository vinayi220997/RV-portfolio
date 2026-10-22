import { Reveal } from '@/components/portfolio/reveal'
import { FileDown } from 'lucide-react'

interface AboutProps {
  bio: string | null
  highlights: { label: string; value: string }[]
  resumeUrl: string | null
  resumeFileName: string | null
}

export function AboutSection({ bio, highlights, resumeUrl, resumeFileName }: AboutProps) {
  return (
    <section id="about" className="py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
          <Reveal>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">About</div>
              <div className="mt-2 font-serif text-3xl">Approach</div>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-accent/15 text-accent text-xs font-medium hover:bg-accent hover:text-accent-foreground transition"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download résumé
                </a>
              )}
            </div>
          </Reveal>
          <div className="space-y-8">
            <Reveal delay={120}>
              <p className="text-xl md:text-2xl font-serif text-pretty leading-relaxed text-balance">
                {bio || 'No bio available yet.'}
              </p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {highlights.map((h, i) => (
                <Reveal key={h.label} delay={200 + i * 100}>
                  <div className="border-t border-border/60 pt-3">
                    <div className="text-3xl font-serif text-accent">{h.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{h.label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
            {resumeUrl && (
              <Reveal delay={400}>
                <div className="pt-4">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition border-b border-transparent hover:border-foreground/30 pb-0.5"
                  >
                    <FileDown className="h-4 w-4 text-accent" />
                    Download full résumé {resumeFileName && <span className="text-muted-foreground/60">({resumeFileName})</span>}
                  </a>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
