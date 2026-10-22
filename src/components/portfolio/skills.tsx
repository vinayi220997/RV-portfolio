'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkillItem {
  id: string
  name: string
  category: string
  description: string | null
  proficiency: string | null
}

export function Skills({ items }: { items: SkillItem[] }) {
  const categories = React.useMemo(() => {
    const map = new Map<string, SkillItem[]>()
    items.forEach((s) => {
      const arr = map.get(s.category) || []
      arr.push(s)
      map.set(s.category, arr)
    })
    return Array.from(map.entries())
  }, [items])

  return (
    <section id="skills" className="py-24 md:py-32 border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16 mb-12">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Skills</div>
            <div className="mt-2 font-serif text-3xl">Capabilities</div>
          </div>
          <p className="text-muted-foreground max-w-2xl text-pretty leading-relaxed lg:pt-2">
            A working set of disciplines I lean on across the product lifecycle — from research to design systems to engineering handoff. Proficiency labels reflect hands-on depth, not invented percentages.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(([category, skills]) => (
            <div
              key={category}
              className="rounded-xl border border-border/60 bg-card p-5 hover:border-foreground/30 transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg">{category}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{skills.length}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {skills.map((s) => (
                  <li key={s.id} className="group">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.proficiency && (
                        <span
                          className={cn(
                            'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full',
                            s.proficiency === 'Advanced'
                              ? 'bg-accent/15 text-accent'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {s.proficiency}
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed text-pretty">
                        {s.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
