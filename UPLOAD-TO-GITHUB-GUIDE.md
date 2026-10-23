# How to Upload Your Portfolio to GitHub

A step-by-step guide for downloading the zip from here, extracting it, and uploading to GitHub.

---

## Overview

You have a zip file: **`portfolio-source-code.zip`** (11 MB)

It contains:
- All your source code (`src/`)
- Database schema (`prisma/`)
- Public assets (`public/`)
- Helper scripts (`scripts/`)
- GitHub Actions workflow (`.github/`)
- Config files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`README.md`, `GITHUB-DEPLOYMENT-GUIDE.md`)

It does **NOT** contain (kept private):
- `.env` (secrets)
- `db/custom.db` (your database)
- `data/` (private files, backups, uploads)
- `node_modules/` (will be reinstalled)
- `.next/` (build output)

---

## Step 1: Download the Zip

1. Download **`portfolio-source-code.zip`** from the download folder
2. Save it somewhere on your computer (e.g., Desktop or Downloads folder)

---

## Step 2: Create a GitHub Repository

1. Go to https://github.com and sign in
2. Click the **+** icon in the top-right corner → **New repository**

3. Fill in the form:
   - **Repository name**: `portfolio` (or `ramathota-vinay-portfolio`)
   - **Description** (optional): `Personal portfolio website + secure admin panel`
   - **Visibility**:
     - ✅ **Private** (recommended — your code is hidden, only the deployed site is public)
     - ⚪ Public (anyone can read your code — fine since no secrets are included, but Private is safer)
   - **Initialize this repository with**:
     - ❌ Do NOT check "Add a README file"
     - ❌ Do NOT check "Add .gitignore"
     - ❌ Do NOT check "Choose a license"
     > Your zip already has these files. Checking these boxes would create conflicts.

4. Click **Create repository**

5. GitHub shows you a page with setup commands. **Leave this page open** — you'll need it in Step 4.

---

## Step 3: Extract the Zip on Your Computer

### On Windows:
1. Right-click `portfolio-source-code.zip`
2. Select **Extract All...**
3. Choose a location (e.g., `C:\Users\YourName\portfolio`)
4. Click **Extract**

### On Mac:
1. Double-click `portfolio-source-code.zip`
2. A folder named `portfolio-source-code` will appear in the same location
3. (Optional) Rename it to `portfolio`

### On Linux:
```bash
unzip portfolio-source-code.zip -d portfolio
cd portfolio
```

### After extraction, verify these files exist:

```
portfolio/
├── .env.example          ← Template (no real secrets)
├── .gitignore            ← Ignore rules
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── package.json
├── prisma/
│   └── schema.prisma
├── public/
│   ├── avatar.png
│   ├── robots.txt
│   └── ...
├── scripts/
│   ├── seed.ts
│   └── ...
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
├── tsconfig.json
├── tailwind.config.ts
└── ...
```

> ⚠️ **Important**: If you don't see `.env.example` or `.gitignore`, they may be hidden. On Mac/Linux, press `Cmd+Shift+.` (Mac) or `Ctrl+H` (Linux) to show hidden files. On Windows, in File Explorer → View → check "Hidden items".

---

## Step 4: Upload to GitHub

You have two options. **Option A (GitHub web upload)** is easiest for beginners. **Option B (Git command line)** is better if you'll make frequent updates.

### Option A: Upload via GitHub Web Interface (Easiest)

1. On the GitHub repo page (from Step 2), you'll see:
   - **"...or push an existing repository from the command line"**
   - **"...or import code from another repository"**
   - A button: **"uploading an existing file"** ← Click this

2. You'll see a drag-and-drop area that says **"Drag files here to add to your repository"**

3. **Drag ALL the files and folders** from your extracted `portfolio/` folder into this area:
   - Drag `.env.example`, `.gitignore`, `package.json`, etc.
   - Drag the `src/`, `prisma/`, `public/`, `scripts/`, `.github/` folders
   - ⚠️ **Make sure to drag the contents INSIDE the folder, not the folder itself** — you want files at the root of the repo, not nested in a `portfolio-source-code/` subfolder

