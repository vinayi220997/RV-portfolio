import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPublicEmailConfig } from '@/lib/email'
import { SettingsPage } from '@/components/admin/settings-page'

export const dynamic = 'force-dynamic'

export default async function SettingsRoute() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const s = await db.siteSetting.findUnique({ where: { id: 'singleton' } })
  const gmailCfg = await getPublicEmailConfig()
  return (
    <SettingsPage
      loginId={user.loginId}
      mustChangePwd={user.mustChangePwd}
      gmailConfig={gmailCfg}
      themeInitial={{
        themeMode: s?.themeMode || null,
        themeAccent: s?.themeAccent || null,
        themeSolidColor: s?.themeSolidColor || null,
        themeGradient: s?.themeGradient || null,
      }}
      initial={{
        siteTitle: s?.siteTitle || '',
        siteDescription: s?.siteDescription || '',
        siteUrl: s?.siteUrl || '',
        faviconUrl: s?.faviconUrl || '',
        themeAccent: s?.themeAccent || '',
        footerText: s?.footerText || '',
      }}
    />
  )
}
