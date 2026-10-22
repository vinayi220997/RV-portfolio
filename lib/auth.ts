import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours
const MAX_FAILED = 5
const LOCK_MS = 1000 * 60 * 15 // 15 min lockout

export function getSecret(name: string, fallback = ''): string {
  return process.env[name] || fallback
}

// ---------- Password hashing ----------

const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

// ---------- Sessions (signed cookie) ----------

function sign(payload: string): string {
  const secret = getSecret('SESSION_SECRET', 'dev-only-secret-please-replace')
  const h = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${h}`
}

function verifySigned(signed: string): string | null {
  if (!signed) return null
  const [payload, sig] = signed.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  if (expected !== signed) return null
  return payload
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = JSON.stringify({ uid: userId, exp: expiresAt, nonce: generateToken(8) })
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  const signed = sign(encoded)
  const store = await cookies()
  store.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<{ id: string; loginId: string; mustChangePwd: boolean } | null> {
  const store = await cookies()
  const signed = store.get(SESSION_COOKIE)?.value
  if (!signed) return null
  const encoded = verifySigned(signed)
  if (!encoded) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    const user = await db.user.findUnique({ where: { id: payload.uid } })
    if (!user) return null
    if (user.lockedUntil && user.lockedUntil > new Date()) return null
    return { id: user.id, loginId: user.loginId, mustChangePwd: user.mustChangePwd }
  } catch {
    return null
  }
}

export async function requireUser() {
  const u = await getCurrentUser()
  if (!u) {
    throw new Error('UNAUTHORIZED')
  }
  return u
}

// ---------- Login flow ----------

export interface LoginResult {
  ok: boolean
  message: string
  mustChangePwd?: boolean
}

export async function attemptLogin(loginId: string, password: string, ip?: string, ua?: string): Promise<LoginResult> {
  const user = await db.user.findFirst({ where: { loginId: { equals: loginId } } })
  if (!user) {
    await audit({ action: 'sign_in_failed', category: 'auth', summary: `Unknown loginId attempted: ${loginId}`, ipAddress: ip, userAgent: ua })
    return { ok: false, message: 'Incorrect ID or password' }
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    await audit({ action: 'sign_in_locked', category: 'auth', summary: `Locked account login attempt (${mins}m remaining)`, ipAddress: ip, userAgent: ua, metadata: { userId: user.id } })
    return { ok: false, message: `Too many attempts. Try again in ${mins} minute(s).` }
  }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    const attempts = user.failedAttempts + 1
    const lock = attempts >= MAX_FAILED
    await db.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null,
      },
    })
    await audit({ action: 'sign_in_failed', category: 'auth', summary: `Wrong password for ${loginId}`, ipAddress: ip, userAgent: ua, metadata: { attempts, locked: lock } })
    if (lock) {
      return { ok: false, message: 'Too many failed attempts. Account locked for 15 minutes.' }
    }
    return { ok: false, message: 'Incorrect ID or password' }
  }
  // success — reset failed attempts and mark that the first login happened.
  // The bootstrap password remains usable for login until the user changes it.
  // Visibility of the bootstrap hint is controlled by hasLoggedInOnce (UI only).
  await db.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      hasLoggedInOnce: true,
    },
  })
  await createSession(user.id)
  await audit({ action: 'sign_in_success', category: 'auth', summary: `Signed in as ${loginId}`, ipAddress: ip, userAgent: ua, metadata: { userId: user.id } })
  return { ok: true, message: 'Login successful', mustChangePwd: user.mustChangePwd }
}

// ---------- Bootstrap ----------

export async function ensureBootstrapUser(): Promise<void> {
  const count = await db.user.count()
  if (count > 0) return
  const loginId = getSecret('BOOTSTRAP_LOGIN_ID', 'admin_user')
  const password = getSecret('BOOTSTRAP_PASSWORD', 'admin_password@58')
  const hash = await hashPassword(password)
  await db.user.create({
    data: {
      loginId,
      passwordHash: hash,
      mustChangePwd: true,
    },
  })
  // Reserved #admin code
  const exists = await db.adminCode.findUnique({ where: { code: '#admin' } })
  if (!exists) {
    await db.adminCode.create({
      data: {
        code: '#admin',
        label: 'Primary Administrator',
        isActive: true,
        isReserved: true,
      },
    })
  }
}

// ---------- Audit ----------

export async function audit(input: {
  action: string
  category: string
  summary: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        category: input.category,
        summary: input.summary,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        metadata: input.metadata || null,
      },
    })
  } catch (e) {
    // never fail the request because of audit failure
    console.error('audit log failed', e)
  }
}

// ---------- Recovery code ----------

export async function issueRecoveryCode(userId: string): Promise<string> {
  const code = generateToken(6)
  const hash = await hashPassword(code)
  await db.user.update({
    where: { id: userId },
    data: {
      recoveryCodeHash: hash,
      recoveryExpires: new Date(Date.now() + 1000 * 60 * 30),
    },
  })
  return code
}

// ---------- Change credentials ----------

export async function changeCredentials(opts: {
  userId: string
  currentPassword: string
  newLoginId?: string
  newPassword?: string
}): Promise<{ ok: boolean; message: string }> {
  const user = await db.user.findUnique({ where: { id: opts.userId } })
  if (!user) return { ok: false, message: 'User not found' }
  const ok = await verifyPassword(opts.currentPassword, user.passwordHash)
  if (!ok) return { ok: false, message: 'Current password is incorrect' }
  const data: any = { mustChangePwd: false, failedAttempts: 0, lockedUntil: null }
  if (opts.newLoginId && opts.newLoginId !== user.loginId) {
    const taken = await db.user.findFirst({ where: { loginId: opts.newLoginId } })
    if (taken) return { ok: false, message: 'Login ID already in use' }
    data.loginId = opts.newLoginId
  }
  if (opts.newPassword) {
    if (opts.newPassword.length < 10) return { ok: false, message: 'Password must be at least 10 characters' }
    data.passwordHash = await hashPassword(opts.newPassword)
  }
  await db.user.update({ where: { id: user.id }, data })
  await audit({ action: 'credentials_changed', category: 'security', summary: 'Credentials updated by user', metadata: { loginIdChanged: !!data.loginId, passwordChanged: !!data.passwordHash } })
  await destroySession()
  return { ok: true, message: 'Credentials updated. Please sign in again.' }
}

// ---------- Public bootstrap helpers (for login page rendering) ----------

// Returns true if the bootstrap credentials hint should be shown on the login page.
// We show the hint only when no successful login has ever happened.
export async function shouldShowBootstrapHint(): Promise<boolean> {
  const user = await db.user.findFirst()
  if (!user) return true
  return !user.hasLoggedInOnce
}

// ---------- Recovery flow ----------

export interface RecoveryVerifyResult {
  ok: boolean
  message: string
  kind?: 'default' | 'recovery' | 'invalid'
  oneTimeToken?: string // single-use token for default-password login
}

// Verify the access code entered in the forgot-password flow.
//  - '#admin' (the reserved default admin code):
//      → if the user's password still matches the bootstrap password (i.e. they
//        haven't changed it), issue a single-use login token. This flow can be
//        triggered whenever the admin forgets their password — there is no
//        "already used" restriction. Each token is single-use, but the admin
//        can re-trigger the verification + token issuance as many times as needed.
//  - Any other active non-reserved code:
//      → allow the "Queue recovery request" flow (operator-verified).
//  - Anything else: invalid.
export async function verifyRecoveryCode(code: string, ip?: string): Promise<RecoveryVerifyResult> {
  const trimmed = code.trim()
  if (!trimmed.startsWith('#')) {
    return { ok: false, message: 'Code must start with #', kind: 'invalid' }
  }
  const record = await db.adminCode.findUnique({ where: { code: trimmed } })
  if (!record || !record.isActive) {
    await audit({ action: 'recovery_code_rejected', category: 'security', summary: `Unknown/inactive recovery code attempted: ${trimmed}`, ipAddress: ip })
    return { ok: false, message: 'Code not existed', kind: 'invalid' }
  }

  // Reserved #admin → default-password login (works whenever password is unchanged)
  if (record.isReserved) {
    const user = await db.user.findFirst()
    if (!user) {
      return { ok: false, message: 'Code not existed', kind: 'invalid' }
    }
    // Verify the user still has the bootstrap password (i.e., hasn't changed it).
    const bootstrapPwd = getSecret('BOOTSTRAP_PASSWORD', 'admin_password@58')
    const stillBootstrap = await verifyPassword(bootstrapPwd, user.passwordHash)
    if (!stillBootstrap) {
      await audit({ action: 'recovery_default_blocked', category: 'security', summary: 'Default password no longer matches (password already changed)', ipAddress: ip })
      return { ok: false, message: 'The default password is no longer active on this account. Use a valid recovery code instead.', kind: 'invalid' }
    }
    // Issue a single-use token (TTL 5 min). The token itself is single-use, but
    // the admin can re-trigger this entire flow as many times as needed.
    const token = generateToken(16)
    const tokenHash = await hashPassword(token)
    await db.user.update({
      where: { id: user.id },
      data: {
        recoveryCodeHash: tokenHash,
        recoveryExpires: new Date(Date.now() + DEFAULT_TOKEN_TTL_MS),
      },
    })
    await audit({ action: 'recovery_default_issued', category: 'security', summary: 'Default-password login token issued', ipAddress: ip, metadata: { userId: user.id } })
    return { ok: true, message: 'Verified. You may sign in using the default password.', kind: 'default', oneTimeToken: token }
  }

  // Valid custom code → queue recovery flow
  await audit({ action: 'recovery_code_accepted', category: 'security', summary: `Recovery code accepted: ${trimmed} (${record.label})`, ipAddress: ip, metadata: { codeId: record.id } })
  return { ok: true, message: 'Verified. You may queue a recovery request.', kind: 'recovery' }
}

// Token store: tokens are persisted in User.recoveryCodeHash (bcrypt-hashed) +
// User.recoveryExpires. Each token is single-use — once consumed, the hash is
// cleared and the token cannot be replayed. The admin can re-trigger
// verifyRecoveryCode to issue a new token at any time (as long as the password
// is still the bootstrap default).
const DEFAULT_TOKEN_TTL_MS = 5 * 60 * 1000

// Attempt login using the bootstrap password, gated by a single-use recovery token.
// The token is verified against User.recoveryCodeHash (bcrypt). After successful
// login, recoveryCodeHash + recoveryExpires are cleared. The bootstrap password
// remains usable for future logins until the user changes it.
export async function attemptDefaultRecoveryLogin(token: string, ip?: string, ua?: string): Promise<LoginResult> {
  const user = await db.user.findFirst()
  if (!user) {
    return { ok: false, message: 'Incorrect ID or password' }
  }
  if (!user.recoveryCodeHash || !user.recoveryExpires) {
    return { ok: false, message: 'The recovery token is invalid or has expired.' }
  }
  if (user.recoveryExpires < new Date()) {
    await db.user.update({ where: { id: user.id }, data: { recoveryCodeHash: null, recoveryExpires: null } })
    return { ok: false, message: 'The recovery token has expired.' }
  }
  const tokenMatches = await verifyPassword(token, user.recoveryCodeHash)
  if (!tokenMatches) {
    return { ok: false, message: 'The recovery token is invalid or has expired.' }
  }
  // Verify the user still has the bootstrap password (defense in depth).
  const bootstrapPwd = getSecret('BOOTSTRAP_PASSWORD', 'admin_password@58')
  const ok = await verifyPassword(bootstrapPwd, user.passwordHash)
  if (!ok) {
    return { ok: false, message: 'Incorrect ID or password' }
  }
  // Consume the token (single-use) and sign the user in.
  await db.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      hasLoggedInOnce: true,
      recoveryCodeHash: null,
      recoveryExpires: null,
    },
  })
  await createSession(user.id)
  await audit({ action: 'recovery_default_login_success', category: 'security', summary: 'Default-password login completed via recovery', ipAddress: ip, userAgent: ua, metadata: { userId: user.id } })
  return { ok: true, message: 'Login successful. Please change your password in Settings.', mustChangePwd: true }
}

