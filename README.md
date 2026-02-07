# 💰 NuestrosGastos

**Shared expense tracker with Telegram integration**

Track household expenses effortlessly through a beautiful web dashboard and a powerful Telegram bot. Split costs fairly, visualize spending patterns, and stay on budget — all in one place.

---

## ✨ Features

### 📱 Web Dashboard
- **Real-time expense tracking** with category breakdown
- **Multi-household support** — manage multiple homes or temporary groups
- **Smart debt calculation** — automatic fair-split computation
- **Interactive analytics** — visualize spending by category and time
- **Budget management** — set monthly limits and track progress
- **Responsive design** — beautiful UI optimized for mobile and desktop

### 🤖 Telegram Bot
- **/gasto** — Add expenses on the go with guided conversation
- **/balance** — Check current balance and who owes what
- **/espacio** — Switch between households
- **/resumen** — Get monthly summary and statistics
- **Telegram Login** — Secure authentication via Telegram

### 🔐 Security
- **Row Level Security (RLS)** — Database-level access control
- **Server-side auth verification** — HMAC-SHA256 validation of Telegram logins
- **Environment-based secrets** — No hardcoded credentials
- **Anon key for public access** — Supabase RLS handles authorization

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Data visualization
- **Lucide React** — Icon library

### Backend
- **Supabase** — PostgreSQL database with PostgREST API
- **Row Level Security** — Multi-tenant data isolation
- **Typed client** — Full TypeScript support for database operations

### Bot
- **Python 3.11+** — Bot runtime
- **python-telegram-bot** — Official Telegram Bot API wrapper
- **Supabase Python SDK** — Database integration

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **Supabase account** (free tier works)
- **Telegram Bot** (create via @BotFather)

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/nuestros-gastos.git
cd nuestros-gastos

# Install web dependencies
cd apps/web
npm install

# Install bot dependencies
cd ../bot
pip install -r requirements.txt
```

### 2. Configure Environment Variables

#### Web App (`apps/web/.env`)
```bash
cp apps/web/.env.example apps/web/.env
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBot_bot
TELEGRAM_BOT_TOKEN=123456:ABC-your-bot-token
```

#### Bot (`apps/bot/.env`)
```bash
cp apps/bot/.env.example apps/bot/.env
```

Fill in:
```env
TELEGRAM_BOT_TOKEN=123456:ABC-your-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

