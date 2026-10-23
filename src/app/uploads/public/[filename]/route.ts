import { NextRequest, NextResponse } from 'next/server'
import { promises as fsp } from 'fs'
import path from 'path'
import { publicUploadsDir } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// Public file-serving route for published uploads.
// Files in data/uploads/public/ are served at /uploads/public/<filename>.
// Only the file's basename is used — no path traversal allowed.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  // Sanitize: only allow basename, no path traversal
  const safe = path.basename(filename)
  if (!safe || safe !== filename) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Only allow files matching the safe-name pattern (alphanumeric, dash, dot, underscore)
  if (!/^[a-zA-Z0-9._-]+$/.test(safe)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const fullPath = path.join(publicUploadsDir(), safe)
  try {
    await fsp.access(fullPath)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const buf = await fsp.readFile(fullPath)
  // Determine content type from extension
  const ext = path.extname(safe).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.json': 'application/json',
  }
  const contentType = mimeTypes[ext] || 'application/octet-stream'
  // Force download for PDFs (so the browser downloads rather than navigates)
  const disposition = ext === '.pdf' ? 'attachment' : 'inline'
  return new NextResponse(buf, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${safe}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
