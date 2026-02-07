# 🚀 Deployment Guide

Complete guide for deploying NuestrosGastos to production.

---

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (free tier OK)
- [ ] Supabase project created
- [ ] Telegram bot created via @BotFather
- [ ] All migrations applied to Supabase

---

## Part 1: Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Select region (closest to your users)
5. Generate strong password
6. Wait for project to finish provisioning (~2 minutes)

### 2. Apply Migrations

**Via Dashboard:**
1. Go to SQL Editor in your Supabase dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. Repeat for `002_rls_policies.sql`

### 3. Get API Credentials

Go to **Settings → API** and copy:
- **Project URL**
- **anon public** key
- **service_role** secret key (for the bot only!)

---

## Part 2: Web App Deployment (Vercel)

### 1. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New → Project"
3. Select your GitHub repository
4. **CRITICAL:** Set Root Directory to `apps/web`
5. Framework Preset: Next.js (auto-detected)

### 2. Configure Environment Variables

In Vercel dashboard, add these in Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBot_bot
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 3. Deploy and Configure Bot Domain

After deployment:
1. Get your Vercel URL (e.g., `nuestros-gastos.vercel.app`)
2. Go to @BotFather on Telegram
3. Send `/setdomain` → select your bot → send your Vercel domain

---

## Part 3: Bot Deployment (Railway)

1. Go to [railway.app](https://railway.app)
2. "New Project → Deploy from GitHub"
3. Root Directory: `apps/bot`
4. Add environment variables:
   ```
   TELEGRAM_BOT_TOKEN=your_token
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```
5. Start Command: `python main.py`

---

## Verification

1. Visit your Vercel URL → Click Telegram login → Authorize
2. Open bot in Telegram → `/start`
3. Add expense via bot → Check web dashboard

**Deployment complete! 🎉**
