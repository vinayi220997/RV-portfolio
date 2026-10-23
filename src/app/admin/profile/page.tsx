import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileEditor } from '@/components/admin/profile-editor'
import { ProfileImageEditor } from '@/components/admin/profile-image-editor'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const profile = await db.profile.findUnique({ where: { id: 'singleton' } })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your name, titles, summary, icon letters, and public contact details.</p>
      </header>
      <ProfileImageEditor currentUrl={profile?.avatarUrl || null} />
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Shown across the hero, about, and contact sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditor initial={profile ? {
            name: profile.name,
            title: profile.title,
            titles: profile.titles || '',
            animateTitles: profile.animateTitles,
            summary: profile.summary,
            bio: profile.bio || '',
            location: profile.location || '',
            email: profile.email || '',
            phone: profile.phone || '',
            avatarUrl: profile.avatarUrl || '',
            iconLetters: profile.iconLetters || '',
            resumeExternalUrl: profile.resumeExternalUrl || '',
            availability: profile.availability || '',
          } : {}} />
        </CardContent>
      </Card>
    </div>
  )
}

