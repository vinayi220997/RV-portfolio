interface AboutProps {
  bio: string | null
  highlights: { label: string; value: string }[]
}

export function About({ bio, highlights }: AboutProps) {
  return (
    <section id="about" className="py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">About</div>
            <div className="mt-2 font-serif text-3xl">Approach</div>
          </div>
          <div className="space-y-8">
            <p className="text-xl md:text-2xl font-serif text-pretty leading-relaxed text-balance">
              {bio || 'No bio available yet.'}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {highlights.map((h) => (
                <div key={h.label} className="border-t border-border/60 pt-3">
                  <div className="text-3xl font-serif text-accent">{h.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{h.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