4. Wait for all files to upload (may take 2-3 minutes for the 11 MB)

5. At the bottom, add a commit message:
   ```
   Initial commit: portfolio website + admin panel
   ```

6. Click **Commit changes**

7. ⚠️ **Important**: GitHub's web uploader sometimes skips hidden files (files starting with `.`). Verify that `.env.example` and `.gitignore` were uploaded:
   - Look at your repo's file list
   - If `.env.example` or `.gitignore` are missing, click **"Add file" → "Create new file"**
   - For `.gitignore`: name it `.gitignore`, paste the content from your local file, commit
   - For `.env.example`: name it `.env.example`, paste the content, commit

### Option B: Upload via Git Command Line (Better for updates)

#### Prerequisites:
- Install Git: https://git-scm.com/downloads
- Open Terminal (Mac/Linux) or Git Bash (Windows)

#### Commands:

```bash
# Navigate to your extracted folder
cd /path/to/portfolio

# Initialize git (if not already a git repo)
git init
git branch -M main

# Add all files (respects .gitignore)
git add -A

# Verify NO sensitive files are staged (should be empty)
git status | grep -E "\.env$|\.db$|data/private|data/backups"

# If the above shows ANY files, DO NOT commit. Run:
# git rm --cached .env db/custom.db
# Then re-check

# Commit
git commit -m "Initial commit: portfolio website + admin panel"

# Add your GitHub repo as a remote
# Replace YOUR-USERNAME and REPO-NAME with your actual values
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git

# Push to GitHub
git push -u origin main
```

#### If git asks for credentials:
- GitHub no longer accepts passwords for git push
- Use a **Personal Access Token** instead:
  1. Go to https://github.com/settings/tokens
  2. Generate new token (classic) → check "repo" scope
  3. Copy the token
  4. When git asks for password, paste the token (not your GitHub password)
  5. Consider using GitHub CLI instead: https://cli.github.com/

---

## Step 5: Verify the Upload

1. Go to your GitHub repo page: `https://github.com/YOUR-USERNAME/REPO-NAME`

2. Verify these are present:
   - ✅ `src/` folder with your code
   - ✅ `prisma/schema.prisma`
   - ✅ `public/` with avatar and robots.txt
   - ✅ `package.json`
   - ✅ `.github/workflows/deploy-pages.yml`
   - ✅ `.env.example` (might be hidden — click the gear icon to show hidden files)
   - ✅ `.gitignore`

3. Verify these are **NOT** present (critical!):
   - ❌ `.env` (should NOT be there — only `.env.example`)
   - ❌ `db/custom.db` (should NOT be there)
   - ❌ `data/private/` (should NOT be there)
   - ❌ `data/backups/` (should NOT be there)
   - ❌ `node_modules/` (should NOT be there)

> ⚠️ **If you see `.env` or `db/custom.db` in your repo, delete them immediately**:
> - Click the file → click the trash icon → commit the deletion
> - Then generate new secrets (the old ones are compromised)

---

## Step 6: Set Up GitHub Secrets

Your code references environment variables that don't exist in the repo (they're in `.env` locally, which isn't uploaded). You need to add them as GitHub Secrets.

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**

2. Click **New repository secret** for each of these:

| Name | Value | How to generate |
|------|-------|-----------------|
| `SESSION_SECRET` | 64-char hex string | Run: `openssl rand -hex 32` in terminal |
| `ENCRYPTION_KEY` | 64-char hex string | Run: `openssl rand -hex 32` in terminal |
| `BOOTSTRAP_LOGIN_ID` | `admin_user` | (default) |
| `BOOTSTRAP_PASSWORD` | `admin_password@58` | (default — change after first login) |
| `DATABASE_URL` | `file:./db/custom.db` | (tells Prisma where the DB is) |

> 💡 **To generate secrets on Windows**: Open PowerShell and run:
> ```powershell
> -join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_})
> ```
> Or use an online generator: https://generate-random.org/api/key-generator

