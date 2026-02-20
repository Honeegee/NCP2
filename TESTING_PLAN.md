# NCPnext Comprehensive Testing Plan

## Overview

This document outlines the complete testing strategy for the Nurse Care Pro (NCP) application, covering unit tests, integration tests, end-to-end tests, API tests, and security tests.

**Current State:** No testing framework is currently implemented in either the frontend or backend.

---

## 1. Testing Architecture

### Testing Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  ← Playwright/Cypress
                    │   Tests     │    (Critical user flows)
                    ├─────────────┤
                    │ Integration │  ← Jest + Supertest (API)
                    │   Tests     │    Jest + Testing Library (UI)
                    ├─────────────┤
                    │    Unit     │  ← Jest (Backend)
                    │   Tests     │    Vitest/Jest (Frontend)
                    └─────────────┘
```

### Testing Tools Selection

| Layer | Backend | Frontend |
|-------|---------|----------|
| **Unit** | Jest + ts-jest | Vitest or Jest |
| **Integration** | Jest + Supertest | Jest + Testing Library |
| **E2E** | - | Playwright |
| **API** | Supertest | - |
| **Mocking** | jest.mock | MSW (Mock Service Worker) |
| **Coverage** | Istanbul/nyc | Istanbul/v8 |

---

## 2. Backend Testing Plan

### 2.1 Setup Testing Infrastructure

#### Install Dependencies
```bash
cd backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

#### Create Jest Configuration
```typescript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
```

#### Add Test Scripts to package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

### 2.2 Unit Tests

#### Priority 1: Authentication Module (`src/modules/auth/`)

| Test File | Test Cases |
|-----------|------------|
| `auth.service.test.ts` | Password hashing verification, Token generation, Account lockout logic, Email verification flow |
| `auth.controller.test.ts` | Request validation, Response formatting, Error handling |
| `sso.service.test.ts` | OAuth provider validation, Profile data extraction, User creation/linking |

**Example Test Structure:**
```typescript
// backend/src/modules/auth/__tests__/auth.service.test.ts
describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {});
    it('should use 12 rounds for hashing', async () => {});
  });
  
  describe('comparePassword', () => {
    it('should return true for correct password', async () => {});
    it('should return false for incorrect password', async () => {});
    it('should be resistant to timing attacks', async () => {});
  });
  
  describe('generateTokens', () => {
    it('should generate valid access token', () => {});
    it('should generate valid refresh token', () => {});
    it('should include correct user claims', () => {});
  });
  
  describe('lockAccount', () => {
    it('should lock account after 5 failed attempts', () => {});
    it('should set lockout duration to 30 minutes', () => {});
    it('should reset attempts after successful login', () => {});
  });
});
```

#### Priority 2: Security Module (`src/shared/security.ts`)

| Test File | Test Cases |
|-----------|------------|
| `security.test.ts` | Token generation, Account lockout, Rate limiting helpers |

#### Priority 3: Validators (`src/shared/validators.ts`)

| Test File | Test Cases |
|-----------|------------|
| `validators.test.ts` | Schema validation, Edge cases, Invalid input handling |

#### Priority 4: Job Matcher (`src/shared/job-matcher.ts`, `ai-job-matcher.ts`)

| Test File | Test Cases |
|-----------|------------|
| `job-matcher.test.ts` | Rule-based matching algorithm, Score calculation |
| `ai-job-matcher.test.ts` | Embedding generation, Semantic matching (mocked OpenAI) |

#### Priority 5: Resume Parser (`src/shared/data-extractor.ts`, `ai-resume-parser.ts`)

| Test File | Test Cases |
|-----------|------------|
| `data-extractor.test.ts` | Regex extraction, Edge cases, Multiple formats |
| `ai-resume-parser.test.ts` | AI parsing (mocked Gemini) |

### 2.3 Integration Tests

#### API Endpoint Testing with Supertest

```typescript
// backend/src/modules/auth/__tests__/auth.routes.test.ts
import request from 'supertest';
import app from '../../app';

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {});
    it('should reject duplicate email', async () => {});
    it('should validate input fields', async () => {});
    it('should hash password before storing', async () => {});
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('should return tokens for valid credentials', async () => {});
    it('should return 401 for invalid credentials', async () => {});
    it('should enforce rate limiting', async () => {});
    it('should lock account after failed attempts', async () => {});
  });
  
  describe('POST /api/v1/auth/refresh', () => {
    it('should return new access token', async () => {});
    it('should reject invalid refresh token', async () => {});
    it('should reject expired refresh token', async () => {});
  });
});
```

