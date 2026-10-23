// File-based storage helpers for private data (resumes, backups, uploaded media).

import fs from 'fs'
import path from 'path'
import { promises as fsp } from 'fs'

const DATA_ROOT = path.join(process.cwd(), 'data')
const PRIVATE_DIR = path.join(DATA_ROOT, 'private')
const BACKUP_DIR = path.join(DATA_ROOT, 'backups')
const PUBLIC_UPLOADS = path.join(DATA_ROOT, 'uploads', 'public')
const PRIVATE_UPLOADS = path.join(DATA_ROOT, 'uploads', 'private')

function ensureDirs() {
  for (const d of [DATA_ROOT, PRIVATE_DIR, BACKUP_DIR, PUBLIC_UPLOADS, PRIVATE_UPLOADS]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  }
}

ensureDirs()

export function privateDir() { return PRIVATE_DIR }
export function backupDir() { return BACKUP_DIR }
export function publicUploadsDir() { return PUBLIC_UPLOADS }
export function privateUploadsDir() { return PRIVATE_UPLOADS }

export async function writePrivateFile(name: string, data: Buffer): Promise<string> {
  const full = path.join(PRIVATE_DIR, name)
  await fsp.writeFile(full, data)
  return full
}

export async function readPrivateFile(name: string): Promise<Buffer> {
  return fsp.readFile(path.join(PRIVATE_DIR, name))
}

export async function writePublicUpload(name: string, data: Buffer): Promise<string> {
  const full = path.join(PUBLIC_UPLOADS, name)
  await fsp.writeFile(full, data)
  return full
}

export async function writePrivateUpload(name: string, data: Buffer): Promise<string> {
  const full = path.join(PRIVATE_UPLOADS, name)
  await fsp.writeFile(full, data)
  return full
}

export function safeFileName(original: string): string {
  const ext = path.extname(original).toLowerCase().slice(0, 8)
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${base || 'file'}-${unique}${ext}`
}
