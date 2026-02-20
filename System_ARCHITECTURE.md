# NCPnext System Architecture

**Nurse Care Pro** — Nurse Registration & Staffing Platform

---

## 1. Overview

NCPnext is a full-stack nurse registration and staffing platform. Nurses register, upload resumes, and get matched to job opportunities. Admins manage job listings and review applications.

**Stack:** Next.js 16 frontend + Express.js backend + Supabase PostgreSQL

```
┌──────────────────┐         ┌─────────────────────────────────────┐
│   Next.js        │         │       Express API Server            │
│   Frontend       │  HTTP   │       http://localhost:4000          │
│   :3000          │────────►│                                     │
│                  │  JWT    │  Middleware → Routes → Controller   │
│  (+ Mobile,     │◄────────│  → Service → Repository             │
│   third-party)   │         │                                     │
└──────────────────┘         └──────────────┬──────────────────────┘
                                            │
                             ┌──────────────▼──────────────────────┐
                             │  Supabase PostgreSQL + Storage      │
                             │  12 tables, RLS enabled             │
                             └─────────────────────────────────────┘
```

**External Services:**
- **Resend** — Transactional emails (verification, password reset)
- **Novu** — In-app notification center with real-time updates
- **Google Generative AI (Gemini)** — Resume parsing fallback
- **OpenAI** — AI-powered job matching with embeddings
- **OAuth Providers** — Google, LinkedIn, Facebook SSO

---

## 2. Project Structure

```
NCP2/
├── frontend/                         # Next.js 16 (App Router, React 19)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, register, password reset, verify-email
│   │   │   ├── (nurse)/              # Dashboard, jobs, profile, settings, notifications
│   │   │   ├── (admin)/              # Admin dashboard, job/nurse management, notifications
│   │   │   ├── sso/callback/         # OAuth callback handler
│   │   │   └── page.tsx              # Landing page
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI primitives (button, card, dialog, etc.)
│   │   │   ├── jobs/                 # JobDetailPanel, JobSidebar, MatchScoreCircle
│   │   │   ├── profile/modals/       # Profile section edit modals
│   │   │   ├── shared/               # Navbar, Footer, NotificationBell, NotificationInbox
│   │   │   └── sso/                  # SSOButtons (Google, LinkedIn, Facebook)
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Fetch wrapper with token refresh
│   │   │   ├── auth-context.tsx      # AuthProvider (JWT-based)
│   │   │   ├── onboarding-tour.ts    # Driver.js powered first-login tour
│   │   │   └── validators.ts         # Zod schemas
│   │   └── types/
│   └── supabase/migrations/          # Database migration SQL files (001-011)
│
├── backend/                          # Express.js + TypeScript
│   ├── src/
│   │   ├── app.ts                    # Express app setup
│   │   ├── server.ts                 # Entry point
│   │   ├── config/
│   │   │   ├── env.ts                # Env var validation
│   │   │   └── passport.ts           # OAuth strategies (Google, Facebook, LinkedIn)
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification → req.user
│   │   │   ├── roles.ts              # requireRole() factory
│   │   │   ├── validate.ts           # Zod schema validation
│   │   │   ├── error-handler.ts      # Global error → JSON
│   │   │   ├── rate-limit.ts         # Per-endpoint rate limiting
│   │   │   └── pagination.ts         # ?page=&limit= → req.pagination
│   │   ├── modules/
│   │   │   ├── auth/                 # Register, login, password reset, email verification, SSO
│   │   │   ├── nurses/               # Profiles, experience, education, skills, certs
│   │   │   ├── jobs/                 # CRUD + matching (rule-based + AI)
│   │   │   ├── resumes/              # Upload, parse, download
│   │   │   └── applications/         # Apply, list, status updates
│   │   └── shared/
│   │       ├── errors.ts             # AppError class hierarchy
│   │       ├── helpers.ts            # getNurseId, recalculateYearsOfExperience
│   │       ├── validators.ts         # Zod schemas
│   │       ├── job-matcher.ts        # Rule-based matching algorithm
│   │       ├── ai-job-matcher.ts     # OpenAI embeddings-based semantic matching
│   │       ├── openai-client.ts      # Embedding generation with DB caching
│   │       ├── data-extractor.ts     # Regex-based resume data extraction
│   │       ├── ai-resume-parser.ts   # Gemini AI fallback
│   │       ├── security.ts           # Account lockout, token generation
│   │       ├── email-templates.ts    # HTML/text email templates
│   │       ├── resend.ts             # Email service wrapper
│   │       └── novu.ts               # Notification service wrapper
│   └── package.json
│
└── System_ARCHITECTURE.md
```