#### Test Database Setup

```typescript
// backend/jest.setup.ts
import { createClient } from '@supabase/supabase-js';

// Use test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

beforeAll(async () => {
  // Setup test database connection
});

afterAll(async () => {
  // Cleanup test database
});

beforeEach(async () => {
  // Reset test data
});

afterEach(async () => {
  // Clean up created records
});
```

### 2.4 Module Test Coverage Goals

| Module | Target Coverage | Priority |
|--------|-----------------|----------|
| `auth/` | 90% | High |
| `nurses/` | 85% | High |
| `jobs/` | 80% | Medium |
| `applications/` | 80% | Medium |
| `resumes/` | 75% | Medium |
| `middleware/` | 90% | High |
| `shared/validators.ts` | 95% | High |
| `shared/security.ts` | 95% | High |

---

## 3. Frontend Testing Plan

### 3.1 Setup Testing Infrastructure

#### Install Dependencies
```bash
cd frontend
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

#### Create Vitest Configuration
```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/', '__tests__/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### Add Test Scripts to package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 3.2 Unit Tests

#### Priority 1: Utility Functions

| Test File | Test Cases |
|-----------|------------|
| `lib/utils.test.ts` | Helper functions, Date formatting, Data transformations |
| `lib/validators.test.ts` | Zod schema validation, Error messages |

#### Priority 2: API Client

| Test File | Test Cases |
|-----------|------------|
| `lib/api-client.test.ts` | Request formatting, Token handling, Error handling, Refresh logic |

### 3.3 Component Tests

#### Priority 1: Shared Components

| Component | Test Cases |
|-----------|------------|
| `Navbar.tsx` | Renders correctly, Navigation links, Auth state, Mobile menu |
| `Footer.tsx` | Renders correctly, Links, Social icons |
| `NotificationBell.tsx` | Renders, Badge count, Click handler |
| `NotificationInbox.tsx` | Renders notifications, Mark as read, Empty state |

#### Priority 2: UI Components (`components/ui/`)

| Component | Test Cases |
|-----------|------------|
| `Button` | Variants, Sizes, Disabled state, Click handler |
| `Input` | Value binding, onChange, Error state, Disabled |
| `Dialog` | Open/close, Content rendering, Actions |
| `Select` | Options, Selection, Disabled |
| `Table` | Data rendering, Sorting, Pagination |

#### Priority 3: Feature Components

| Component | Test Cases |
|-----------|------------|
| `JobDetailPanel.tsx` | Renders job details, Apply button, Match score |
| `JobFormDialog.tsx` | Form validation, Submit handler, Edit mode |
| `MatchScoreCircle.tsx` | Score display, Color coding |
| `ProfileEditModal.tsx` | Form validation, Save/cancel actions |

### 3.4 Component Test Example

```typescript
// frontend/src/components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('renders different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');
  });
});
```

### 3.5 Integration Tests with MSW

```typescript
// frontend/src/__tests__/auth-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import LoginPage from '@/app/(auth)/login/page';

const server = setupServer(
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(ctx.json({
      data: { accessToken: 'test-token', refreshToken: 'test-refresh' }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Login Flow', () => {
  it('should login successfully', async () => {
    render(<LoginPage />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });
  
  it('should show error for invalid credentials', async () => {
    server.use(
      rest.post('/api/v1/auth/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
      })
    );
    
    render(<LoginPage />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });
});
```

### 3.6 Frontend Coverage Goals

| Directory | Target Coverage | Priority |
|-----------|-----------------|----------|
| `lib/validators.ts` | 95% | High |
| `lib/api-client.ts` | 90% | High |
| `components/ui/` | 85% | Medium |
| `components/shared/` | 80% | Medium |
| `components/jobs/` | 75% | Medium |
| `components/profile/` | 70% | Low |

---

## 4. End-to-End Testing Plan

### 4.1 Setup Playwright

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

