# NCP2 Deployment Guide

> **Frontend** → Vercel | **Backend** → Render | **Database** → Supabase (already hosted)

---

## Prerequisites

- GitHub repository with the NCP2 code pushed
- Accounts on [Vercel](https://vercel.com), [Render](https://render.com), and [Supabase](https://supabase.com)
- Your Supabase project is already running at `https://ldxuqxvvsspgmoogubit.supabase.co`

---

## Step 1: Deploy Backend to Render

### 1.1 Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure the service:

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| **Name**          | `ncp2-api`                     |
| **Root Directory** | `backend`                     |
| **Runtime**       | Node                           |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start`                    |
| **Instance Type** | Free (or Starter $7/mo)        |
| **Region**        | Oregon (US West) or closest    |

### 1.2 Set Environment Variables

In Render → your service → **Environment** tab, add these variables:

#### Required

| Variable                     | Value                                                    |
| ---------------------------- | -------------------------------------------------------- |
| `NODE_ENV`                   | `production`                                             |
| `PORT`                       | `10000` (Render's default port)                          |
| `NEXT_PUBLIC_SUPABASE_URL`   | `https://ldxuqxvvsspgmoogubit.supabase.co`               |
| `SUPABASE_SERVICE_ROLE_KEY`  | *(your Supabase service role key)*                       |
| `NEXTAUTH_SECRET`            | *(your JWT secret — must match frontend)*                |
| `CORS_ORIGIN`                | `https://your-app.vercel.app` *(set after frontend deploy)* |
| `FRONTEND_URL`               | `https://your-app.vercel.app` *(set after frontend deploy)* |

#### Optional (add if you use these features)

| Variable                 | Value                            |
| ------------------------ | -------------------------------- |
| `RESEND_API_KEY`         | *(your Resend API key)*          |
| `RESEND_FROM_EMAIL`      | *(your verified sender email)*   |
| `GOOGLE_AI_API_KEY`      | *(your Gemini API key)*          |
| `OPENAI_API_KEY`         | *(your OpenAI API key)*          |
| `NOVU_API_KEY`           | *(your Novu API key)*            |
| `GOOGLE_CLIENT_ID`       | *(Google OAuth client ID)*       |
| `GOOGLE_CLIENT_SECRET`   | *(Google OAuth client secret)*   |
| `LINKEDIN_CLIENT_ID`     | *(LinkedIn OAuth client ID)*     |
| `LINKEDIN_CLIENT_SECRET` | *(LinkedIn OAuth client secret)* |
| `FACEBOOK_CLIENT_ID`     | *(Facebook OAuth client ID)*     |
| `FACEBOOK_CLIENT_SECRET` | *(Facebook OAuth client secret)* |

### 1.3 Deploy

Click **Create Web Service**. Render will:
1. Clone your repo
2. Run `npm install && npm run build` in the `backend/` directory
3. Start with `node dist/server.js`

Your backend URL will be: `https://ncp2-api.onrender.com` (or similar)

### 1.4 Verify Backend

```bash
curl https://ncp2-api.onrender.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

> **Note:** Free-tier Render services spin down after 15 minutes of inactivity. The first request after idle takes ~30-60 seconds. Upgrade to Starter ($7/mo) for always-on.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:

| Setting              | Value       |
| -------------------- | ----------- |
| **Framework Preset** | Next.js     |
| **Root Directory**   | `frontend`  |
| **Build Command**    | `next build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |

### 2.2 Set Environment Variables

In the Vercel project settings → **Environment Variables**, add:

#### Required

| Variable                       | Value                                           |
| ------------------------------ | ----------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | `https://ncp2-api.onrender.com/api/v1`          |
| `NEXT_PUBLIC_SUPABASE_URL`     | `https://ldxuqxvvsspgmoogubit.supabase.co`      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| *(your Supabase anon key)*                      |
| `SUPABASE_SERVICE_ROLE_KEY`    | *(your Supabase service role key)*               |
| `NEXTAUTH_SECRET`              | *(same JWT secret as backend)*                  |
| `NEXTAUTH_URL`                 | `https://your-app.vercel.app`                   |

#### Optional

| Variable                                  | Value                        |
| ----------------------------------------- | ---------------------------- |
| `RESEND_API_KEY`                          | *(your Resend API key)*      |
| `RESEND_FROM_EMAIL`                       | *(verified sender email)*    |
| `GOOGLE_AI_API_KEY`                       | *(Gemini API key)*           |
| `OPENAI_API_KEY`                          | *(OpenAI API key)*           |
| `NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER` | *(Novu app identifier)*      |

### 2.3 Deploy

Click **Deploy**. Vercel will build and deploy your Next.js frontend automatically.

Your frontend URL will be: `https://your-app.vercel.app`

---

## Step 3: Post-Deployment Configuration

### 3.1 Update CORS on Render

Once you have your Vercel frontend URL, go back to Render and update:

- `CORS_ORIGIN` → `https://your-app.vercel.app`
- `FRONTEND_URL` → `https://your-app.vercel.app`

Render will automatically redeploy with the new values.

### 3.2 Update OAuth Redirect URIs

If using social login (Google, LinkedIn, Facebook), update the redirect URIs in each provider's console:

**Google Cloud Console:**
```
Authorized redirect URI: https://ncp2-api.onrender.com/api/v1/auth/google/callback
```

**LinkedIn Developer Portal:**
```
Authorized redirect URL: https://ncp2-api.onrender.com/api/v1/auth/linkedin/callback
```

**Facebook Developer Console:**
```
Valid OAuth Redirect URI: https://ncp2-api.onrender.com/api/v1/auth/facebook/callback
```

### 3.3 Update Supabase Settings

In your Supabase Dashboard → **Authentication** → **URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/**`

---

## Step 4: Custom Domain (Optional)

### Vercel (Frontend)
1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain (e.g., `app.yourncp.com`)
3. Update DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` to your custom domain

### Render (Backend)
1. Go to your Render service → **Settings** → **Custom Domain**
2. Add your API domain (e.g., `api.yourncp.com`)
3. Update DNS records as instructed by Render
4. Update `CORS_ORIGIN` and `FRONTEND_URL` on Render
5. Update `NEXT_PUBLIC_API_URL` on Vercel to use the new API domain

---

## Troubleshooting

### Backend won't start on Render

- Check the **Logs** tab in Render for error messages
- Ensure `PORT` is set to `10000` (Render assigns this port)
- Verify all required env vars are set (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`)

### CORS errors in browser

- Ensure `CORS_ORIGIN` on Render matches your exact Vercel URL (no trailing slash)
- Example: `https://your-app.vercel.app` not `https://your-app.vercel.app/`

### Frontend can't reach backend API

- Verify `NEXT_PUBLIC_API_URL` on Vercel points to your Render URL with `/api/v1` suffix
- Check that the Render service is running (not sleeping on free tier)
- Test the health endpoint: `https://ncp2-api.onrender.com/health`

### OAuth login not working

- Redirect URIs must match exactly (including `https://`)
- Ensure OAuth client IDs and secrets are set in Render env vars
- Check that `FRONTEND_URL` on Render points to the correct Vercel URL

### Build fails on Render

- The `tsc` build compiles TypeScript from `src/` to `dist/`
- Check for TypeScript errors locally: `cd backend && npm run build`

### Build fails on Vercel

- Run `cd frontend && npm run build` locally to check for errors
- Ensure all `NEXT_PUBLIC_*` vars are set (they're embedded at build time)

---

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│                 │ ──────────────→ │                  │
│   Vercel        │                │   Render          │
│   (Frontend)    │                │   (Backend API)   │
│                 │                │                   │
│   Next.js 16    │                │   Express.js      │
│   React 19      │                │   TypeScript      │
│                 │ ←────────────── │                   │
└────────┬────────┘     JSON       └────────┬──────────┘
         │                                  │
         │  Supabase JS                     │  Supabase JS
         │  (anon key)                      │  (service role key)
         │                                  │
         └──────────┐          ┌────────────┘
                    ▼          ▼
              ┌──────────────────────┐
              │                      │
              │   Supabase           │
              │   (PostgreSQL + Auth │
              │    + Storage)        │
              │                      │
              └──────────────────────┘
```

---

## Quick Reference

| Service  | Platform | URL Pattern                          |
| -------- | -------- | ------------------------------------ |
| Frontend | Vercel   | `https://<project>.vercel.app`       |
| Backend  | Render   | `https://<service>.onrender.com`     |
| Database | Supabase | `https://ldxuqxvvsspgmoogubit.supabase.co` |
| Health   | Render   | `https://<service>.onrender.com/health` |
