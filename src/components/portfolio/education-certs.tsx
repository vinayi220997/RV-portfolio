import { Badge } from '@/components/ui/badge'
import { Award, GraduationCap, ExternalLink } from 'lucide-react'

interface EducationItem {
  id: string
  institution: string
  qualification: string
  field: string | null
  startDate: string
  endDate: string | null
  description: string | null
  credentialUrl: string | null
}

interface CertItem {
  id: string
  name: string
  issuer: string | null
  date: string | null
  credentialUrl: string | null
}

export function EducationCerts({
  education,
  certifications,
}: {
  education: EducationItem[]
  certifications: CertItem[]
}) {
  return (
    <section id="education" className="py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Education</div>
            <div className="mt-2 font-serif text-3xl">Credentials</div>
          </div>
          <div className="space-y-12">
            <div>
              <h3 className="font-serif text-xl mb-5 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" /> Education
              </h3>
              <div className="space-y-5">
                {education.map((e) => (
                  <div key={e.id} className="border-l border-border/60 pl-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <div className="font-medium">{e.institution}</div>
                      <div className="text-sm text-muted-foreground tabular-nums">
                        {e.startDate} — {e.endDate || 'Present'}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {e.qualification}{e.field && <span> · {e.field}</span>}
                    </div>
                    {e.description && (
                      <p className="mt-2 text-sm text-muted-foreground text-pretty max-w-2xl">{e.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-serif text-xl mb-5 flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" /> Certifications & Workshops
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {certifications.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border/60 bg-card p-4 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.issuer && <span>{c.issuer}</span>}
                        {c.issuer && c.date && <span> · </span>}
                        {c.date}
                      </div>
                    </div>
                    {c.credentialUrl && (
                      <a
                        href={c.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-accent transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
