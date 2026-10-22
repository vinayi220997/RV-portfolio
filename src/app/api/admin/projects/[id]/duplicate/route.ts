import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const orig = await db.project.findUnique({ where: { id } })
  if (!orig) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const maxOrder = await db.project.aggregate({ _max: { order: true } })
  // Generate a unique slug
  const baseSlug = `${orig.slug}-copy`
  let slug = baseSlug
  let suffix = 1
  while (await db.project.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
  }
  const dup = await db.project.create({
    data: {
      title: `${orig.title} (copy)`,
      slug,
      description: orig.description,
      longDescription: orig.longDescription,
      role: orig.role,
      technologies: orig.technologies || [],
      imageUrl: orig.imageUrl,
      liveUrl: orig.liveUrl,
      sourceUrl: orig.sourceUrl,
      category: orig.category,
      isFeatured: false, // duplicates are never featured by default
      startDate: orig.startDate,
      endDate: orig.endDate,
      order: (maxOrder._max.order ?? -1) + 1,
      status: 'draft',
    },
  })
  await audit({ action: 'project_duplicated', category: 'content', summary: `Duplicated project: ${orig.title}`, metadata: { originalId: id, newId: dup.id } })
  return NextResponse.json({ item: dup })
}