#### Playwright Configuration
```typescript
// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 Critical User Flows to Test

#### Flow 1: Nurse Registration and Profile Completion
```typescript
// frontend/e2e/nurse-registration.spec.ts
test('Nurse registration flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Register');
  
  // Fill registration form
  await page.fill('[name="email"]', 'nurse@test.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.fill('[name="firstName"]', 'Jane');
  await page.fill('[name="lastName"]', 'Doe');
  await page.selectOption('[name="professionalStatus"]', 'RN');
  
  await page.click('button[type="submit"]');
  
  // Verify email
  await expect(page).toHaveURL(/verify-email/);
  
  // Complete profile
  // ...
});
```

#### Flow 2: Login and Dashboard Access
```typescript
// frontend/e2e/login.spec.ts
test('Login flow', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

#### Flow 3: Job Application Flow
```typescript
// frontend/e2e/job-application.spec.ts
test('Apply for a job', async ({ page }) => {
  // Login first
  await page.goto('/login');
  await page.fill('[name="email"]', 'nurse@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to jobs
  await page.click('text=Jobs');
  await expect(page).toHaveURL('/jobs');
  
  // Select a job
  await page.click('.job-card:first-child');
  
  // Apply
  await page.click('text=Apply Now');
  await expect(page.locator('.toast')).toContainText('Application submitted');
});
```

#### Flow 4: Admin Job Management
```typescript
// frontend/e2e/admin-jobs.spec.ts
test('Admin creates a new job', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'adminpass123');
  await page.click('button[type="submit"]');
  
  await page.click('text=Jobs');
  await page.click('text=Create Job');
  
  await page.fill('[name="title"]', 'ICU Nurse');
  await page.fill('[name="description"]', 'Critical care position');
  await page.fill('[name="location"]', 'New York, NY');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.toast')).toContainText('Job created');
});
```

#### Flow 5: SSO Authentication
```typescript
// frontend/e2e/sso.spec.ts
test('Google SSO login', async ({ page }) => {
  await page.goto('/login');
  await page.click('text=Continue with Google');
  
  // Handle OAuth popup/redirect
  // Note: This requires special handling for OAuth flows
});
```

### 4.3 E2E Test Matrix

| Flow | Guest | Nurse | Admin |
|------|-------|-------|-------|
| Landing Page | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ |
| Register | ✅ | ❌ | ❌ |
| Dashboard | ❌ | ✅ | ✅ |
| Profile | ❌ | ✅ | ❌ |
| Jobs (View) | ❌ | ✅ | ✅ |
| Jobs (Create) | ❌ | ❌ | ✅ |
| Applications | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |
| Settings | ❌ | ✅ | ✅ |

---

## 5. API Testing Plan

### 5.1 API Test Categories

#### Authentication Tests
| Endpoint | Tests |
|----------|-------|
| `POST /auth/register` | Valid registration, Duplicate email, Invalid inputs, Rate limiting |
| `POST /auth/login` | Valid login, Invalid credentials, Locked account, Rate limiting |
| `POST /auth/refresh` | Valid refresh, Invalid token, Expired token |
| `POST /auth/logout` | Valid logout, Token invalidation |
| `POST /auth/forgot-password` | Valid request, Rate limiting, Invalid email |
| `POST /auth/reset-password` | Valid reset, Invalid token, Expired token |
| `GET /auth/me` | Valid token, Invalid token, Expired token |

#### Nurse Profile Tests
| Endpoint | Tests |
|----------|-------|
| `GET /nurses/me` | Own profile, Unauthorized |
| `PUT /nurses/me` | Update profile, Invalid data |
| `POST /nurses/me/experience` | Add experience, Validation |
| `PUT /nurses/me/experience/:id` | Update own, Update others (forbidden) |
| `DELETE /nurses/me/experience/:id` | Delete own, Delete others (forbidden) |

#### Job Tests
| Endpoint | Tests |
|----------|-------|
| `GET /jobs` | List jobs, Pagination, Filtering |
| `GET /jobs/:id` | Valid job, Non-existent job |
| `POST /jobs` | Admin only, Validation |
| `PUT /jobs/:id` | Admin only, Validation |
| `DELETE /jobs/:id` | Admin only |

#### Application Tests
| Endpoint | Tests |
|----------|-------|
| `POST /applications` | Apply to job, Duplicate application |
| `GET /applications` | Own applications, Admin all applications |
| `PUT /applications/:id/status` | Admin only, Valid transitions |

### 5.2 API Test Collection (Postman/Bruno)

Create a collection for manual API testing:

```
api-tests/
├── auth/
│   ├── Register.bru
│   ├── Login.bru
│   ├── Refresh.bru
│   ├── ForgotPassword.bru
│   └── ResetPassword.bru
├── nurses/
│   ├── GetProfile.bru
│   ├── UpdateProfile.bru
│   └── experiences/
├── jobs/
│   ├── ListJobs.bru
│   ├── GetJob.bru
│   └── CreateJob.bru
└── applications/
    ├── Apply.bru
    └── ListApplications.bru
```

---

## 6. Security Testing Plan

*(Reference: SECURITY_TESTING_PLAN.md for detailed security testing)*

### 6.1 Automated Security Scans

```bash
# Dependency vulnerability scanning
npm audit
npm audit fix

# Snyk scanning
npx snyk test

# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

### 6.2 Security Test Cases

| Category | Test Cases |
|----------|------------|
| **Authentication** | Brute force protection, Session management, Token security |
| **Authorization** | Role-based access, Resource ownership |
| **Input Validation** | SQL injection, XSS, Command injection |
| **Rate Limiting** | Login, Registration, API endpoints |
| **Security Headers** | CSP, X-Frame-Options, HSTS |

---

## 7. Test Data Management

### 7.1 Test Database

Use a separate Supabase project for testing:

```typescript
// backend/src/config/test-env.ts
export const TEST_CONFIG = {
  database: {
    url: process.env.TEST_DATABASE_URL,
  },
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'nurse'
  },
  testAdmin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin'
  }
};
```

### 7.2 Fixtures and Factories

```typescript
// backend/src/__tests__/fixtures/user.fixture.ts
export const createUser = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'nurse',
  ...overrides
});

