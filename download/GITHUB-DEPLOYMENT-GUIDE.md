# Continue from Step 7: Deploy the Public Site to GitHub Pages

### Enable GitHub Pages

1. Push your code to GitHub (the workflow file `.github/workflows/deploy-pages.yml` is included)
2. Go to your repo → **Settings** → **Pages**
3. **Source**: **GitHub Actions** (not "Deploy from a branch")
4. The workflow will automatically run on every push to `main`
5. Wait ~3 minutes for the build to complete
6. Your site will be at: `https://USERNAME.github.io/REPO-NAME/`

### Update the site URL

After your Pages site is live, update the `PUBLIC_SITE_URL`:

1. Go to repo **Settings** → **Secrets and variables** → **Actions** → **Variables** tab
2. Add a variable: `PUBLIC_SITE_URL` = `https://USERNAME.github.io/REPO-NAME`
3. This gets picked up by the workflow automatically

### Important: Static export limitations

The `build:static` script produces a static export of the public site. Because GitHub Pages has no server:

| Feature | Works on GitHub Pages? |
|---|---|
| Hero, About, Experience, Projects, Skills, Education, Contact sections | ✅ Yes (static HTML) |
| Theme switching (light/dark/system) | ✅ Yes (client-side) |
| Typing animation | ✅ Yes (client-side) |
| Copy email/phone buttons | ✅ Yes (client-side) |
| Contact form | ❌ No (needs backend API) |
| Admin panel | ❌ No (needs backend) |
| Download résumé | ⚠️ Only if PDF is committed to repo (otherwise link breaks) |

**For the contact form + résumé download + admin to work**, you have two options:

**Option 1 (recommended): Host everything on Render**
Skip GitHub Pages entirely. Deploy the full Next.js app to Render. Your public site is at `https://vinay-portfolio-admin.onrender.com/` and the admin at `https://vinay-portfolio-admin.onrender.com/admin`. Everything works. Downside: cold starts on free tier.

**Option 2: Hybrid**
Host the public site on GitHub Pages (fast, no cold starts) and the admin + API on Render. Point the contact form to `https://vinay-portfolio-admin.onrender.com/api/contact` and the résumé link to `https://vinay-portfolio-admin.onrender.com/uploads/public/...`. This requires editing the public site's API URLs — not yet implemented in the code.

---

## Step 8: Verify Your Deployment

After both the admin panel and public site are deployed:

1. **Visit your public site** at `https://USERNAME.github.io/REPO-NAME/`
   - Should show your hero, projects, experience, etc.
   - Typing animation should work (if enabled)
   - Copy buttons should work
   - Theme toggle should work

2. **Visit your admin panel** at `https://vinay-portfolio-admin.onrender.com/admin/login`
   - Enter `#admin` in the footer `#code` field, or visit the URL directly
   - Sign in with `admin_user` / `admin_password@58`
   - **Change the password immediately** in Settings

3. **Test key flows:**
   - Submit the contact form on the public site → check `/admin/messages`
   - Publish your résumé from `/admin/resume` → check the Download button appears on the public site
   - Configure Gmail App Password in Settings → reply to a message
   - Toggle theme in Settings → check it applies on both sites

---

## Ongoing Maintenance

### When you make changes:

```bash
# 1. Make your changes locally
# 2. Commit
git add -A
git commit -m "your change description"
git push origin main

# 3. GitHub Actions automatically rebuilds + deploys the public site
# 4. Render automatically redeploys the admin panel
```

### Backing up your data:

1. Sign in to admin → **Backups** → **Create backup**
2. Download the encrypted `.enc` file (contains all content as encrypted JSON)
3. Store it somewhere safe (Google Drive, Dropbox, etc.)
4. Keep your `ENCRYPTION_KEY` separately (in a password manager) — without it, the backup is useless

### Rotating secrets:

If you ever suspect a secret was leaked (e.g., you accidentally committed `.env`):