> 💡 **To generate secrets on Mac/Linux**: Open Terminal and run:
> ```bash
> openssl rand -hex 32
> ```

3. (Optional) Add Gmail secrets if you want email replies:
   - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_ADDRESS`
   - See `GITHUB-DEPLOYMENT-GUIDE.md` → Gmail Setup section

---

## Step 7: Deploy the Admin Panel

The admin panel needs a real server (GitHub Pages can't run API routes). Deploy to **Render** (free):

1. Go to https://render.com → Sign up with GitHub

2. **New +** → **Web Service**

3. **Connect a repository** → select your `portfolio` repo

4. Configure:
   - **Name**: `vinay-portfolio-admin`
   - **Runtime**: Node (or Bun)
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
     > Use `npm` not `bun` on Render unless you select the Bun runtime
   - **Start Command**: `npm start`
     > If `npm start` fails, use: `node .next/standalone/server.js`
   - **Instance Type**: Free

5. **Environment Variables** (click "Advanced" to expand):
   Add each variable from Step 6:
   - `DATABASE_URL` = `file:./db/custom.db`
   - `SESSION_SECRET` = (your generated secret)
   - `ENCRYPTION_KEY` = (your generated secret)
   - `BOOTSTRAP_LOGIN_ID` = `admin_user`
   - `BOOTSTRAP_PASSWORD` = `admin_password@58`
   - `NODE_ENV` = `production`

6. **Persistent Disk** (IMPORTANT — without this, your database resets on every deploy):
   - Scroll to "Disks" section
   - **Add Disk**:
     - Name: `portfolio-data`
     - Mount Path: `/opt/data`
     - Size: 1 GB
   - Then update `DATABASE_URL` to: `file:/opt/data/custom.db`

7. Click **Create Web Service**

8. Wait for the build (2-5 minutes). Watch the logs for errors.

9. After successful deploy, **run the seed script once**:
   - Go to your service → **Shell** tab (or "Manual Deploy" → "Clear build cache & deploy" if Shell isn't available)
   - Run: `npm run seed` (or `npx bun scripts/seed.ts`)
   - This populates the database with your résumé content

10. Visit your admin URL: `https://vinay-portfolio-admin.onrender.com/admin/login`

11. Sign in with `admin_user` / `admin_password@58`

12. **Immediately change the password** in Settings → Change credentials

---

## Step 8: Enable GitHub Pages (Public Site)

1. Go to your repo → **Settings** → **Pages**

2. **Source**: Select **GitHub Actions** (not "Deploy from a branch")

3. The workflow at `.github/workflows/deploy-pages.yml` will automatically:
   - Trigger on every push to `main`
   - Install dependencies
   - Build a static export
   - Deploy to GitHub Pages

4. Go to **Actions** tab to watch the build progress

5. After ~3-5 minutes, your public site will be live at:
   ```
   https://YOUR-USERNAME.github.io/REPO-NAME/
   ```

6. Update the `PUBLIC_SITE_URL`:
   - Repo Settings → Secrets and variables → Actions → **Variables** tab
   - Add variable: `PUBLIC_SITE_URL` = `https://YOUR-USERNAME.github.io/REPO-NAME`
   - This gets picked up by the next build automatically

---

## Step 9: Verify Everything Works

### Public site (GitHub Pages):
- [ ] Visit `https://YOUR-USERNAME.github.io/REPO-NAME/`
- [ ] Hero, About, Experience, Projects, Skills, Contact sections render
- [ ] Theme toggle works
- [ ] Copy email/phone buttons work
- [ ] Typing animation works (if enabled)

### Admin panel (Render):
- [ ] Visit `https://vinay-portfolio-admin.onrender.com/admin`
- [ ] Can sign in with bootstrap credentials
- [ ] Dashboard shows your content
- [ ] Can edit profile, experience, projects
- [ ] Can publish résumé
- [ ] Can configure Gmail App Password
- [ ] Contact form on public site → messages appear in admin inbox