// backend/src/__tests__/fixtures/job.fixture.ts
export const createJob = (overrides = {}) => ({
  title: 'Registered Nurse',
  description: 'Full-time position',
  location: 'New York, NY',
  type: 'full-time',
  ...overrides
});
```

---

## 8. CI/CD Integration

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm run test:ci
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: cd frontend && npx playwright test
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Run npm audit
        run: |
          cd backend && npm audit --audit-level=high
          cd ../frontend && npm audit --audit-level=high
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## 9. Implementation Timeline

### Phase 1: Setup (Week 1)
- [ ] Install testing dependencies in backend
- [ ] Install testing dependencies in frontend
- [ ] Configure Jest for backend
- [ ] Configure Vitest for frontend
- [ ] Set up test database
- [ ] Create test fixtures and factories

### Phase 2: Backend Unit Tests (Week 2-3)
- [ ] Auth module tests
- [ ] Security module tests
- [ ] Validator tests
- [ ] Job matcher tests
- [ ] Resume parser tests

### Phase 3: Backend Integration Tests (Week 4)
- [ ] Auth API tests
- [ ] Nurses API tests
- [ ] Jobs API tests
- [ ] Applications API tests

### Phase 4: Frontend Unit Tests (Week 5)
- [ ] Utility function tests
- [ ] API client tests
- [ ] UI component tests

### Phase 5: Frontend Integration Tests (Week 6)
- [ ] Auth flow tests
- [ ] Profile management tests
- [ ] Job browsing tests

### Phase 6: E2E Tests (Week 7)
- [ ] Set up Playwright
- [ ] Registration flow
- [ ] Login flow
- [ ] Job application flow
- [ ] Admin flows

### Phase 7: CI/CD Integration (Week 8)
- [ ] GitHub Actions setup
- [ ] Coverage reporting
- [ ] Security scanning automation

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Backend Line Coverage | ≥ 80% |
| Frontend Line Coverage | ≥ 70% |
| Critical Path E2E Coverage | 100% |
| All Tests Passing | ✅ |
| Zero High/Critical Vulnerabilities | ✅ |
| Test Execution Time | < 5 min (unit), < 15 min (E2E) |

---

## 11. Test Commands Reference

### Backend
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.service.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Frontend
```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run E2E tests in UI mode
npx playwright test --ui
```

---

## 12. Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing JavaScript](https://testingjavascript.com/)

---

**Document Version:** 1.0  
**Created:** 2026-02-19  
**Last Updated:** 2026-02-19
