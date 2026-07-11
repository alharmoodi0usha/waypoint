# Waypoint 🧭

**The study-abroad platform for the part *after* you get in** — landing plans, visa checklists, an AI Guidance Buddy that knows your journey, student tips, a give-to-get note exchange, and student-run activities.

Built with React + Vite + Supabase. Deploys free on Vercel.

---

## What you need before starting

- A free [Supabase](https://supabase.com) account (this is your database + user accounts)
- A free [Vercel](https://vercel.com) account (this hosts the website)
- A free [GitHub](https://github.com) account (Vercel deploys from here)
- [Node.js](https://nodejs.org) installed on your computer (LTS version)
- Optional, for the AI Buddy: an [Anthropic API key](https://console.anthropic.com) (paid per usage, a few dollars goes far)

Total cost to launch: **$0** (Buddy costs a little only when people use it).

---

## Step 1 — Create your Supabase project (~10 min)

1. Go to [supabase.com](https://supabase.com) → **New project**. Name it `waypoint`, pick a strong database password, choose a region close to your users (e.g. `eu-central` works well for the UAE).
2. When it finishes setting up, open **SQL Editor** → **New query**.
3. Copy the entire contents of `supabase/schema.sql` from this project, paste it in, and click **Run**. This creates all the tables (profiles, tips, notes, activities, messages, friends, reports) with security rules so users can only edit their own data and only read their own DMs.
4. Go to **Settings → API** and copy two values:
   - **Project URL** (looks like `https://abcdefg.supabase.co`)
   - **anon public** key

## Step 2 — Run it on your computer (~5 min)

```bash
# in the project folder
cp .env.example .env
# open .env and paste in your Project URL and anon key

npm install
npm run dev
```

Open the printed localhost URL. Create an account (check your email for the confirmation link), set up your profile, and click around. Everything except the Buddy works at this point.

## Step 3 — Turn on the AI Buddy (~10 min, optional but worth it)

The Buddy needs your Anthropic API key kept **on the server** — never in frontend code, or anyone could steal it and run up your bill.

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF   # ref is in your project's URL
   ```
3. Set your secret key and deploy the function:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
   supabase functions deploy buddy
   ```

That's it — the Buddy tab now works, personalised with each user's profile and landing-plan progress.

## Step 4 — Put it on the internet (~10 min)

1. Push this folder to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Waypoint v1"
   # create an empty repo on github.com, then:
   git remote add origin https://github.com/YOUR-USERNAME/waypoint.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com): **Add New → Project** → import your `waypoint` repo. Vercel auto-detects Vite.
3. Before deploying, add two **Environment Variables** (same values as your `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. In ~1 minute you'll have a live URL like `waypoint-yourname.vercel.app`.
5. In Supabase → **Authentication → URL Configuration**, set your Vercel URL as the **Site URL** so email confirmation links point to the live site.

Optional: buy a domain (~$10/year on Namecheap) and add it in Vercel → Domains.

## Step 5 — Before you share it widely

- **Write a short privacy policy & community rules page.** You're storing emails, profiles, and messages of (mostly under-18) students — say what you collect and how people can get their data deleted. Take this seriously; it's also required later for the App Store.
- **Moderation:** the schema includes a `reports` table and users can report from DMs. Check it weekly in Supabase → Table Editor, and delete abusive content/users from the dashboard.
- **Note exchange & copyright:** the upload form already tells students to only share notes they wrote themselves. Enforce this when reports come in.
- **The visa checklists are indicative** — keep the in-app disclaimer, and update the checklists each year.

## Costs as you grow

| Users | Supabase | Vercel | Buddy (Anthropic) |
|---|---|---|---|
| 0–hundreds | Free tier | Free tier | ~$5–20/mo depending on chat volume |
| Thousands | ~$25/mo | Free/`~$20/mo` | Scales with usage — add a per-user daily message cap |

## Project structure

```
waypoint-web/
├── index.html
├── package.json
├── vite.config.js
├── .env.example              ← copy to .env with your keys
├── supabase/
│   ├── schema.sql            ← run once in Supabase SQL Editor
│   └── functions/buddy/      ← Edge Function that keeps your AI key secret
└── src/
    ├── main.jsx              ← session handling (signed out → Auth, in → App)
    ├── Auth.jsx              ← sign in / sign up screen
    ├── App.jsx               ← the whole Waypoint UI
    └── lib/
        ├── supabase.js       ← client setup
        └── api.js            ← all database reads/writes in one place
```

## Later: the App Store

When you're ready (and have real web users), wrap this same codebase with [Capacitor](https://capacitorjs.com) for iOS/Android. You'll need the Apple Developer Program ($99/yr, 18+ — a parent can hold the account) and a Mac with Xcode. The reports table, account system, and privacy policy you set up above are exactly what App Review will ask for.
