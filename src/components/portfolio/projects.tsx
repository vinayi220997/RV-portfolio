'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectItem {
  id: string
  title: string
  slug: string
  description: string
  longDescription: string | null
  role: string | null
  technologies: string[] | null
  imageUrl: string | null
  liveUrl: string | null
  sourceUrl: string | null
  category: string | null
  isFeatured: boolean
  startDate: string | null
  endDate: string | null
}

export function Projects({ items }: { items: ProjectItem[] }) {
  const categories = React.useMemo(() => {
    const set = new Set<string>()
    items.forEach((p) => p.category && set.add(p.category))
    return ['All', ...Array.from(set).sort()]
  }, [items])

  const [active, setActive] = React.useState<string>('All')
  const [selected, setSelected] = React.useState<ProjectItem | null>(null)

  const filtered = React.useMemo(() => {
    if (active === 'All') return items
    return items.filter((p) => p.category === active)
  }, [items, active])

  return (
    <section id="work" className="py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16 mb-12">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Work</div>
            <div className="mt-2 font-serif text-3xl">Selected projects</div>
          </div>
          <div className="flex flex-wrap gap-2 lg:pt-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  'px-4 h-9 rounded-full text-sm transition border',
                  active === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={cn(
                'group text-left relative rounded-xl border border-border/60 overflow-hidden bg-card hover:border-foreground/30 transition-all hover:-translate-y-0.5',
                p.isFeatured && 'sm:col-span-2 lg:col-span-2'
              )}
            >
              {p.imageUrl ? (
                <div className={cn('aspect-[16/10] bg-muted', p.isFeatured && 'aspect-[16/9]')}>
                  <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className={cn(
                  'aspect-[16/10] bg-gradient-to-br from-secondary to-muted flex items-center justify-center',
                  p.isFeatured && 'aspect-[16/9]'
                )}>
                  <div className="font-serif text-4xl text-muted-foreground/40 group-hover:text-accent/60 transition">
                    {p.title.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-xl">{p.title}</h3>
                  {p.isFeatured && <Star className="h-4 w-4 fill-accent text-accent shrink-0" />}
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 text-pretty">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(p.technologies || []).slice(0, 3).map((t) => (
                    <span key={t} className="text-xs text-muted-foreground/80">· {t}</span>
                  ))}
                </div>
                {p.category && (
                  <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
                )}
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                <div className="h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {selected.category && <span>{selected.category}</span>}
                    {selected.startDate && (
                      <>
                        <span>·</span>
                        <span>{selected.startDate}{selected.endDate ? `–${selected.endDate}` : ''}</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-2 font-serif text-3xl">{selected.title}</h3>
                  {selected.role && (
                    <div className="mt-1 text-sm text-muted-foreground">{selected.role}</div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
              </div>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed text-pretty">
                {selected.longDescription || selected.description}
              </p>
              {Array.isArray(selected.technologies) && selected.technologies.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {selected.technologies.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                {selected.liveUrl && (
                  <Button asChild size="sm">
                    <a href={selected.liveUrl} target="_blank" rel="noopener noreferrer">
                      Live demo <ArrowUpRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {selected.sourceUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
