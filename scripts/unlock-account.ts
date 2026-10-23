// Unlock user account + reset bootstrap password.
// Run with: bun run scripts/unlock-account.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const db = new PrismaClient()
async function main() {
  const user = await db.user.findFirst()
  if (!user) {
    console.log('No user found')
    return
  }
  const loginId = process.env.BOOTSTRAP_LOGIN_ID || 'admin_user'
  const password = process.env.BOOTSTRAP_PASSWORD || 'admin_password@58'
  const hash = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: user.id },
    data: {
      loginId,
      passwordHash: hash,
      mustChangePwd: true,
      hasLoggedInOnce: false,
      defaultPasswordLoginUsed: false,
      failedAttempts: 0,
      lockedUntil: null,
      recoveryCodeHash: null,
      recoveryExpires: null,
    },
  })
  console.log(`Reset to bootstrap: ${loginId} / ${password}, unlocked, hasLoggedInOnce=false, defaultPasswordLoginUsed=false`)
}
main().catch(console.error).finally(() => db.$disconnect())