---

## 3. Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22.x | Runtime |
| Express.js | 4.21 | HTTP server & routing |
| TypeScript | 5.7 | Type safety |
| Supabase (PostgreSQL) | 2.94 | Database + file storage |
| jsonwebtoken | 9.0 | JWT access & refresh tokens |
| bcryptjs | 3.0 | Password hashing (12 rounds) |
| Zod | 3.24 | Validation |
| Multer | 1.4 | File uploads |
| Helmet | 8.1 | Security headers |
| Passport.js | 0.7 | OAuth authentication (Google, Facebook, LinkedIn) |
| OpenAI | 6.21 | AI embeddings for job matching |
| Google Generative AI | 0.24 | AI resume parsing |
| Novu | 2.6 | Notification service |
| Resend | 6.9 | Transactional emails |
| pdf-parse / mammoth / word-extractor | — | Resume text extraction |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | Framework (App Router, SSR) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| React Hook Form | 7.71 | Form management |
| Zod | 4.3 | Validation |
| Sonner | 2.0 | Toast notifications |
| Lucide React | 0.563 | Icons |
| Novu Next.js | 3.14 | In-app notification inbox |
| Driver.js | 1.4 | Onboarding tour |
| Google Generative AI | 0.24 | Client-side AI features |

---

## 4. Design Patterns

### Layered Architecture (per module)

```
Routes → Controller → Service → Repository → Database
```

| Layer | Responsibility |
|-------|---------------|
| **Routes** | HTTP method + path, middleware attachment |
| **Controller** | Parse request, call service, format response |
| **Service** | Business logic, orchestration, error throwing |
| **Repository** | Database queries only |

### Error Handling

All errors extend `AppError` and are caught by a global error handler:

```
AppError (base)
├── BadRequestError      (400)
├── UnauthorizedError     (401)
├── ForbiddenError        (403)
├── NotFoundError         (404)
├── ConflictError         (409)
├── ValidationError       (400 + field details)
└── TooManyRequestsError  (429 + retryAfter)
```

Error response format:
```json
{ "error": "Message", "code": "MACHINE_CODE", "details": {} }
```

### Response Envelope

Single item: `{ "data": { ... } }`

Paginated list: `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`

---

## 5. API Reference

All routes are under `/api/v1/`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Create account + nurse profile, sends verification email |
| POST | `/auth/login` | None | Email/password login (rate limited: 10/15min) |
| POST | `/auth/check-email` | None | Check if email exists and if it uses SSO |
| POST | `/auth/verify-email` | None | Verify email with token |
| POST | `/auth/resend-verification` | None | Resend verification email |
| POST | `/auth/refresh` | None | Refresh token → new access token |
| POST | `/auth/forgot-password` | None | Send reset email (3/15min) |
| POST | `/auth/reset-password` | None | Reset password with token (5/15min) |
| POST | `/auth/change-password` | Bearer | Change password (5/15min) |
| GET | `/auth/sso/:provider` | None | Initiate OAuth flow (google, facebook, linkedin) |
| GET | `/auth/sso/:provider/callback` | None | OAuth callback handler |