1. Generate new secrets: `openssl rand -hex 32`
2. Update them in Render's environment variables
3. Restart the service
4. Re-seed the database (the old encrypted files/backups can't be decrypted with the new key)

### Updating dependencies:

```bash
bun update
git add bun.lock package.json
git commit -m "deps: update"
git push
```

---

## Troubleshooting

### "My .env got committed!"

```bash
# Remove from tracking (keeps local file)
git rm --cached .env

# Commit the removal
git add .gitignore
git commit -m "security: untrack .env"

# CRITICAL: Rotate all secrets in .env
# Generate new values:
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 32  # ENCRYPTION_KEY

# Update .env with new values
# Re-encrypt private files (they used the old key):
# - Re-upload your résumé
# - Re-configure Gmail App Password
# - Re-create backups

# Force-push to clean history (optional but recommended)
# Using git filter-repo (install first: pip install git-filter-repo)
git filter-repo --invert-paths --path .env
git push --force origin main
```

### "Build fails on Render"

Check the build logs. Common issues:
- Missing env var → add it in Render's Environment tab
- `prisma generate` fails → ensure `DATABASE_URL` is set before build
- Bun not available → switch runtime to Node, or use `npx prisma generate`

### "GitHub Pages shows 404"

1. Check the Actions tab — did the workflow succeed?
2. Verify Pages source is set to "GitHub Actions" in repo Settings → Pages
3. Wait 5-10 minutes after first deploy (GitHub CDN propagation)
4. Ensure your repo has the workflow file at `.github/workflows/deploy-pages.yml`

### "Admin panel resets on every deploy"

You need a persistent disk. In Render:
1. Go to your service → **Settings** → **Disks**
2. Add disk: mount path `/opt/data`, size 1 GB
3. Update `DATABASE_URL` to `file:/opt/data/custom.db`
4. Re-seed the database

### "Contact form doesn't work on GitHub Pages"

This is expected — GitHub Pages can't run API routes. Either:
- Deploy everything to Render (recommended), OR
- Set up a separate API URL (advanced — would need code changes to point the form to your Render URL)

### "Can't sign in after deploy"

The seed script must run once after the first deploy:
```bash
# On Render: use the Shell tab
bun run scripts/seed.ts

# On Fly.io:
fly ssh console -C "bun run scripts/seed.ts"
```

---

## Quick Reference: What's Public vs Private

### 🟢 PUBLIC (in your GitHub repo)
- `src/` — all source code
- `prisma/schema.prisma` — database structure
- `public/` — static assets (avatar, robots.txt, favicon)
- `scripts/` — helper scripts (seed, reset)
- `.env.example` — template with placeholder values
- `.gitignore` — ignore rules
- `README.md` — documentation
- `package.json`, `bun.lock`, `tsconfig.json`, `tailwind.config.ts`, etc.
- `.github/workflows/` — CI/CD config

### 🔴 PRIVATE (NEVER in your GitHub repo)
- `.env` — contains real secrets
- `db/custom.db` — your database (all content + password hashes + App Password)
- `data/private/` — encrypted résumé originals
- `data/backups/` — encrypted JSON backups
- `data/uploads/private/` — encrypted uploaded files
- `data/uploads/public/` — published résumé PDFs + avatar (regenerate from DB)
- `dev.log`, `server.log` — runtime logs
- `.zscripts/dev.pid` — process file

### 🔑 SECRETS (in GitHub Secrets or Render env vars, never in code)
- `SESSION_SECRET` — signs session cookies
- `ENCRYPTION_KEY` — encrypts private files + App Password
- `BOOTSTRAP_PASSWORD` — initial admin password
- `GMAIL_CLIENT_SECRET` — Gmail OAuth (if used)
- `GMAIL_REFRESH_TOKEN` — Gmail OAuth (if used)

---

## Summary Checklist

Before making your repo public:

- [ ] `.gitignore` includes `.env`, `db/`, `data/private/`, `data/backups/`, `data/uploads/`
- [ ] `git rm --cached .env` was run (if it was previously tracked)
- [ ] `git rm --cached db/custom.db` was run (if it was previously tracked)
- [ ] `git ls-files | grep -E "\.env$|\.db$|data/private"` returns nothing
- [ ] `.env.example` has only placeholder values (no real secrets)
- [ ] All secrets are in GitHub Secrets / Render env vars (not in code)
- [ ] GitHub Pages source is set to "GitHub Actions"
- [ ] Render service has a persistent disk mounted
- [ ] Seed script was run once after first deploy
- [ ] Bootstrap password was changed after first login

After following this guide, you'll have:
- **Public site**: `https://USERNAME.github.io/REPO-NAME/`
- **Admin panel**: `https://vinay-portfolio-admin.onrender.com/admin`
- **GitHub repo**: private, no secrets exposed
- **Database**: persistent on Render's disk
- **Backups**: encrypted, downloadable from admin
