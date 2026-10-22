import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Dashboard } from '@/components/admin/dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const [
    experienceCount, projectCount, skillCount, educationCount, certCount,
    messageCount, unreadCount, codesCount, auditCount, backupsCount, resumesCount,
    publishedProjects, draftProjects, hiddenProjects, publishedExperience,
    recentMessages, recentAudit,
  ] = await Promise.all([
    db.experience.count(),
    db.project.count(),
    db.skill.count(),
    db.education.count(),
    db.certification.count(),
    db.contactMessage.count(),
    db.contactMessage.count({ where: { isRead: false } }),
    db.adminCode.count({ where: { isActive: true } }),
    db.auditLog.count(),
    db.backup.count(),
    db.resumeVersion.count(),
    db.project.count({ where: { status: 'published' } }),
    db.project.count({ where: { status: 'draft' } }),
    db.project.count({ where: { status: 'hidden' } }),
    db.experience.count({ where: { status: 'published' } }),
    db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
  ])

  return (
    <Dashboard
      initial={{
        counts: { experience: experienceCount, projects: projectCount, skills: skillCount, education: educationCount, certifications: certCount, messages: messageCount, unreadMessages: unreadCount, codes: codesCount, audit: auditCount, backups: backupsCount, resumes: resumesCount },
        publications: { publishedProjects, draftProjects, hiddenProjects, publishedExperience },
        recentMessages: recentMessages.map((m) => ({ id: m.id, name: m.name, email: m.email, subject: m.subject, isRead: m.isRead, isStarred: m.isStarred, createdAt: m.createdAt.toISOString() })),
        recentAudit: recentAudit.map((a) => ({ id: a.id, action: a.action, category: a.category, summary: a.summary, createdAt: a.createdAt.toISOString() })),
        mustChangePwd: user.mustChangePwd,
      }}
    />
  )
}
