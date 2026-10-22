import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const r = await db.adminCode.deleteMany({ where: { code: { in: ['#testrecovery', '#customrecovery'] } } })
  console.log('Cleaned test codes:', r.count)
}
main().catch(console.error).finally(() => db.$disconnect())
