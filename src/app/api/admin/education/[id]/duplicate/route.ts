import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const orig = await db.education.findUnique({ where: { id } })
  if (!orig) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const maxOrder = await db.education.aggregate({ _max: { order: true } })
  const dup = await db.education.create({
    data: {
      institution: orig.institution,
      qualification: `${orig.qualification} (copy)`,
      field: orig.field,
      startDate: orig.startDate,
      endDate: orig.endDate,
      description: orig.description,
      credentialUrl: orig.credentialUrl,
      order: (maxOrder._max.order ?? -1) + 1,
      status: 'draft',
    },
  })
  await audit({ action: 'education_duplicated', category: 'content', summary: `Duplicated education: ${orig.qualification}`, metadata: { originalId: id, newId: dup.id } })
  return NextResponse.json({ item: dup })
}
