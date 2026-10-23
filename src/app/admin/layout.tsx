import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminShell } from '@/components/admin/admin-shell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const pathname = (typeof window !== 'undefined' ? window.location.pathname : '') || ''

  // Allow login page without auth
  // Note: this layout wraps all /admin/* routes including /admin/login.
  // We render login without the shell; everything else requires auth.
  if (!user) {
    // The login page renders itself; everything else redirects.
    // We detect login route by checking if children path matches.
    // Simpler: just render children here (login page renders its own UI),
    // and rely on per-page auth checks for protected pages.
    return <>{children}</>
  }

  return (
    <AdminShell loginId={user.loginId} mustChangePwd={user.mustChangePwd}>
      {children}
    </AdminShell>
  )
}
