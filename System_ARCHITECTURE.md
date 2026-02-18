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
                             │  9 tables, RLS enabled              │
                             └─────────────────────────────────────┘
```

**External Services:**
- **Resend** — Transactional emails
- **Novu** — Push notifications
- **Google Generative AI (Gemini)** — Resume parsing fallback

---

## 2. Project Structure

```
NCP2/
├── frontend/                         # Next.js 16 (App Router, React 19)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, register, password reset
│   │   │   ├── (nurse)/              # Dashboard, jobs, profile, settings
│   │   │   ├── (admin)/              # Admin dashboard, job/nurse management
│   │   │   └── page.tsx              # Landing page
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI primitives (button, card, dialog, etc.)
│   │   │   ├── jobs/                 # JobDetailPanel, JobSidebar, MatchScoreCircle
│   │   │   ├── profile/modals/       # Profile section edit modals
│   │   │   ├── registration/         # Multi-step registration wizard
│   │   │   └── shared/               # Navbar, Footer, NotificationBell
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Fetch wrapper with token refresh
│   │   │   ├── auth-context.tsx      # AuthProvider (JWT-based)
│   │   │   └── validators.ts         # Zod schemas
│   │   └── types/
│   └── supabase/migrations/          # Database migration SQL files
│
├── backend/                          # Express.js + TypeScript
│   ├── src/
│   │   ├── app.ts                    # Express app setup
│   │   ├── server.ts                 # Entry point
│   │   ├── config/env.ts             # Env var validation
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification → req.user
│   │   │   ├── roles.ts              # requireRole() factory
│   │   │   ├── validate.ts           # Zod schema validation
│   │   │   ├── error-handler.ts      # Global error → JSON
│   │   │   ├── rate-limit.ts         # Per-endpoint rate limiting
│   │   │   └── pagination.ts         # ?page=&limit= → req.pagination
│   │   ├── modules/
│   │   │   ├── auth/                 # Register, login, password reset
│   │   │   ├── nurses/               # Profiles, experience, education, skills, certs
│   │   │   ├── jobs/                 # CRUD + matching
│   │   │   ├── resumes/              # Upload, parse, download
│   │   │   └── applications/         # Apply, list, status updates
│   │   └── shared/
│   │       ├── errors.ts             # AppError class hierarchy
│   │       ├── helpers.ts            # getNurseId, recalculateYearsOfExperience
│   │       ├── validators.ts         # Zod schemas
│   │       ├── job-matcher.ts        # Rule-based matching algorithm
│   │       ├── resume-parser.ts      # PDF/Word text extraction
│   │       ├── data-extractor.ts     # Regex-based resume data extraction
│   │       └── ai-resume-parser.ts   # Gemini AI fallback
│   └── package.json
│
└── BACKEND_ARCHITECTURE.md
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
| pdf-parse / mammoth / word-extractor | — | Resume text extraction |
| Google Generative AI | 0.24 | AI resume parsing |

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
| POST | `/auth/register` | None | Create account + nurse profile, returns JWT pair |
| POST | `/auth/login` | None | Email/password login (rate limited: 10/15min) |
| POST | `/auth/refresh` | None | Refresh token → new access token |
| POST | `/auth/forgot-password` | None | Send reset email (3/15min) |
| POST | `/auth/reset-password` | None | Reset password with token (5/15min) |
| POST | `/auth/change-password` | Bearer | Change password (5/15min) |

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
| GET | `/jobs/matches` | Nurse | Get job matches for current user |

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

### Security Features

- **Password hashing:** bcrypt, 12 salt rounds
- **Account lockout:** 5 failed attempts → 30-minute lockout
- **Password strength:** Min 8 chars, uppercase, lowercase, digit, special char
- **Rate limiting:** Per-endpoint, IP-based
- **Email enumeration prevention:** Forgot-password always returns success
- **HTTP headers:** Helmet (X-Frame-Options, CSP, HSTS, etc.)
- **CORS:** Restricted to configured origin

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

**9 tables**, all with Row-Level Security enabled.

```
users ──────────── nurse_profiles
 (id, email,         (user_id FK, first_name, last_name,
  password_hash,      phone, address, years_of_exp,
  role, created_at)   profile_picture, professional_status)
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
```

---

## 9. Business Logic

### Job Matching Algorithm (`shared/job-matcher.ts`)

Scores nurses against jobs on three weighted criteria:

| Criteria | Weight | Method |
|----------|--------|--------|
| Experience | 30% | Full points if nurse meets min years; 50% for partial |
| Certifications | 40% | % of required certs matched (fuzzy substring) |
| Skills | 30% | % of required skills matched (fuzzy substring) |

- Non-nursing profiles with no cert matches: capped at 5%
- Results sorted by score descending (0–100)

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

---

## 10. Frontend Architecture

### Auth Flow

1. User logs in → backend returns JWT pair
2. Tokens stored in localStorage + cookie
3. `AuthProvider` decodes JWT for user info, fetches full profile
4. All API calls attach access token via `api-client.ts`
5. On 401 → automatic token refresh and retry

### Key Data Flows

**Registration:** Basic Info → Professional Status → Resume Upload → Consent → Dashboard

**Job Application:** View job → Apply (`POST /applications/jobs/:jobId/apply`) → Confirmation

**Profile Update:** Edit form → Zod validation → `PUT /nurses/:id` → Toast → Refetch

### Routes

| Group | Routes |
|-------|--------|
| Public | `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Nurse | `/dashboard`, `/jobs`, `/jobs/[id]`, `/profile`, `/settings` |
| Admin | `/admin`, `/admin/jobs`, `/admin/nurses`, `/admin/nurses/[id]`, `/admin/nurses/[id]/matches` |

---

## 11. Environment Variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Server port |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key |
| `NEXTAUTH_SECRET` | Yes | — | JWT signing secret |
| `JWT_ACCESS_EXPIRY` | No | `24h` | Access token lifespan |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token lifespan |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `RESEND_API_KEY` | No | — | Email service |
| `GOOGLE_AI_API_KEY` | No | — | Gemini AI |
| `NOVU_API_KEY` | No | — | Push notifications |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (`http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (shared with backend) |

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
