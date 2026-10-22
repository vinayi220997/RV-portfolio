import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/portfolio/reveal'

interface ExperienceItem {
  id: string
  company: string
  role: string
  location: string | null
  startDate: string
  endDate: string | null
  description: string | null
  achievements: string[] | null
  technologies: string[] | null
}

export function Experience({ items }: { items: ExperienceItem[] }) {
  return (
    <section id="experience" className="py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
          <Reveal>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Experience</div>
              <div className="mt-2 font-serif text-3xl">Career</div>
            </div>
          </Reveal>
          <div>
            <ol className="relative space-y-12 border-l border-border/60 pl-6 md:pl-10">
              {items.map((exp, i) => (
                <Reveal key={exp.id} delay={i * 80}>
                  <li className="relative">
                    <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-serif text-2xl">{exp.role}</h3>
                      <div className="text-sm text-muted-foreground tabular-nums">
                        {exp.startDate} — {exp.endDate || 'Present'}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="text-foreground/90 font-medium">{exp.company}</span>
                      {exp.location && <span className="mx-2">·</span>}
                      {exp.location}
                    </div>
                    {exp.description && (
                      <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-3xl text-pretty">
                        {exp.description}
                      </p>
                    )}
                    {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {exp.achievements.map((a, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                            <span className="text-pretty">{a}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {exp.technologies.map((t) => (
                          <Badge key={t} variant="secondary" className="font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
