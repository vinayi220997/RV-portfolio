# Portfolio + Secure Web Admin Panel (v2)

A complete personal portfolio website with a remote-admin panel, built for **Ramathota Vinay** (UI/UX Designer). Inspired by the [Nuance portfolio reference](https://nuance-portfolio.framer.website/), implemented with original content and architecture.

**Version history** lives in `download/versions/CHANGELOG.md`. Source for each version is preserved under `download/versions/vN/`. Prompts are in `download/prompts/prompt_vN.txt`.

## What's new in v2

1. **Version control** — v1 source saved to `download/versions/v1/`. Original prompt saved as `download/prompts/prompt_v1.txt`. Updated prompt saved as `download/prompts/prompt_v2.txt`.
2. **Admin login** — bootstrap credentials hint (`admin_user / admin_password@58`) is shown only before the first successful login (`User.hasLoggedInOnce=false`). After the first login, the hint is permanently hidden. `role_context` / `role_context@length` placeholders are always shown.
3. **Forgot password recovery flow** — requires a `#code` verification step before queueing a recovery request:
   - `#admin` (the reserved default admin code) grants a **one-time default-password login**. The `User.defaultPasswordLoginUsed` flag is set true and the default password can never be used again — not via the recovery flow, not via normal login.
   - Any other active custom code → "Queue recovery request" flow (operator-verified).
   - Invalid code → "Code not existed" error.
4. **Email Service via Gmail App Password (SMTP)** — admin can configure Gmail SMTP from the Settings page. The 16-char App Password is AES-GCM encrypted before storage, decrypted in-memory only when sending, and never returned to the browser. "Test connection" button verifies SMTP before saving. Falls back to Gmail OAuth env vars if App Password is not configured.
5. **Design refinements inspired by Nuance** — word-staggered hero typography, scroll-triggered reveal animations on every section (respects `prefers-reduced-motion`), scroll progress indicator, refined project hover states, refined ambient glow + grid texture in the hero.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite (single file, treated as private storage) |
| Auth | bcryptjs password hashing, signed HttpOnly session cookies, rate limiting, lockouts, one-time default-password login |
| Email | Gmail SMTP via App Password (nodemailer) + Gmail API OAuth fallback |
| Encryption | AES-GCM for private files, backups, and App Password at rest |
| Hosting (public site) | GitHub Pages (static export) — see *Deployment* |
| Hosting (admin + backend) | Any free-tier Node host (Render, Railway, Fly.io, Vercel Functions) |

---

## Quick Start (local dev)

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set SESSION_SECRET and ENCRYPTION_KEY:
#   openssl rand -hex 32   # for SESSION_SECRET
#   openssl rand -hex 32   # for ENCRYPTION_KEY

# 3. Initialize the database
bun run db:push

# 4. Seed with résumé content + bootstrap admin
bun run scripts/seed.ts

# 5. Start dev server
bun run dev
# Site:      http://localhost:3000
# Admin:     http://localhost:3000/admin/login
#            (enter "#admin" in the footer #code field on the public site)
```

### Bootstrap credentials

```
Login ID:  admin_user
Password:  admin_password@58
```

**These are shown only on the first visit to `/admin/login`.** After the first successful sign-in, the hint is hidden forever.

**The default password can only be used once.** Whether via direct login or via the recovery flow, after the first use of the bootstrap password, it is permanently blocked. The user must change their password immediately in `/admin/settings`.

---

## Architecture

```
portfolio/
├── public/                    # Static assets served to public site
│   ├── avatar.png
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── page.tsx           # Public portfolio (single-page composition)
│   │   ├── not-found.tsx      # Custom 404
│   │   ├── sitemap.ts         # Dynamic sitemap.xml
│   │   ├── manifest.ts        # PWA manifest
│   │   ├── admin/             # Protected admin panel
│   │   │   ├── login/         # Public login page (shows bootstrap hint only on first visit)
│   │   │   ├── profile/       # Edit profile (singleton)
│   │   │   ├── experience/    # CRUD list + edit
│   │   │   ├── projects/      # CRUD list + edit
│   │   │   ├── skills/        # CRUD list + edit
│   │   │   ├── education/     # CRUD list + edit
│   │   │   ├── certifications/# CRUD list + edit
│   │   │   ├── social/        # CRUD list + edit
│   │   │   ├── messages/      # Private contact-form inbox (with reply via Gmail)
│   │   │   ├── codes/         # Admin access codes management
│   │   │   ├── email-templates/
│   │   │   ├── resume/        # Private résumé versions + publishing
│   │   │   ├── backups/       # Encrypted backup create/restore
│   │   │   ├── audit/         # Audit log viewer
│   │   │   └── settings/      # Site settings + credentials + Gmail App Password config
│   │   └── api/
│   │       ├── contact/       # Public contact form (rate-limited)
│   │       ├── access-code/   # Public access-code route selector
│   │       └── admin/         # Protected admin APIs (auth required)
│   │           └── email-config/  # Gmail App Password save/test/disconnect (v2)
│   │       └── auth/
│   │           ├── login/             # Standard login (default password one-time)
│   │           ├── logout/
│   │           ├── me/
│   │           ├── change-credentials/
│   │           └── recover/           # Forgot password: verify code + queue request (v2)
│   │               └── default-login/ # One-time default-password login (v2)
│   ├── components/
│   │   ├── portfolio/         # Public site sections (Hero, About, …) + reveal animations (v2)
│   │   ├── admin/              # Admin shell, dashboards, editors, login client (v2)
│   │   └── ui/                # shadcn/ui primitives
│   └── lib/
│       ├── auth.ts            # bcrypt, sessions, rate limit, audit, recovery (v2), one-time default login (v2)
│       ├── crypto.ts          # AES-GCM encrypt/decrypt + custom PENC1 encoding
│       ├── email.ts           # Gmail SMTP via App Password + OAuth fallback (v2)
│       ├── storage.ts         # Private vs public file storage helpers
│       ├── public-content.ts  # Read-only published content for public site
│       └── db.ts              # Prisma client
├── prisma/schema.prisma       # Full data model (User v2: hasLoggedInOnce, defaultPasswordLoginUsed; EmailConfig v2)
├── data/                       # PRIVATE — gitignored
│   ├── private/                # Encrypted résumé versions
│   ├── backups/                # Encrypted JSON backups
│   └── uploads/
│       ├── public/             # Published resume copies (served to public)
│       └── private/            # Encrypted file uploads
└── scripts/
    ├── seed.ts                # Seed résumé content
    ├── reset-login-flags.ts   # Reset hasLoggedInOnce + defaultPasswordLoginUsed for testing
    ├── unlock-account.ts      # Reset bootstrap password + clear locks (operator-only)
    └── reset-password.ts      # Reset password for a user (operator-only)
```

---

## Security model (v2 updates)

### Authentication

- Passwords hashed with **bcrypt** (12 rounds).
- Sessions stored in **signed HttpOnly + SameSite cookies**, 12-hour TTL.
- Rate limiting on login (5 attempts / 15 min lockout).
- **NEW in v2**: Bootstrap password is **one-time use only**. After the first successful login (whether via `/api/auth/login` or via the recovery default-login flow), the `User.defaultPasswordLoginUsed` flag is set to true. The bootstrap password can never be used as a credential again. Any subsequent attempt to use the default password returns:
  > The default password can only be used once and has already been used. Use the recovery flow with a valid code.

### Bootstrap hint visibility

- The login page (`/admin/login`) queries the DB to check `User.hasLoggedInOnce`.
- The bootstrap credentials hint (`admin_user / admin_password@58`) is rendered **only** when `hasLoggedInOnce === false`.
- After the first successful login, `hasLoggedInOnce` is set to true and the hint is permanently hidden.
- `role_context` and `role_context@length` placeholders are always shown (per the prompt).

### Access codes (`#admin` and custom codes)

- The footer `#code` field is a **public route selector only**. It never authenticates the user.
- The reserved `#admin` code:
  - Cannot be deleted, disabled, renamed, or re-created.
  - Always routes to the login screen.
  - In the **forgot password flow**, `#admin` grants a one-time default-password login (if not already used).
- Custom codes:
  - In the **forgot password flow**, any active custom code allows the "Queue recovery request" flow (operator-verified).

### Forgot password flow

1. User clicks "Forgot password?" on the login page.
2. Modal opens asking for a `#code` verification.
3. User enters a code. The server validates it:
   - **`#admin` (reserved)**: if `defaultPasswordLoginUsed === false` AND the user still has the bootstrap password set, the server issues a single-use token. The user clicks "Sign in with default password" which calls `/api/auth/recover/default-login`. The token is consumed and the user is signed in. After this, `defaultPasswordLoginUsed` is true forever.
   - **Valid active custom code**: the user is shown the "Queue recovery request" button. Clicking it records an audit event and queues the request.
   - **Invalid code**: returns "Code not existed".
4. Tokens have a 5-minute TTL and can only be used once.

### Email credentials (Gmail App Password)

- The App Password is stored **AES-GCM encrypted** in the `EmailConfig` table using `ENCRYPTION_KEY`.
- It is decrypted **in-memory only** when sending an email.
- It is **never returned to the browser** by any API endpoint (only metadata like `emailAddress`, `displayName`, `isVerified`, `lastVerifiedAt`).
- The "Test connection" button verifies SMTP via `nodemailer.verify()` before persisting.
- Disconnect clears the row from the database.

---

## Recovery (if you lose your password)

Because this is a self-hosted file-based system, recovery requires operator access to the server filesystem:

1. SSH or otherwise access the host running the admin.
2. Run a one-off script to set a new password hash directly:

   ```bash
   bun run scripts/reset-password.ts admin_user NEW_STRONG_PASSWORD
   ```

3. The script clears `mustChangePwd` and invalidates sessions.
4. Sign in with the new password and immediately change it via the admin Settings page.

Alternatively, you can run `bun run scripts/unlock-account.ts` which resets the bootstrap password AND clears `hasLoggedInOnce` + `defaultPasswordLoginUsed` for testing purposes (operator-only, never expose to end users).

If `ENCRYPTION_KEY` is lost, encrypted private files, backups, and the App Password cannot be recovered. Keep a secure offline copy of the key.

---

## Gmail Setup (App Password — recommended)

The admin reply feature supports Gmail SMTP via App Password (no OAuth flow needed).

1. **Enable 2-Step Verification** on your Google account:
   - https://myaccount.google.com/security → 2-Step Verification.

2. **Generate an App Password**:
   - Visit https://myaccount.google.com/apppasswords.
   - Choose "Mail" + your device, generate.
   - You'll receive a **16-character** password (e.g. `abcd efgh ijkl mnop`).

3. **Configure in the admin panel**:
   - Sign in to `/admin` → Settings → Gmail App Password.
   - Enter your Gmail address, display name (optional), and the 16-char App Password (with or without spaces — they're stripped).
   - Click **Test connection** to verify SMTP.
   - Click **Save & verify** to persist (the password is AES-GCM encrypted before storage).

4. Test by replying to a message in `/admin/messages`. A successful send returns a Gmail message ID and the audit log records `email_sent` with `method: "app_password"`.

### Fallback: Gmail OAuth env vars (legacy v1)

If you prefer OAuth over App Password, set these env vars:
```
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_FROM_ADDRESS=you@gmail.com
```

The send-email helper tries App Password first, then falls back to OAuth, then returns a 503 with a clear error if neither is configured.

### Error handling

- Invalid App Password → SMTP returns `535-5.7.8 Username and Password not accepted`. The admin UI displays this as a clear error message.
- 2FA not enabled → "App Passwords are 16 characters" or similar connection error.
- Connection failure → "Connection test failed" with the underlying error.

---

## Deployment

### Public site → GitHub Pages

The public-facing portfolio (`/`) renders server-side via Next.js, but its content is read from the SQLite database. To deploy a **fully static** version to GitHub Pages:

1. Add a GitHub Actions workflow that runs `bun run build` with `output: 'export'` enabled in `next.config.ts` for the `/` route only.
2. Upload the resulting `out/` directory to the `gh-pages` branch (or use `actions/deploy-pages@v4`).
3. Set `base` and `assetPrefix` in `next.config.ts` to `/<repo-name>/`.
4. Set `PUBLIC_SITE_URL` env to your GitHub Pages URL.

### Admin + backend → free Node host

Recommended free-tier hosts: **Render** (easiest, persistent disk), **Fly.io** (best perf), **Vercel** (ephemeral filesystem — only with external storage like Cloudflare R2).

Steps (Render):

1. Push this repo to GitHub (private repo is fine).
2. New Web Service → connect repo.
3. Build command: `bun install && bun run db:push`
4. Start command: `bun run start`
5. Set env vars from `.env.example`.
6. Mount a persistent disk at `/opt/data` and set `DATABASE_URL=file:/opt/data/db.sqlite`.
7. After first deploy, run `bun run scripts/seed.ts` once.
8. After seed, configure Gmail App Password in `/admin/settings`.

---

## Audit log

Every meaningful admin action is logged with timestamp, IP, user-agent, and a metadata blob (no passwords or tokens). v2 adds:
- `recovery_code_rejected`, `recovery_code_accepted`
- `recovery_default_blocked`, `recovery_default_issued`, `recovery_default_login_success`
- `recovery_request_queued`
- `sign_in_blocked_default_reused` (when bootstrap password reuse is attempted)
- `email_config_saved`, `email_config_test_failed`, `email_config_disconnected`

View at `/admin/audit` (admin only).

---

## Backups

- **Encrypted at rest** (AES-GCM) with the `ENCRYPTION_KEY` env.
- Contain a JSON snapshot of: profile, settings, experience, projects, skills, education, certifications, social links, contact messages, admin codes, email templates, audit log, publication events, AND email config (App Password included, encrypted).
- **Do not contain** the original résumé PDFs (those live in `data/private/` and `data/uploads/private/`).
- Create at `/admin/backups`. Restore requires confirmation and overwrites current DB.

---

## Custom encoding format

`src/lib/crypto.ts` defines a versioned, documented encoding format:

```
PENC1\n<base64(JSON.stringify(data))>
```

This is **obfuscation, not encryption**. It is used inside encrypted backups so the JSON snapshot has a clear version prefix. If you change the format in the future, bump the version prefix (e.g. `PENC2`) and add a migration.

---

## Privacy & data retention

- **Public site** exposes only `status: 'published'` rows.
- **Contact messages** are stored privately. Delete via the admin inbox.
- **Audit logs** are kept indefinitely unless you delete rows from `db.auditLog`.
- **Backups** are encrypted at rest. Treat `ENCRYPTION_KEY` as the master secret.
- **Gmail App Password** is encrypted with the same `ENCRYPTION_KEY`. If the key is lost, the App Password cannot be recovered but can be reset by disconnecting and re-configuring.
- **Gmail integration** sends email only when an admin composes/replies from the admin panel. No incoming mail is read.

---

## Free-tier comparison

| Service | Use | Free tier | Limit to watch |
|---------|-----|-----------|----------------|
| GitHub Pages | Public static site | Unlimited for public repos | 1 GB repo + 100 GB bandwidth/month |
| Render (Web Service) | Admin + backend | 750 hours/month | 15-min inactivity spins down |
| Fly.io | Admin + backend | 3 always-on shared-CPU VMs, 1GB each | Credit card required |
| Cloudflare R2 | External object storage (if needed) | 10 GB + 1M Class A ops/month | Egress free |
| Gmail API / SMTP | Reply to messages | 1B quota units/day (API) or ~500/day (SMTP) | 250 units/sec per user (API) |
| Google OAuth | User consent | Unlimited test users (unverified app) | 100 users until verified |

---

## Security checklist

- [x] No hardcoded secrets in source
- [x] `.env` is gitignored; `.env.example` contains placeholder names only
- [x] `data/private/`, `data/backups/`, `data/uploads/private/` gitignored
- [x] SQLite file gitignored
- [x] Sessions are signed, HttpOnly, SameSite=lax
- [x] Passwords bcrypt-hashed (12 rounds)
- [x] Failed login rate-limited + lockout
- [x] **NEW**: Bootstrap password is one-time use (defaultPasswordLoginUsed flag)
- [x] **NEW**: Bootstrap hint shown only on first visit (hasLoggedInOnce flag)
- [x] All `/api/admin/*` routes require authenticated session
- [x] `#admin` reserved code is protected against delete/disable/rename
- [x] **NEW**: Forgot password requires #code verification before queueing recovery
- [x] **NEW**: `#admin` in recovery flow → one-time default-password login (cannot be reused)
- [x] **NEW**: Custom codes in recovery flow → queue recovery request (operator-verified)
- [x] Contact form rate-limited per IP
- [x] Contact form validates email + length on both client and server
- [x] Public site only ever reads `status: 'published'` rows
- [x] Original résumé never auto-published — explicit admin action required
- [x] Original résumé stored encrypted at rest (AES-GCM)
- [x] Backups encrypted at rest
- [x] **NEW**: Gmail App Password stored AES-GCM encrypted, never returned to client
- [x] **NEW**: SMTP verified before persisting App Password
- [x] Audit log records every state-changing action including new v2 events
- [x] Audit log never logs passwords, tokens, or App Passwords
- [x] Gmail client secret + refresh token server-only — never reach the browser
- [x] 404 page exists; robots.txt blocks `/admin` and `/uploads/private`
- [x] `prefers-reduced-motion` respected via CSS and IntersectionObserver-based reveals

---

## Maintenance

- **Rotate `SESSION_SECRET`**: invalidates all sessions; users must sign in again.
- **Rotate `ENCRYPTION_KEY`**: requires re-encrypting all private files AND the App Password. Script needed — read each encrypted row/file, decrypt with old key, re-encrypt with new.
- **Rotate Gmail App Password**: visit Google App Passwords, revoke + create new, update in `/admin/settings`.
- **Rotate admin password**: `/admin/settings` → Change credentials.
- **Rotate custom access codes**: `/admin/codes` → delete + recreate.

---

## Version history

See `download/versions/CHANGELOG.md` for the full version history. Each version's source is preserved under `download/versions/vN/` and the corresponding prompt is saved as `download/prompts/prompt_vN.txt`.

---

## License

Source code: MIT. Personal content (résumé, photo, projects) © Ramathota Vinay.
