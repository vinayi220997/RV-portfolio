import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const orig = await db.experience.findUnique({ where: { id } })
  if (!orig) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const maxOrder = await db.experience.aggregate({ _max: { order: true } })
  const dup = await db.experience.create({
    data: {
      company: orig.company,
      role: `${orig.role} (copy)`,
      location: orig.location,
      startDate: orig.startDate,
      endDate: orig.endDate,
      description: orig.description,
      achievements: orig.achievements || [],
      technologies: orig.technologies || [],
      order: (maxOrder._max.order ?? -1) + 1,
      status: 'draft', // always draft (unpublished) by default
    },
  })
  await audit({ action: 'experience_duplicated', category: 'content', summary: `Duplicated experience: ${orig.role}`, metadata: { originalId: id, newId: dup.id } })
  return NextResponse.json({ item: dup })
}