⚠️ **Note:** Bot uses `service_role` key to bypass RLS (it's trusted). Web uses `anon` key (RLS enforced).

### 3. Set Up Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations:
   ```bash
   # Option 1: Via Supabase Dashboard
   # Go to SQL Editor → paste contents of supabase/migrations/001_initial_schema.sql → Run
   # Then paste 002_rls_policies.sql → Run
   
   # Option 2: Via Supabase CLI (if installed)
   cd supabase
   supabase db push
   ```

3. (Optional) Seed test data:
   ```bash
   # In Supabase SQL Editor, run supabase/seed.sql
   ```

### 4. Configure Telegram Bot

1. Create bot via [@BotFather](https://t.me/BotFather):
   ```
   /newbot
   → Choose name: "NuestrosGastos"
   → Choose username: "YourUniqueBot_bot"
   ```

2. Set domain for login widget:
   ```
   /setdomain
   → Select your bot
   → Send: localhost (for dev) or yourdomain.com (for prod)
   ```

### 5. Run Locally

```bash
# Terminal 1 - Web app
cd apps/web
npm run dev
# → http://localhost:3000

# Terminal 2 - Telegram bot
cd apps/bot
python main.py
# → Bot starts polling
```

### 6. First Login

1. Open `http://localhost:3000`
2. Click "Login with Telegram"
3. Authorize in Telegram
4. Redirected to dashboard 🎉

---

## 📦 Project Structure

```
nuestros-gastos/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page with Telegram login
│   │   │   ├── dashboard/      # Main app pages
│   │   │   └── api/            # API routes (auth verification)
│   │   ├── components/         # React components
│   │   ├── lib/
│   │   │   ├── supabase.ts     # Typed Supabase client
│   │   │   ├── queries.ts      # Database queries
│   │   │   ├── database.types.ts # Generated types
│   │   │   └── utils.ts        # Helpers
│   │   └── .env                # Environment variables (gitignored)
│   │
│   └── bot/                    # Python Telegram bot
│       ├── handlers/           # Command handlers
│       ├── utils/              # Supabase client
│       ├── main.py             # Entry point
│       └── .env                # Environment variables (gitignored)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Tables, indexes, triggers
│   │   └── 002_rls_policies.sql     # Row Level Security
│   └── seed.sql                     # Test data
│
└── README.md
```

---

## 🗄️ Database Schema

### Core Tables

**users**
- `id` (BIGINT, PK)
- `telegram_id` (BIGINT, UNIQUE) — Telegram user ID
- `name` (TEXT) — Display name
- `active_household_id` (BIGINT, FK) — Current household

**households**
- `id` (BIGINT, PK)
- `name` (TEXT) — Household name
- `type` (ENUM: permanent | temporary)
- `monthly_budget` (NUMERIC) — Budget limit
- `created_by` (BIGINT, FK → users)

**household_members**
- `household_id` (BIGINT, FK)
- `user_id` (BIGINT, FK)
- `role` (TEXT) — admin | member
- `is_active` (BOOLEAN)

**expenses**
- `id` (BIGINT, PK)
- `household_id` (BIGINT, FK)
- `paid_by` (BIGINT, FK → users)
- `amount` (NUMERIC)
- `category` (TEXT) — Supermercado, Transporte, etc.
- `type` (ENUM: fixed | variable)
- `shared_with` (BIGINT[]) — Array of user IDs
- `expense_date` (DATE)

**recurring_expenses** — Auto-recurring bills
**automation_rules** — Email parsing, auto-categorization

---

## 🔐 Security & RLS

All database queries from the web app are protected by **Row Level Security**:

```sql
-- Users can only see households they're members of
CREATE POLICY "Users see own households"
  ON households FOR SELECT
  USING (id IN (SELECT household_id FROM household_members WHERE user_id = app.telegram_id));

-- Users can only insert expenses to their own households
CREATE POLICY "Users insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (household_id IN (...));
```

The bot uses the `service_role` key and bypasses RLS (it's a trusted service).

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/nuestros-gastos.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project
   - Import your GitHub repo
   - **Root Directory:** `apps/web`
   - Framework: Next.js (auto-detected)

3. **Environment Variables**
   Add in Vercel dashboard (Settings → Environment Variables):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
   TELEGRAM_BOT_TOKEN (mark as sensitive)
   ```

4. **Deploy** → Get URL like `https://your-app.vercel.app`

5. **Update Bot Domain**
   ```
   @BotFather → /setdomain → your-app.vercel.app
   ```

### Run Bot in Production

**Option 1: Railway / Render / Fly.io**
- Deploy `apps/bot` as a Python service
- Set environment variables
- Start command: `python main.py`

**Option 2: VPS / EC2**
```bash
# Install dependencies
pip install -r requirements.txt

# Run with systemd or supervisor
python main.py
```

**Option 3: Docker**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY apps/bot/ .
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
```

---

## 🛠️ Development

### Run Type Checking
```bash
cd apps/web
npx tsc --noEmit
```

### Generate Supabase Types
```bash
# Requires SUPABASE_ACCESS_TOKEN env var
npx supabase gen types --project-id YOUR_PROJECT_ID > apps/web/lib/database.types.ts
```

### Linting
```bash
npm run lint
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- **Supabase** — Amazing backend platform
- **Telegram** — Powerful bot API
- **Next.js** — Best React framework
- **python-telegram-bot** — Excellent library

---

## 📮 Contact

For questions or support, open an issue on GitHub.

**Built with ❤️ by the NuestrosGastos team**
