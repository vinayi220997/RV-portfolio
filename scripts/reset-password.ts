// Reset password for an existing user (operator-only, server-side).
// Usage: bun run scripts/reset-password.ts <loginId> <newPassword>
// This script bypasses the API and writes directly to the DB.
// Use only when you have lost your password and have filesystem access.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const [loginId, newPassword] = process.argv.slice(2)
  if (!loginId || !newPassword) {
    console.error('Usage: bun run scripts/reset-password.ts <loginId> <newPassword>')
    process.exit(1)
  }
  if (newPassword.length < 10) {
    console.error('Password must be at least 10 characters')
    process.exit(1)
  }
  const user = await db.user.findFirst({ where: { loginId } })
  if (!user) {
    console.error(`User with loginId "${loginId}" not found`)
    process.exit(1)
  }
  const hash = await bcrypt.hash(newPassword, 12)
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      mustChangePwd: true,
      failedAttempts: 0,
      lockedUntil: null,
      recoveryCodeHash: null,
      recoveryExpires: null,
    },
  })
  console.log(`Password updated for ${loginId}. mustChangePwd=true — user must change on next sign-in.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await db.$disconnect() })
