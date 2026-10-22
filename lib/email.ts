// Gmail SMTP helper using App Password.
// The App Password is stored AES-GCM encrypted in the database and decrypted
// in-memory only when sending. It is NEVER returned to the client.

import nodemailer from 'nodemailer'
import { db } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/crypto'

export interface ResolvedEmailConfig {
  emailAddress: string
  appPassword: string // plaintext, in-memory only
  displayName?: string | null
}

export async function getEmailConfig(): Promise<ResolvedEmailConfig | null> {
  // First check DB (App Password flow)
  const cfg = await db.emailConfig.findUnique({ where: { id: 'singleton' } })
  if (cfg && cfg.appPasswordEnc) {
    try {
      const encrypted = Buffer.from(cfg.appPasswordEnc, 'base64')
      const decrypted = decrypt(encrypted)
      const appPassword = decrypted.toString('utf8')
      return {
        emailAddress: cfg.emailAddress,
        appPassword,
        displayName: cfg.displayName,
      }
    } catch (e) {
      console.error('Failed to decrypt email config', e)
      return null
    }
  }

  // Fallback to OAuth env vars (legacy v1 path)
  const gmailUser = process.env.GMAIL_FROM_ADDRESS
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  if (gmailUser && refreshToken && clientId && clientSecret) {
    return {
      emailAddress: gmailUser,
      appPassword: '', // not used for OAuth
      displayName: gmailUser,
    }
  }

  return null
}

// Build a nodemailer transporter for the App Password flow.
async function buildTransporter(cfg: ResolvedEmailConfig) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: cfg.emailAddress,
      pass: cfg.appPassword,
    },
  })
}

export interface SendEmailResult {
  ok: boolean
  messageId?: string
  error?: string
  method: 'app_password' | 'oauth' | 'none'
}

// Send an email via the configured method.
// Falls back to Gmail OAuth API if App Password is not configured but env vars are.
export async function sendEmail(opts: {
  to: string
  subject: string
  body: string
  replyTo?: string
}): Promise<SendEmailResult> {
  const cfg = await getEmailConfig()
  if (!cfg) {
    return { ok: false, error: 'Email service not configured. Configure Gmail App Password in /admin/settings, or set GMAIL_* env vars. See README > Gmail Setup.', method: 'none' }
  }

  // If app password is set, use SMTP
  if (cfg.appPassword) {
    try {
      const transporter = await buildTransporter(cfg)
      await transporter.verify()
      const info = await transporter.sendMail({
        from: cfg.displayName ? `"${cfg.displayName}" <${cfg.emailAddress}>` : cfg.emailAddress,
        to: opts.to,
        subject: opts.subject,
        text: opts.body,
        replyTo: opts.replyTo,
      })
      return { ok: true, messageId: info.messageId, method: 'app_password' }
    } catch (e: any) {
      return { ok: false, error: `SMTP send failed: ${e.message || 'unknown error'}`, method: 'app_password' }
    }
  }

  // Fallback: OAuth API
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, error: 'Gmail OAuth env vars incomplete. Configure App Password in /admin/settings instead.', method: 'none' }
  }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!tokenRes.ok) {
      return { ok: false, error: 'OAuth token refresh failed', method: 'oauth' }
    }
    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token

    const mimeMessage = [
      `From: ${cfg.emailAddress}`,
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      opts.body,
    ].join('\r\n')
    const encoded = Buffer.from(mimeMessage).toString('base64url')

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    })
    if (!sendRes.ok) {
      return { ok: false, error: 'Gmail API send failed', method: 'oauth' }
    }
    const sent = await sendRes.json()
    return { ok: true, messageId: sent.id, method: 'oauth' }
  } catch (e: any) {
    return { ok: false, error: e.message || 'OAuth send failed', method: 'oauth' }
  }
}

// Verify SMTP connection — used by the "Test connection" button.
export async function testEmailConfig(emailAddress: string, appPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailAddress, pass: appPassword },
    })
    await transporter.verify()
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Connection failed' }
  }
}

// Save the encrypted App Password to DB.
export async function saveEmailConfig(opts: {
  emailAddress: string
  appPassword: string
  displayName?: string
}): Promise<void> {
  const encrypted = encrypt(Buffer.from(opts.appPassword, 'utf8'))
  const encoded = encrypted.toString('base64')
  await db.emailConfig.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      emailAddress: opts.emailAddress,
      appPasswordEnc: encoded,
      displayName: opts.displayName || null,
      isVerified: true,
      lastVerifiedAt: new Date(),
      lastError: null,
    },
    update: {
      emailAddress: opts.emailAddress,
      appPasswordEnc: encoded,
      displayName: opts.displayName || null,
      isVerified: true,
      lastVerifiedAt: new Date(),
      lastError: null,
    },
  })
}

// Get the public-facing config (no App Password!) for the admin UI.
export async function getPublicEmailConfig() {
  const cfg = await db.emailConfig.findUnique({ where: { id: 'singleton' } })
  if (!cfg) return null
  return {
    emailAddress: cfg.emailAddress,
    displayName: cfg.displayName,
    isVerified: cfg.isVerified,
    lastVerifiedAt: cfg.lastVerifiedAt?.toISOString() || null,
    lastError: cfg.lastError,
    hasAppPassword: !!cfg.appPasswordEnc,
  }
}

// Delete the email config (disconnect).
export async function deleteEmailConfig(): Promise<void> {
  await db.emailConfig.deleteMany({})
}
