import { redirect } from 'next/navigation'
import { shouldShowBootstrapHint } from '@/lib/auth'
import { AdminLoginClient } from '@/components/admin/admin-login-client'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  // If user is already authenticated, send them to the dashboard.
  const showBootstrap = await shouldShowBootstrapHint()
  return <AdminLoginClient showBootstrap={showBootstrap} />
}