### Nurses

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/nurses` | Admin | List all nurses (paginated) |
| GET | `/nurses/me` | Any | Get own full profile |
| GET | `/nurses/:id` | Owner/Admin | Get nurse by ID |
| PUT | `/nurses/:id` | Owner/Admin | Update profile |
| POST | `/nurses/me/profile-picture` | Any | Upload profile picture |
| DELETE | `/nurses/me/profile-picture` | Any | Remove profile picture |
| POST/PUT/DELETE | `/nurses/me/experience[/:itemId]` | Any | Manage work experience |
| POST/PUT/DELETE | `/nurses/me/education[/:itemId]` | Any | Manage education |
| POST/PUT/DELETE | `/nurses/me/skills[/:itemId]` | Any | Manage skills |
| POST/PUT/DELETE | `/nurses/me/certifications[/:itemId]` | Any | Manage certifications |

### Jobs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/jobs` | Any | List active jobs (paginated, filterable by `location`, `employment_type`) |
| GET | `/jobs/:id` | Any | Get job details |
| POST | `/jobs` | Admin | Create job |
| PUT | `/jobs/:id` | Admin | Update job |
| DELETE | `/jobs/:id` | Admin | Soft-delete (deactivate) job |
| GET | `/jobs/matches` | Nurse | Get AI-powered job matches for current user |

### Resumes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/resumes/upload` | Any | Upload & parse resume (max 10MB) |
| GET | `/resumes/:id` | Owner/Admin | Get signed download URL (1hr expiry) |
| DELETE | `/resumes/:id` | Owner | Delete resume |

### Applications

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/applications/me` | Nurse | List own applications |
| GET | `/applications` | Admin | List all applications |
| GET | `/applications/:id` | Owner/Admin | Get application detail |
| POST | `/applications/jobs/:jobId/apply` | Nurse | Apply to a job |
| PUT | `/applications/:id/status` | Admin | Update status (`pending` → `reviewed` → `accepted`/`rejected`) |

---

## 6. Authentication & Authorization

### JWT Strategy

| Token | Lifespan | Payload | Purpose |
|-------|----------|---------|---------|
| Access | 24h | `{ id, email, role }` | Sent as `Bearer` header |
| Refresh | 7d | `{ id }` | Used to obtain new access tokens |

### Single Sign-On (SSO)

Users can authenticate via OAuth providers:

| Provider | Flow | Notes |
|----------|------|-------|
| Google | Passport.js OAuth 2.0 | Standard flow |
| Facebook | Passport.js OAuth 2.0 | Standard flow |
| LinkedIn | Manual OpenID Connect | Custom implementation (passport strategy outdated) |

**SSO Flow:**
1. User clicks SSO button → redirects to `/api/v1/auth/sso/:provider`
2. Backend redirects to OAuth provider consent screen
3. Provider redirects back with authorization code
4. Backend exchanges code for access token, fetches profile
5. Backend creates/links user account, generates JWT pair
6. Backend redirects to `/sso/callback?accessToken=...&refreshToken=...&isNewUser=...`
7. Frontend stores tokens and redirects to dashboard or profile (for new users)

**Account Linking:**
- If email already exists, SSO provider is linked to existing account
- SSO-only users have `password_hash = NULL`
- Users can link multiple SSO providers to one account

### Security Features

- **Password hashing:** bcrypt, 12 salt rounds
- **Account lockout:** 5 failed attempts → 30-minute lockout
- **Password strength:** Min 8 chars, uppercase, lowercase, digit, special char
- **Email verification:** Required for manual sign-ups (24hr token expiry)
- **Rate limiting:** Per-endpoint, IP-based
- **Email enumeration prevention:** Forgot-password and resend-verification always return success
- **HTTP headers:** Helmet (X-Frame-Options, CSP, HSTS, etc.)
- **CORS:** Restricted to configured origin
- **First login detection:** `last_login_at` field tracks new vs. returning users

### Roles

| Role | Access |
|------|--------|
| **nurse** | Own profile, jobs list, job matches, own applications, resume upload |
| **admin** | All nurse profiles, job CRUD, all applications, status updates |

---

## 7. Middleware Pipeline

```
Request
  → helmet (security headers)
  → cors
  → express.json / urlencoded
  → [per-route] authenticate → requireRole → validate → paginate → rateLimit → multer
  → Controller
  → errorHandler (catches thrown errors → JSON)
