import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowDown, ArrowUpRight, FileDown, ExternalLink, Eye } from 'lucide-react'
import { Reveal, RevealText } from '@/components/portfolio/reveal'
import { TypingTitle } from '@/components/portfolio/typing-title'
import { CopyButton } from '@/components/portfolio/copy-button'

interface HeroProps {
  name: string
  title: string
  titles: string[]
  animateTitles: boolean
  summary: string
  location: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  availability: string | null
  socials: { platform: string; url: string; label: string | null }[]
  resumeUrl: string | null // uploaded PDF URL
  resumeExternalUrl: string | null // external resume URL
}

export function Hero({
  name,
  title,
  titles,
  animateTitles,
  summary,
  location,
  email,
  phone,
  avatarUrl,
  availability,
  socials,
  resumeUrl,
  resumeExternalUrl,
}: HeroProps) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('')
  const firstName = name.split(' ')[0]
  const restName = name.split(' ').slice(1).join(' ')
  // Resume: prefer uploaded PDF, fall back to external URL
  const resumeHref = resumeUrl || resumeExternalUrl
  const resumeIsExternal = !resumeUrl && !!resumeExternalUrl

  return (
    <section id="top" className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 70% 20%, oklch(0.62 0.13 35 / 0.12), transparent), radial-gradient(40% 40% at 10% 80%, oklch(0.78 0.13 80 / 0.10), transparent)',
        }}
      />
      {/* subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(oklch(0.3 0.02 60) 1px, transparent 1px), linear-gradient(90deg, oklch(0.3 0.02 60) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-6">
            {availability && (
              <Reveal>
                <div className="inline-flex items-center gap-2 self-start text-xs uppercase tracking-wider text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  {availability}
                </div>
              </Reveal>
            )}
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-balance">
              <RevealText text={firstName} />
              {restName && (
                <>
                  {' '}
                  <span className="text-muted-foreground/80 italic font-light">
                    <RevealText text={restName} delay={120} />
                  </span>
                </>
              )}
            </h1>
            <Reveal delay={240}>
              <p className="text-xl md:text-2xl text-muted-foreground font-serif italic min-h-[1.5em]">
                <TypingTitle titles={titles.length > 0 ? titles : [title]} enabled={animateTitles} />
              </p>
            </Reveal>
            <Reveal delay={360}>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl text-pretty leading-relaxed">
                {summary}
              </p>
            </Reveal>
            <Reveal delay={480}>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <a
                  href="#contact"
                  className="group inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all hover:gap-3"
                >
                  Start a project
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="#work"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-border text-sm font-medium hover:bg-secondary/60 transition"
                >
                  View work
                </a>
                {resumeHref && (
                  <a
                    href={resumeHref}
                    target={resumeIsExternal ? '_blank' : undefined}
                    rel={resumeIsExternal ? 'noopener noreferrer' : undefined}
                    className="group inline-flex items-center gap-2 h-11 px-5 rounded-full border border-accent/40 text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground transition-all hover:gap-3"
                  >
                    {resumeIsExternal ? <ExternalLink className="h-4 w-4" /> : <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />}
                    {resumeIsExternal ? 'View résumé' : 'Download résumé'}
                  </a>
                )}
                {socials.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target={s.url.startsWith('http') ? '_blank' : undefined}
                    rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center h-11 px-4 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
                  >
                    {s.label || s.platform}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={300}>
            <div className="relative">
              {/* Modern frameless layered image design */}
              <div className="relative w-44 h-52 md:w-56 md:h-64">
                {/* Decorative accent shape behind image */}
                <div
                  aria-hidden
                  className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-accent/20 blur-2xl"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full border-2 border-accent/30"
                />
                {/* The image container: extends slightly beyond typical bounds for layered effect */}
                <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-2xl border border-border/40">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: 'center top' }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-secondary">
                      <span className="font-serif text-5xl text-muted-foreground/40">{initials}</span>
                    </div>
                  )}
                </div>
                {/* Subtle gradient overlay at bottom for depth */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-2xl pointer-events-none"
                  style={{ background: 'linear-gradient(to top, oklch(0 0 0 / 0.18), transparent)' }}
                />
              </div>
              {/* Location + contact chips below image */}
              <div className="mt-4 flex flex-col gap-1.5 items-start">
                {location && (
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{location}</div>
                )}
                {email && (
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate max-w-[180px]">{email}</span>
                    <CopyButton value={email} label="Email" size="sm" />
                  </div>
                )}
                {phone && (
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate max-w-[180px]">{phone}</span>
                    <CopyButton value={phone} label="Phone Number" size="sm" />
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={600}>
          <div className="mt-20 md:mt-28 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Scroll to explore</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
