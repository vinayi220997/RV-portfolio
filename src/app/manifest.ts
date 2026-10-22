import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await db.siteSetting.findUnique({ where: { id: 'singleton' } })
  return {
    name: settings?.siteTitle || 'Portfolio',
    short_name: 'Portfolio',
    description: settings?.siteDescription || 'Personal portfolio',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f4',
    theme_color: '#b35c2e',
    icons: [
      {
        src: settings?.faviconUrl || '/avatar.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: settings?.faviconUrl || '/avatar.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