```

---

## 8. Database Schema

**12 tables**, all with Row-Level Security enabled.

```
users ──────────── nurse_profiles
 (id, email,         (user_id FK, first_name, last_name,
  password_hash,      phone, address, years_of_exp,
  role,               profile_picture, professional_status,
  email_verified,     location_type, country)
  last_login_at)         │
                          │
          ┌───────────────┼───────────────────┐
          │               │                   │
  nurse_experience   nurse_education   nurse_certifications
   (employer,         (institution,     (cert_type,
    position,          degree,           cert_number,
    type, dates,       field_of_study,   score, dates,
    department,        graduation_year,  verified)
    location)          status)
                                          nurse_skills
                                           (skill_name,
                                            proficiency)

  resumes                 jobs                job_applications
   (nurse_id,              (title,             (job_id FK,
    file_path,              description,        nurse_user_id FK,
    original_filename,      location,           status enum,
    extracted_text,         facility_name,      applied_at)
    parsed_data JSON)       employment_type,   UNIQUE(nurse_user_id, job_id)
                            salary_range,
                            required_certs,    password_reset_tokens
                            required_skills,    (user_id FK, token,
                            is_active)          expires_at, used)

                         user_sso_providers
                          (user_id FK,
                           provider,           email_verification_tokens
                           provider_user_id,    (user_id FK, token,
                           provider_email,      expires_at, used)
                           provider_data JSONB)

                         embedding_cache
                          (text_content UNIQUE,
                           embedding vector,
                           created_at)
```

---

## 9. Business Logic

### Job Matching Algorithm

#### Rule-Based (`shared/job-matcher.ts`)

Scores nurses against jobs on three weighted criteria:

| Criteria | Weight | Method |
|----------|--------|--------|
| Experience | 30% | Full points if nurse meets min years; 50% for partial |
| Certifications | 40% | % of required certs matched (fuzzy substring) |
| Skills | 30% | % of required skills matched (fuzzy substring) |

- Non-nursing profiles with no cert matches: capped at 5%
- Results sorted by score descending (0–100)

#### AI-Powered (`shared/ai-job-matcher.ts`)

Uses OpenAI embeddings for semantic similarity matching:

| Criteria | Weight | Method |
|----------|--------|--------|
| Experience | 25% | Rule-based (same as above) |
| Certifications | 30% | Semantic similarity via embeddings |
| Skills | 25% | Semantic similarity + proficiency bonus |
| Description | 20% | Profile-to-job-description semantic match |

**Features:**
- Embeddings cached in `embedding_cache` table (cost optimization)
- Proficiency multiplier: Basic (1.0), Intermediate (1.1), Advanced (1.2)
- Similarity threshold: 0.5 for semantic matches
- Falls back to rule-based if OpenAI unavailable

### Resume Processing Pipeline

```
Upload (multipart) → Store in Supabase Storage
  → Extract text (pdf-parse / mammoth / word-extractor)
  → Parse structured data (regex-based, ~1400 lines)
  → Fallback to Gemini AI if confidence < 40%
  → Replace existing resume → Populate profile tables
```

### Auto-calculated Experience

Adding/updating/deleting experience entries triggers `recalculateYearsOfExperience()` which sums all entry durations and updates `nurse_profiles.years_of_experience`.

### Email Verification Flow

```
Register → Create user (email_verified=false)
  → Generate verification token (24hr expiry)
  → Send email via Resend
  → User clicks link → Verify token → Set email_verified=true
  → User can now log in