### Known limitations:
- The contact form on GitHub Pages **will not work** (GitHub Pages can't run API routes)
  - **Fix**: Either host the full app on Render (simplest), OR point the form to your Render API URL
- Résumé download on GitHub Pages **will not work** unless the PDF is committed to the repo
  - **Fix**: Host everything on Render, OR commit the published PDF to `public/` in the repo

### Recommended: Host everything on Render

For the simplest setup where everything works, skip GitHub Pages and use Render only:
- Public site: `https://vinay-portfolio-admin.onrender.com/`
- Admin panel: `https://vinay-portfolio-admin.onrender.com/admin`
- All features work (contact form, résumé download, email replies)

GitHub Pages is optional — it's faster (no cold starts) but requires code changes to point API calls to your Render URL.

---

## Troubleshooting

### "I can't see .env.example or .gitignore in the GitHub repo"

These files are hidden by default because they start with a dot. To see them:
- On the GitHub repo page, the files ARE there — GitHub just doesn't always show dotfiles prominently
- Check by visiting: `https://github.com/YOUR-USERNAME/REPO-NAME/blob/main/.gitignore`
- If truly missing, create them manually:
  - Click "Add file" → "Create new file"
  - Name: `.gitignore`
  - Copy content from your local `.gitignore`
  - Commit

### "GitHub web uploader skipped some files"

GitHub's web uploader has a limit of 100 files per upload and sometimes skips hidden files. If you notice missing files:
- Use the Git command line method (Option B in Step 4)
- Or upload the missing files manually one by one

### "The zip is too large to upload"

The zip is 11 MB. GitHub has a 100 MB file limit and recommends repos under 1 GB. 11 MB is fine. If you have issues:
- The large files are images in `public/` (avatar PNGs)
- You can delete `avatar-source.jpg` and `avatar-expressions.png` if you don't need them
- Or use Git LFS: https://git-lfs.com

### "Build fails on Render"

Check the build logs. Common issues:
- **Missing env var**: Add it in Render → Environment
- **`prisma generate` fails**: Ensure `DATABASE_URL` is set before build
- **`npm start` fails**: Use `node .next/standalone/server.js` instead
- **Bun not available**: Switch to `npm` commands in Build/Start

### "GitHub Pages shows 404"

1. Check the **Actions** tab — did the workflow succeed?
2. Verify Pages source is set to "GitHub Actions" (Settings → Pages)
3. Wait 5-10 minutes after first deploy (CDN propagation)
4. Ensure your repo is NOT empty and the workflow file exists at `.github/workflows/deploy-pages.yml`

### "Can't sign in to admin after deploy"

The seed script must run once after the first deploy:
1. Render → your service → **Shell** tab
2. Run: `npm run seed` (or `npx tsx scripts/seed.ts`)
3. Then sign in with `admin_user` / `admin_password@58`

### "Admin panel resets on every deploy"

You need a persistent disk:
1. Render → your service → **Settings** → **Disks**
2. Add disk: mount path `/opt/data`, size 1 GB
3. Update `DATABASE_URL` to `file:/opt/data/custom.db`
4. Re-seed the database

---

## Quick Checklist

Before you start:
- [ ] Downloaded `portfolio-source-code.zip`
- [ ] Created a GitHub repo (Private recommended)
- [ ] Extracted the zip on your computer
- [ ] Verified `.env.example` and `.gitignore` exist in the extracted folder

After upload:
- [ ] All source files are in the GitHub repo
- [ ] `.env` is NOT in the repo (only `.env.example`)
- [ ] `db/custom.db` is NOT in the repo
- [ ] `node_modules/` is NOT in the repo
- [ ] GitHub Secrets are set (SESSION_SECRET, ENCRYPTION_KEY, etc.)
- [ ] Render service is created with persistent disk
- [ ] Seed script was run once on Render
- [ ] Bootstrap password was changed after first login
- [ ] GitHub Pages is enabled (Source: GitHub Actions)

---

## Need Help?

- Full deployment guide: `download/GITHUB-DEPLOYMENT-GUIDE.md` (in the zip)
- Project README: `download/README.md` (in the zip)
- GitHub Docs: https://docs.github.com/en/repositories
- Render Docs: https://render.com/docs
