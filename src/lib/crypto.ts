// AES-GCM encryption for private files at rest.
// Key from ENCRYPTION_KEY env (hex string of 64 chars = 32 bytes).
// Format: iv(12 bytes) || ciphertext || tag(16 bytes), all base64.

import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || ''
  if (!raw || raw.startsWith('replace_me')) {
    // Dev fallback. NEVER rely on this in production.
    return crypto.createHash('sha256').update('dev-fallback-key').digest()
  }
  return Buffer.from(raw, 'hex')
}

export function encrypt(buffer: Buffer): Buffer {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(buffer), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, enc, tag])
}

export function decrypt(buffer: Buffer): Buffer {
  const key = getKey()
  if (buffer.length < 12 + 16) throw new Error('Invalid ciphertext (too short)')
  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(buffer.length - 16)
  const enc = buffer.subarray(12, buffer.length - 16)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  try {
    return Buffer.concat([decipher.update(enc), decipher.final()])
  } catch (e) {
    throw new Error('Decryption failed or file corrupted')
  }
}

// Custom encoding format (obfuscation, NOT encryption).
// Versioned base64-with-prefix for content interchange.
// Format: "PENC1\n" + base64(JSON.stringify(data))
// Documented in README > Custom Encoding.
export function encodeContent(data: unknown): string {
  const json = JSON.stringify(data)
  const b64 = Buffer.from(json, 'utf8').toString('base64')
  return `PENC1\n${b64}`
}

export function decodeContent(encoded: string): unknown {
  const lines = encoded.split('\n')
  if (lines[0] !== 'PENC1') throw new Error('Unknown encoding format')
  const b64 = lines.slice(1).join('\n')
  const json = Buffer.from(b64, 'base64').toString('utf8')
  return JSON.parse(json)
}

export function sha256(buffer: Buffer | string): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