```

**SSO Users:** Automatically verified (`email_verified=true` on creation)

---

## 10. Frontend Architecture

### Auth Flow

1. User logs in → backend returns JWT pair
2. Tokens stored in localStorage + cookie
3. `AuthProvider` decodes JWT for user info, fetches full profile
4. All API calls attach access token via `api-client.ts`
5. On 401 → automatic token refresh and retry

### SSO Flow

1. User clicks SSO button → redirected to OAuth provider
2. After authorization → redirected to `/sso/callback` with tokens
3. Tokens stored, user redirected to dashboard (existing) or profile with tour (new)

### Onboarding Tour

- Powered by Driver.js
- Triggered on first login (`last_login_at` is null)
- Highlights: Resume upload → Profile edit → Job matches
- Dismissed state stored in localStorage

### Notification System

- Novu integration for real-time in-app notifications
- `NotificationBell` component in navbar shows unread count
- Dedicated notification pages for nurse and admin roles

### Key Data Flows

**Registration:** Basic Info → Email Verification → Profile Setup → Dashboard

**Job Application:** View job → Apply (`POST /applications/jobs/:jobId/apply`) → Confirmation

**Profile Update:** Edit form → Zod validation → `PUT /nurses/:id` → Toast → Refetch

### Routes

| Group | Routes |
|-------|--------|
| Public | `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` |
| SSO | `/sso/callback` |
| Nurse | `/dashboard`, `/jobs`, `/jobs/[id]`, `/profile`, `/settings`, `/notifications` |
| Admin | `/admin`, `/admin/jobs`, `/admin/nurses`, `/admin/nurses/[id]`, `/admin/nurses/[id]/matches`, `/admin/notifications` |

---

## 11. Environment Variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key |
| `NEXTAUTH_SECRET` | Yes | — | JWT signing secret |
| `JWT_ACCESS_EXPIRY` | No | `24h` | Access token lifespan |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token lifespan |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for redirects |
| `RESEND_API_KEY` | No | — | Email service |
| `RESEND_FROM_EMAIL` | No | `onboarding@resend.dev` | Sender email |
| `GOOGLE_AI_API_KEY` | No | — | Gemini AI for resume parsing |
| `OPENAI_API_KEY` | No | — | OpenAI for job matching |
| `NOVU_API_KEY` | No | — | Push notifications |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth |
| `LINKEDIN_CLIENT_ID` | No | — | LinkedIn OAuth |
| `LINKEDIN_CLIENT_SECRET` | No | — | LinkedIn OAuth |
| `FACEBOOK_CLIENT_ID` | No | — | Facebook OAuth |
| `FACEBOOK_CLIENT_SECRET` | No | — | Facebook OAuth |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (`http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (shared with backend) |
| `NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER` | No | Novu app ID for notifications |
| `NEXT_PUBLIC_NOVU_BACKEND_URL` | No | Novu backend URL (self-hosted) |
| `NEXT_PUBLIC_NOVU_SOCKET_URL` | No | Novu socket URL (self-hosted) |

---

## 12. Setup & Running

```bash
# Backend
cd backend && npm install
# Create .env (see section 11)
npm run dev          # Dev with hot reload on :4000
npm run build        # Production build
npm start            # Production start

# Frontend
cd frontend && npm install
# Create .env.local (see section 11)
npm run dev          # Dev with Turbopack on :3000
npm run build        # Production build
npm start            # Production start

# Verify
curl http://localhost:4000/health
curl http://localhost:3000
```

---

## 13. Database Migrations

Migrations are stored in `frontend/supabase/migrations/`:

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables (users, profiles, jobs, etc.) |
| `002_seed_jobs.sql` | Initial job listings |
| `003_add_education_details.sql` | Education enhancements |
| `003_password_reset_tokens.sql` | Password reset functionality |
| `003_registration_update.sql` | Registration flow updates |
| `004_add_profile_picture.sql` | Profile picture storage |
| `005_add_job_applications.sql` | Job application system |
| `006_seed_more_jobs.sql` | Additional job listings |
| `007_add_experience_type.sql` | Experience type field |
| `008_add_embedding_cache.sql` | AI embedding cache |
| `009_sso_providers.sql` | SSO provider links table |
| `010_email_verification.sql` | Email verification system |
| `011_last_login_at.sql` | First login tracking |

---

## 14. Recent Updates

### Added Features

1. **Single Sign-On (SSO)**
   - Google, LinkedIn, Facebook authentication
   - Account linking for existing users
   - SSO-only accounts (no password required)

2. **Email Verification**
   - Required for manual sign-ups
   - 24-hour token expiry
   - Resend verification option

3. **AI-Powered Job Matching**
   - OpenAI embeddings for semantic similarity
   - Embedding cache for cost optimization
   - Proficiency-based skill matching

4. **Onboarding Tour**
   - Driver.js powered first-login experience
   - Highlights key features
   - Dismissible with localStorage persistence

5. **Notification System**
   - Novu integration for real-time notifications
   - In-app notification bell
   - Dedicated notification pages

6. **First Login Detection**
   - `last_login_at` field tracks new users
   - Triggers onboarding tour for new accounts
