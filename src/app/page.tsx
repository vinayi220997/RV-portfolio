import { SiteHeader } from '@/components/portfolio/site-header'
import { Hero } from '@/components/portfolio/hero'
import { AboutSection } from '@/components/portfolio/about-section'
import { Experience } from '@/components/portfolio/experience'
import { Projects } from '@/components/portfolio/projects'
import { Skills } from '@/components/portfolio/skills'
import { EducationCerts } from '@/components/portfolio/education-certs'
import { ContactForm } from '@/components/portfolio/contact-form'
import { SiteFooter } from '@/components/portfolio/site-footer'
import { ScrollProgress } from '@/components/portfolio/reveal'
import { CopyButton } from '@/components/portfolio/copy-button'
import { MapPin, Mail, FileDown, ExternalLink, Phone } from 'lucide-react'
import {
  getPublicProfile,
  getPublicExperience,
  getPublicProjects,
  getPublicSkills,
  getPublicEducation,
  getPublicCertifications,
  getPublicSocialLinks,
  getSiteSettings,
} from '@/lib/public-content'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [profile, experience, projects, skills, education, certs, socials, settings] = await Promise.all([
    getPublicProfile(),
    getPublicExperience(),
    getPublicProjects(),
    getPublicSkills(),
    getPublicEducation(),
    getPublicCertifications(),
    getPublicSocialLinks(),
    getSiteSettings(),
  ])

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground">
        Portfolio not configured. Sign in to the admin panel to set up your profile.
      </main>
    )
  }

  const socialList = socials.map((s) => ({ platform: s.platform, url: s.url, label: s.label }))

  const highlights = [
    { label: 'Years experience', value: '3+' },
    { label: 'Industries shipped', value: '4' },
    { label: 'Projects', value: String(projects.length) },
    { label: 'Based in', value: 'India' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <SiteHeader iconLetters={profile.iconLetters} />
      <main className="flex-1">
        <Hero
          name={profile.name}
          title={profile.title}
          titles={profile.titles}
          animateTitles={profile.animateTitles}
          summary={profile.summary}
          location={profile.location}
          email={profile.email}
          phone={profile.phone}
          avatarUrl={profile.avatarUrl}
          availability={profile.availability}
          socials={socialList}
          resumeUrl={profile.resumePublicUrl}
          resumeExternalUrl={profile.resumeExternalUrl}
        />

        <AboutSection
          bio={profile.bio}
          highlights={highlights}
          resumeUrl={profile.resumePublicUrl}
          resumeFileName={profile.resumePublicUrl ? profile.resumePublicUrl.split('/').pop() : null}
        />

        <Projects items={projects} />

        <Experience items={experience} />

        <Skills items={skills} />

        <EducationCerts education={education} certifications={certs} />

        <section id="contact" className="py-24 md:py-32 border-t border-border/60">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Contact</div>
                <div className="mt-2 font-serif text-3xl">Let&apos;s talk</div>
              </div>
              <div className="grid md:grid-cols-[1fr_1.2fr] gap-8">
                <div className="space-y-6">
                  <p className="text-lg md:text-xl font-serif text-pretty leading-relaxed">
                    Have a project in mind, or just want to say hello? Send a note and I will respond within a day or two.
                  </p>
                  {profile.email && (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${profile.email}`} className="hover:text-foreground transition">{profile.email}</a>
                      <CopyButton value={profile.email} label="Email" size="sm" />
                    </div>
                  )}
                  {profile.phone && (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${profile.phone}`} className="hover:text-foreground transition">{profile.phone}</a>
                      <CopyButton value={profile.phone} label="Phone Number" size="sm" />
                    </div>
                  )}
                  {profile.location && (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {profile.location}
                    </div>
                  )}
                  {(profile.resumePublicUrl || profile.resumeExternalUrl) && (
                    <a
                      href={profile.resumePublicUrl || profile.resumeExternalUrl || '#'}
                      target={(profile.resumeExternalUrl && !profile.resumePublicUrl) ? '_blank' : undefined}
                      rel={(profile.resumeExternalUrl && !profile.resumePublicUrl) ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition"
                    >
                      {profile.resumeExternalUrl && !profile.resumePublicUrl ? <ExternalLink className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                      {profile.resumeExternalUrl && !profile.resumePublicUrl ? 'View résumé' : 'Download résumé'}
                    </a>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {socialList.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target={s.url.startsWith('http') ? '_blank' : undefined}
                        rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="px-3 h-9 inline-flex items-center rounded-full border border-border text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        {s.label || s.platform}
                      </a>
                    ))}
                  </div>
                </div>
                <ContactForm email={profile.email} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter footerText={settings?.footerText || null} socials={socialList} />
    </div>
  )
}
