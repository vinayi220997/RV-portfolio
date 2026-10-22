// Reset hasLoggedInOnce + defaultPasswordLoginUsed flags on all users.
// Used during testing so the first-login flow can be re-verified.
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const result = await db.user.updateMany({
    where: {},
    data: { hasLoggedInOnce: false, defaultPasswordLoginUsed: false },
  })
  console.log('Reset flags:', result)
}
main().catch(console.error).finally(() => db.$disconnect())
