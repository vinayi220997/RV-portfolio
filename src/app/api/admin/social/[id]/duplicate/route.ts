import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const orig = await db.socialLink.findUnique({ where: { id } })
  if (!orig) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const maxOrder = await db.socialLink.aggregate({ _max: { order: true } })
  const dup = await db.socialLink.create({
    data: {
      platform: `${orig.platform} (copy)`,
      url: orig.url,
      icon: orig.icon,
      label: orig.label,
      order: (maxOrder._max.order ?? -1) + 1,
      status: 'draft',
    },
  })
  await audit({ action: 'social_link_duplicated', category: 'content', summary: `Duplicated social link: ${orig.platform}`, metadata: { originalId: id, newId: dup.id } })
  return NextResponse.json({ item: dup })
}
