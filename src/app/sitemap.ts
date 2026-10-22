import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (await db.siteSetting.findUnique({ where: { id: 'singleton' } }))?.siteUrl || ''
  const projects = await db.project.findMany({ where: { status: 'published' }, select: { slug: true, updatedAt: true } })

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl ? `${baseUrl}/` : '/',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]

  for (const p of projects) {
    entries.push({
      url: baseUrl ? `${baseUrl}/#work` : '/#work',
      lastModified: p.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  return entries
}
