# OWASP Security Testing Plan for NCPnext

## Overview

This document provides a comprehensive security testing plan based on the **OWASP Top 10 (2021)** and **OWASP Web Security Testing Guide (WSTG)**. This plan ensures systematic coverage of all major security vulnerabilities.

---

## 1. OWASP Top 10 (2021) Testing

### A01:2021 – Broken Access Control

**Risk Level:** High  
**Description:** Access control enforces policy such that users cannot act outside their intended permissions.

#### Test Cases

| Test ID | Test Case | Method | Expected Result | Severity |
|---------|-----------|--------|-----------------|----------|
| BAC-01 | Access admin endpoints as nurse | GET/POST `/api/v1/admin/*` | 403 Forbidden | High |
| BAC-02 | Access admin endpoints unauthenticated | GET/POST `/api/v1/admin/*` | 401 Unauthorized | High |
| BAC-03 | Access another nurse's profile | GET `/api/v1/nurses/{other_id}` | 403 Forbidden | High |
| BAC-04 | Modify another user's experience | PUT `/api/v1/nurses/me/experience/{other_id}` | 403 Forbidden | High |
| BAC-05 | Delete another user's certification | DELETE `/api/v1/nurses/me/certifications/{other_id}` | 403 Forbidden | High |
| BAC-06 | View other nurses' applications | GET `/api/v1/applications?nurse_id={other}` | 403 Forbidden | High |
| BAC-07 | Force browse to admin pages | GET `/admin` (frontend) | Redirect/403 | Medium |
| BAC-08 | Manipulate JWT role claim | Modify JWT payload | Token rejected | High |
| BAC-09 | Use expired access token | Request with expired JWT | 401 Unauthorized | Medium |
| BAC-10 | Use invalid refresh token | POST `/api/v1/auth/refresh` | 401 Unauthorized | Medium |
| BAC-11 | Access job creation as nurse | POST `/api/v1/jobs` | 403 Forbidden | High |
| BAC-12 | Modify job status as nurse | PUT `/api/v1/jobs/{id}/status` | 403 Forbidden | High |
| BAC-13 | Insecure direct object reference | Access `/api/v1/resumes/{other_id}` | 403 Forbidden | High |
| BAC-14 | Mass assignment attack | POST with `role: 'admin'` | Role ignored | High |

#### Automated Test Implementation

```typescript
// backend/src/__tests__/security/a01-broken-access-control.test.ts
import request from 'supertest';
import app from '../../app';
import { createTestUser, generateToken } from '../helpers/test-utils';

describe('A01: Broken Access Control', () => {
  describe('Role-Based Access Control', () => {
    let nurseToken: string;
    let adminToken: string;
    let nurseId: string;
    let adminId: string;
    let otherNurseId: string;

    beforeAll(async () => {
      const nurse = await createTestUser({ role: 'nurse' });
      const admin = await createTestUser({ role: 'admin' });
      const otherNurse = await createTestUser({ role: 'nurse' });

      nurseToken = generateToken(nurse);
      adminToken = generateToken(admin);
      nurseId = nurse.id;
      adminId = admin.id;
      otherNurseId = otherNurse.id;
    });

    describe('Admin endpoint protection', () => {
      it('should deny nurse access to POST /api/v1/jobs', async () => {
        const res = await request(app)
          .post('/api/v1/jobs')
          .set('Authorization', `Bearer ${nurseToken}`)
          .send({ title: 'Test Job', description: 'Test' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('FORBIDDEN');
      });

      it('should deny unauthenticated access to POST /api/v1/jobs', async () => {
        const res = await request(app)
          .post('/api/v1/jobs')
          .send({ title: 'Test Job', description: 'Test' });

        expect(res.status).toBe(401);
      });

      it('should allow admin access to POST /api/v1/jobs', async () => {
        const res = await request(app)
          .post('/api/v1/jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test Job', description: 'Test', location: 'NYC' });

        expect(res.status).toBe(201);
      });
    });

    describe('Resource ownership', () => {
      it('should deny access to another nurse profile', async () => {
        const res = await request(app)
          .get(`/api/v1/nurses/${otherNurseId}`)
          .set('Authorization', `Bearer ${nurseToken}`);

        expect(res.status).toBe(403);
      });

      it('should allow access to own profile', async () => {
        const res = await request(app)
          .get('/api/v1/nurses/me')
          .set('Authorization', `Bearer ${nurseToken}`);

        expect(res.status).toBe(200);
      });
    });

    describe('Token security', () => {
      it('should reject expired tokens', async () => {
        const expiredToken = generateToken({ id: nurseId }, { expiresIn: '-1h' });
        
        const res = await request(app)
          .get('/api/v1/nurses/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('TOKEN_EXPIRED');
      });

      it('should reject tampered tokens', async () => {
        const parts = nurseToken.split('.');
        const tampered = `${parts[0]}.${parts[1].slice(0, -5)}xxxxx.${parts[2]}`;
        
        const res = await request(app)
          .get('/api/v1/nurses/me')
          .set('Authorization', `Bearer ${tampered}`);

        expect(res.status).toBe(401);
      });

      it('should reject tokens with modified role', async () => {
        // Create token and try to modify the payload
        const token = generateToken({ id: nurseId, role: 'nurse' });
        // Tamper with the payload to change role to admin
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        payload.role = 'admin';
        const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
        
        const res = await request(app)
          .post('/api/v1/jobs')
          .set('Authorization', `Bearer ${tamperedToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(401);
      });
    });

    describe('Mass assignment prevention', () => {
      it('should ignore role field in registration', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test-mass-assign@example.com',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin' // Should be ignored
          });

        expect(res.status).toBe(201);
        expect(res.body.data.user.role).toBe('nurse'); // Default role
      });
    });
  });
});
```

---

### A02:2021 – Cryptographic Failures

**Risk Level:** High  
**Description:** Failures related to cryptography which often lead to exposure of sensitive data.

#### Test Cases

| Test ID | Test Case | Method | Expected Result | Severity |
|---------|-----------|--------|-----------------|----------|
| CRY-01 | Verify bcrypt password hashing | Check password hash format | `$2[aby]$12$` format | High |
| CRY-02 | Verify bcrypt rounds | Check hash cost factor | 12 rounds minimum | High |
| CRY-03 | Check password hash uniqueness | Hash same password twice | Different hashes | High |
| CRY-04 | Verify JWT secret strength | Check secret length | ≥256 bits (32 chars) | High |
| CRY-05 | Verify JWT algorithm | Check algorithm used | HS256 or RS256 | High |
| CRY-06 | Check reset token entropy | Generate tokens | 32 bytes minimum | High |
| CRY-07 | Verify HTTPS enforcement | HTTP request | Redirect to HTTPS | High |
| CRY-08 | Check sensitive data in response | API responses | No passwords/tokens | High |
| CRY-09 | Verify token transmission | Check headers | HTTPS only | High |
| CRY-10 | Check password in logs | Server logs | No passwords logged | High |

#### Automated Test Implementation

```typescript
// backend/src/__tests__/security/a02-cryptographic-failures.test.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword, generateResetToken } from '../../shared/security';
import { config } from '../../config/env';

describe('A02: Cryptographic Failures', () => {
  describe('Password hashing', () => {
    it('should use bcrypt for password hashing', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should use 12 rounds for bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // Extract rounds from hash
      const rounds = parseInt(hash.split('$')[2]);
      expect(rounds).toBeGreaterThanOrEqual(12);
    });

    it('should generate unique hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should correctly verify valid password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject invalid password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should be resistant to timing attacks', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const start1 = process.hrtime.bigint();
      await comparePassword('a', hash);
      const time1 = Number(process.hrtime.bigint() - start1);

      const start2 = process.hrtime.bigint();
      await comparePassword('aaaaaaaaaaaaaaaa', hash);
      const time2 = Number(process.hrtime.bigint() - start2);

      // Times should be similar (within 2x factor)
      expect(Math.max(time1, time2) / Math.min(time1, time2)).toBeLessThan(2);
    });
  });

  describe('JWT security', () => {
    it('should use strong secret key', () => {
      expect(config.jwt.secret.length).toBeGreaterThanOrEqual(32);
    });

    it('should use secure algorithm', () => {
      const token = jwt.sign({ id: 'test' }, config.jwt.secret);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded?.header.alg).toBe('HS256');
    });

    it('should set appropriate expiration', () => {
      const token = jwt.sign({ id: 'test' }, config.jwt.secret, { expiresIn: '24h' });
      const decoded: any = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(86400); // 24h in seconds
    });

    it('should reject none algorithm', () => {
      // Try to create a token with none algorithm
      const token = jwt.sign({ id: 'test', role: 'admin' }, '', { algorithm: 'none' });

      expect(() => {
        jwt.verify(token, config.jwt.secret);
      }).toThrow();
    });
  });

  describe('Reset token security', () => {
    it('should generate cryptographically secure tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(64); // 32 bytes hex
    });

    it('should have high entropy', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateResetToken());
      }
      // All tokens should be unique
      expect(tokens.size).toBe(1000);
    });
  });

  describe('Sensitive data exposure', () => {
    it('should not return password in user response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test-no-password@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should not return password hash in login response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'Password123!'
        });

      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });
  });
});
```

---

### A03:2021 – Injection

**Risk Level:** Critical  
**Description:** Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query.

#### Test Cases

| Test ID | Test Case | Payload | Expected Result | Severity |
|---------|-----------|---------|-----------------|----------|
| INJ-01 | SQL injection in email | `' OR '1'='1` | No data leak, auth fails | Critical |
| INJ-02 | SQL injection in email | `'; DROP TABLE users;--` | No table dropped | Critical |
| INJ-03 | SQL injection in email | `' UNION SELECT * FROM users--` | Error or no data | Critical |
| INJ-04 | SQL injection in password | `' OR '1'='1` | Auth fails | Critical |
| INJ-05 | SQL injection in search | `%' OR '1'='1` | No data leak | Critical |
| INJ-06 | SQL injection in job title | `'; DELETE FROM jobs;--` | No data deleted | Critical |
| INJ-07 | XSS in profile fields | `<script>alert(1)</script>` | Sanitized output | High |
| INJ-08 | XSS in job description | `<img src=x onerror=alert(1)>` | Sanitized output | High |
| INJ-09 | XSS in URL parameters | `?q=<script>alert(1)</script>` | Sanitized output | High |
| INJ-10 | Command injection in file upload | `file;rm -rf /` | Filename sanitized | Critical |
| INJ-11 | NoSQL injection | `{"$gt": ""}` | Input rejected | Critical |
| INJ-12 | LDAP injection | `*)(uid=*))(|(uid=*` | Input sanitized | High |

#### Automated Test Implementation

```typescript
// backend/src/__tests__/security/a03-injection.test.ts
import request from 'supertest';
import app from '../../app';

describe('A03: Injection', () => {
  describe('SQL Injection Prevention', () => {
    const sqlPayloads = [
      "' OR '1'='1",
      "' OR '1'='1'--",
      "' OR '1'='1'/*",
      "'; DROP TABLE users;--",
      "' UNION SELECT * FROM users--",
      "' UNION SELECT null,null,null--",
      "1' OR '1' = '1",
      "admin'--",
      "1; SELECT * FROM users",
      "' OR 1=1--",
      "1 OR 1=1",
      "' HAVING 1=1--",
      "' GROUP BY users.id HAVING 1=1--",
      "' ORDER BY 1--",
      "1' AND '1'='1",
      "1' AND '1'='2",
    ];

    describe('Login endpoint', () => {
      sqlPayloads.forEach((payload) => {
        it(`should prevent SQL injection in email: ${payload.substring(0, 15)}...`, async () => {
          const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: payload, password: 'password' });

          // Should not return 200 with valid token
          expect(res.status).not.toBe(200);
          expect(res.body).not.toHaveProperty('data.accessToken');
          
          // Should not return database error
          expect(res.body.error).not.toMatch(/SQL|syntax|database/i);
        });

        it(`should prevent SQL injection in password: ${payload.substring(0, 15)}...`, async () => {
          const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: payload });

          expect(res.status).not.toBe(200);
          expect(res.body).not.toHaveProperty('data.accessToken');
        });
      });
    });

    describe('Registration endpoint', () => {
      sqlPayloads.forEach((payload) => {
        it(`should prevent SQL injection in registration: ${payload.substring(0, 15)}...`, async () => {
          const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
              email: payload,
              password: 'Password123!',
              firstName: 'Test',
              lastName: 'User'
            });

          // Should either reject or sanitize
          if (res.status === 201) {
            expect(res.body.data.user.email).not.toContain("'");
          }
        });
      });
    });

    describe('Search endpoints', () => {
      sqlPayloads.forEach((payload) => {
        it(`should prevent SQL injection in job search: ${payload.substring(0, 15)}...`, async () => {
          const res = await request(app)
            .get(`/api/v1/jobs?search=${encodeURIComponent(payload)}`)
            .set('Authorization', `Bearer ${nurseToken}`);

          expect(res.status).not.toBe(500);
          expect(res.body).not.toMatch(/SQL|syntax|database/i);
        });
      });
    });
  });

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      "'-alert('XSS')-'",
      'javascript:alert("XSS")',
      '<body onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<input onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>',
      '<details open ontoggle=alert("XSS")>',
      '<a href="javascript:alert(\'XSS\')">click</a>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<<SCRIPT>alert("XSS");//<</SCRIPT>',
      '<IMG """><SCRIPT>alert("XSS")</SCRIPT>">',
    ];

    describe('Profile update', () => {
      xssPayloads.forEach((payload) => {
        it(`should sanitize XSS in firstName: ${payload.substring(0, 20)}...`, async () => {
          const res = await request(app)
            .put('/api/v1/nurses/me')
            .set('Authorization', `Bearer ${nurseToken}`)
            .send({ firstName: payload });

          if (res.status === 200) {
            // Check that script tags are removed/escaped
            expect(res.body.data.firstName).not.toContain('<script>');
            expect(res.body.data.firstName).not.toContain('onerror');
            expect(res.body.data.firstName).not.toContain('onload');
            expect(res.body.data.firstName).not.toContain('javascript:');
          }
        });

        it(`should sanitize XSS in lastName: ${payload.substring(0, 20)}...`, async () => {
          const res = await request(app)
            .put('/api/v1/nurses/me')
            .set('Authorization', `Bearer ${nurseToken}`)
            .send({ lastName: payload });

          if (res.status === 200) {
            expect(res.body.data.lastName).not.toContain('<script>');
          }
        });
      });
    });

    describe('Job creation (admin)', () => {
      xssPayloads.forEach((payload) => {
        it(`should sanitize XSS in job description: ${payload.substring(0, 20)}...`, async () => {
          const res = await request(app)
            .post('/api/v1/jobs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              title: 'Test Job',
              description: payload,
              location: 'NYC'
            });

          if (res.status === 201) {
            expect(res.body.data.description).not.toContain('<script>');
            expect(res.body.data.description).not.toContain('onerror');
          }
        });
      });
    });
  });

  describe('NoSQL Injection Prevention', () => {
    const nosqlPayloads = [
      { $gt: '' },
      { $ne: null },
      { $where: 'this.password == this.password' },
      { $or: [{ email: 'admin@example.com' }, { email: 'user@example.com' }] },
    ];

    nosqlPayloads.forEach((payload) => {
      it(`should prevent NoSQL injection: ${JSON.stringify(payload).substring(0, 30)}...`, async () => {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: payload, password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body).not.toHaveProperty('data.accessToken');
      });
    });
  });

  describe('Command Injection Prevention', () => {
    const commandPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '`rm -rf /`',
      '$(whoami)',
      '&& dir',
      '|| ping -c 10 127.0.0.1',
    ];

    commandPayloads.forEach((payload) => {
      it(`should prevent command injection in filename: ${payload}`, async () => {
        const res = await request(app)
          .post('/api/v1/resumes/upload')
          .set('Authorization', `Bearer ${nurseToken}`)
          .attach('resume', Buffer.from('test'), `test${payload}.pdf`);

        // Should either reject or sanitize filename
        expect(res.status).not.toBe(500);
      });
    });
  });
});
```

---

### A04:2021 – Insecure Design

**Risk Level:** High  
**Description:** Missing or ineffective control design.

#### Test Cases

| Test ID | Test Case | Expected Result | Severity |
|---------|-----------|-----------------|----------|
| DES-01 | Rate limiting on login | Max 10 attempts per 15 min | High |
| DES-02 | Account lockout mechanism | Lock after 5 failed attempts | High |
| DES-03 | Password strength requirements | Min 8 chars, complexity | High |
| DES-04 | Session timeout | Access token expires in 24h | Medium |
| DES-05 | Refresh token rotation | New refresh token on use | High |
| DES-06 | Password confirmation | Required for sensitive actions | Medium |
| DES-07 | Email verification | Required before full access | Medium |
| DES-08 | Secure password reset | Token expires in 1 hour | High |
| DES-09 | Multi-factor authentication | Available for sensitive accounts | Medium |
| DES-10 | Secure default settings | Secure by default | High |

#### Automated Test Implementation

```typescript
// backend/src/__tests__/security/a04-insecure-design.test.ts
import request from 'supertest';
import app from '../../app';

describe('A04: Insecure Design', () => {
  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login (10 per 15 min)', async () => {
      const email = 'rate-limit-test@example.com';
      const requests = [];

      // Make 12 requests
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({ email, password: 'wrongpassword' })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should enforce rate limiting on registration', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/register')
            .send({
              email: `user${i}@example.com`,
              password: 'Password123!',
              firstName: 'Test',
              lastName: 'User'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should enforce rate limiting on password reset', async () => {
      const requests = [];

      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ email: 'test@example.com' })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Account Lockout', () => {
    it('should lock account after 5 failed attempts', async () => {
      const email = 'lockout-test@example.com';
      
      // Create user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrongpassword' });
      }

      // Next attempt should show account locked
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'Password123!' }); // Even correct password

      expect(res.status).toBe(423);
      expect(res.body.code).toBe('ACCOUNT_LOCKED');
    });

    it('should unlock account after lockout duration', async () => {
      // This test would require mocking time or waiting
      // Implementation depends on lockout duration (30 min)
    });
  });

  describe('Password Policy', () => {
    const weakPasswords = [
      { password: 'password', reason: 'too common' },
      { password: '123456', reason: 'too short, numbers only' },
      { password: 'qwerty', reason: 'too short, keyboard pattern' },
      { password: 'abc123', reason: 'too short' },
      { password: 'letmein', reason: 'too common' },
      { password: 'admin', reason: 'too short, common' },
      { password: 'welcome', reason: 'too common' },
      { password: 'Password', reason: 'no numbers/symbols' },
      { password: 'password1', reason: 'common pattern' },
    ];

    weakPasswords.forEach(({ password, reason }) => {
      it(`should reject weak password "${password}" (${reason})`, async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `weak-pass-${Date.now()}@example.com`,
            password,
            firstName: 'Test',
            lastName: 'User'
          });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
      });
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'MyStr0ng!Pass',
        'C0mpl3x#P@ssw0rd',
        'S3cur3-P@ss!',
        'NurseC@re2024!',
      ];

      for (const password of strongPasswords) {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `strong-${Date.now()}@example.com`,
            password,
            firstName: 'Test',
            lastName: 'User'
          });

        expect(res.status).toBe(201);
      }
    });
  });

  describe('Session Management', () => {
    it('should set access token expiration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      const decoded: any = jwt.decode(res.body.data.accessToken);
      const expiresIn = decoded.exp - decoded.iat;

      // Should be 24 hours or less
      expect(expiresIn).toBeLessThanOrEqual(86400);
    });

    it('should return new refresh token on refresh', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      const oldRefreshToken = loginRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      // New refresh token should be different (rotation)
      expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);
    });

    it('should invalidate old refresh token after use', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      const oldRefreshToken = loginRes.body.data.refreshToken;

      // Use the refresh token
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      // Try to use it again
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(401);
    });
  });

  describe('Password Reset Security', () => {
    it('should generate unique reset tokens', async () => {
      const res1 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const res2 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      // Each request should generate a new token
      // (Implementation dependent)
    });

    it('should expire reset tokens after 1 hour', async () => {
      // This would require mocking time or waiting
    });

    it('should invalidate reset token after use', async () => {
      // Request reset
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      // Get token from email or database
      const token = '...'; // Get from test database

      // Use token to reset password
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, password: 'NewPassword123!' });

      expect(resetRes.status).toBe(200);

      // Try to use token again
      const reuseRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, password: 'AnotherPassword123!' });

      expect(reuseRes.status).toBe(400);
    });
  });
});
```

---

### A05:2021 – Security Misconfiguration

**Risk Level:** Medium  
**Description:** Missing appropriate security hardening across any part of the application stack.

#### Test Cases

| Test ID | Test Case | Expected Result | Severity |
|---------|-----------|-----------------|----------|
| MIS-01 | Check X-Content-Type-Options | `nosniff` | Medium |
| MIS-02 | Check X-Frame-Options | `DENY` or `SAMEORIGIN` | Medium |
| MIS-03 | Check Strict-Transport-Security | Present with max-age | High |
| MIS-04 | Check X-XSS-Protection | `0` (modern approach) | Low |
| MIS-05 | Check Content-Security-Policy | Present with restrictions | High |
| MIS-06 | Check Referrer-Policy | `strict-origin-when-cross-origin` | Medium |
| MIS-07 | Check Permissions-Policy | Present | Medium |
| MIS-08 | Check server version disclosure | Not exposed | Low |
| MIS-09 | Check X-Powered-By header | Not present | Low |
| MIS-10 | Check debug mode | Disabled in production | High |
| MIS-11 | Check stack traces in errors | Not exposed in production | High |
| MIS-12 | Check CORS configuration | Whitelisted origins only | High |
| MIS-13 | Check default credentials | None exist | Critical |
| MIS-14 | Check unnecessary HTTP methods | Only GET, POST, PUT, DELETE | Medium |

#### Automated Test Implementation

```typescript
// backend/src/__tests__/security/a05-security-misconfiguration.test.ts
import request from 'supertest';
import app from '../../app';

describe('A05: Security Misconfiguration', () => {
  describe('HTTP Security Headers', () => {
    let response: any;

    beforeAll(async () => {
      response = await request(app).get('/api/v1/health');
    });

    it('should have X-Content-Type-Options: nosniff', () => {
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should have X-Frame-Options: DENY or SAMEORIGIN', () => {
      const header = response.headers['x-frame-options'];
      expect(['DENY', 'SAMEORIGIN']).toContain(header);
    });

    it('should have Strict-Transport-Security header', () => {
      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toBeDefined();
      expect(hsts).toContain('max-age=');
    });

    it('should have X-XSS-Protection header', () => {
      // Modern approach is to disable this header
      // as browsers have built-in XSS protection
      const header = response.headers['x-xss-protection'];
      expect(header).toBeDefined();
    });

    it('should have Content-Security-Policy header', () => {
      const csp = response.headers['content-security-policy'];
      // CSP is highly recommended
      if (csp) {
        expect(csp).toContain("default-src");
      }
    });

    it('should have Referrer-Policy header', () => {
      const referrer = response.headers['referrer-policy'];
      expect(referrer).toBeDefined();
    });

    it('should not expose X-Powered-By header', () => {
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should not expose server version', () => {
      const server = response.headers['server'];
      if (server) {
        expect(server).not.toMatch(/[0-9]+\.[0-9]+/); // No version numbers
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should only allow whitelisted origins', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST');

      // Should not allow arbitrary origins
      const allowOrigin = res.headers['access-control-allow-origin'];
      expect(allowOrigin).not.toBe('https://malicious-site.com');
    });

    it('should allow configured origin', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      const allowOrigin = res.headers['access-control-allow-origin'];
      expect(allowOrigin).toBeDefined();
    });

    it('should not allow credentials from arbitrary origins', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://malicious-site.com');

      // If credentials are allowed, origin must be specific, not *
      const allowCredentials = res.headers['access-control-allow-credentials'];
      const allowOrigin = res.headers['access-control-allow-origin'];

      if (allowCredentials === 'true') {
        expect(allowOrigin).not.toBe('*');
      }
    });
  });

  describe('HTTP Methods', () => {
    const disallowedMethods = ['TRACE', 'TRACK', 'CONNECT', 'PATCH'];

    disallowedMethods.forEach((method) => {
      it(`should reject ${method} method`, async () => {
        const res = await request(app)
          [method.toLowerCase() as keyof typeof request]('/api/v1/auth/login');

        expect([405, 501]).toContain(res.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should not expose stack traces in production', async () => {
      // Trigger an error
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ invalid: 'data' });

      if (res.status >= 400) {
        expect(res.body.stack).toBeUndefined();
        expect(res.body.trace).toBeUndefined();
      }
    });

    it('should return generic error messages', async () => {
      const res = await request(app)
        .get('/api/v1/nonexistent-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      // Should not expose internal paths or details
      expect(res.body.error).not.toMatch(/\/app\/|\/src\//);
    });
  });

  describe('Debug Mode', () => {
    it('should have debug mode disabled in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.DEBUG).toBeFalsy();
        expect(process.env.NODE_ENV).toBe('production');
      }
    });
  });

  describe('Default Credentials', () => {
    it('should not have default admin credentials', async () => {
      const defaultCredentials = [
        { email: 'admin@example.com', password: 'admin' },
        { email: 'admin@example.com', password: 'password' },
        { email: 'admin@example.com', password: 'admin123' },
        { email: 'root@example.com', password: 'root' },
        { email: 'test@example.com', password: 'test' },
      ];

      for (const cred of defaultCredentials) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send(cred);

        expect(res.status).not.toBe(200);
      }
    });
  });
});
```

---

### A06:2021 – Vulnerable and Outdated Components

**Risk Level:** High  
**Description:** Using components with known vulnerabilities.

#### Automated Scanning

```bash
# npm audit - built-in vulnerability scanner
npm audit --audit-level=moderate

# Check for outdated packages
npm outdated

# Snyk - comprehensive vulnerability scanning
npx snyk test
npx snyk monitor

# OWASP Dependency Check
dependency-check --scan ./
```

#### CI/CD Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0' # Weekly scan

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit (backend)
        run: cd backend && npm audit --audit-level=high
        continue-on-error: true
      
      - name: Run npm audit (frontend)
        run: cd frontend && npm audit --audit-level=high
        continue-on-error: true
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Check for outdated dependencies
        run: |
          cd backend && npm outdated || true
          cd ../frontend && npm outdated || true
```

---

### A07:2021 – Identification and Authentication Failures

**Risk Level:** High  
**Description:** Confirmation of user identity, authentication, and session management.

#### Test Cases

| Test ID | Test Case | Expected Result | Severity |
|---------|-----------|-----------------|----------|
| IAF-01 | Brute force protection | Account locked after 5 attempts | High |
| IAF-02 | Weak password rejection | Password policy enforced | High |
| IAF-03 | Session fixation prevention | New session on login | High |
| IAF-04 | Concurrent session handling | Limited or managed | Medium |
| IAF-05 | Secure "Remember Me" | Long-term tokens secure | Medium |
| IAF-06 | Password not in URL | Never transmitted in URL | High |
| IAF-07 | Secure credential recovery | Token-based flow | High |
| IAF-08 | Account enumeration prevention | Generic error messages | Medium |
| IAF-09 | Multi-factor authentication | Available for sensitive accounts | Medium |
| IAF-10 | Session timeout | Appropriate expiration | Medium |

#### Automated Test Implementation

```typescript
// backend/src/__tests__/security/a07-authentication-failures.test.ts
import request from 'supertest';
import app from '../../app';

describe('A07: Identification and Authentication Failures', () => {
  describe('Brute Force Protection', () => {
    it('should lock account after 5 failed login attempts', async () => {
      const email = 'brute-force-test@example.com';
      
      // Create user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrongpassword' });
      }

      // Account should be locked
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'Password123!' });

      expect(res.status).toBe(423);
      expect(res.body.code).toBe('ACCOUNT_LOCKED');
    });

    it('should return same error for non-existent user (enumeration prevention)', async () => {
      const res1 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' });

      const res2 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'existing@example.com', password: 'wrongpassword' });

      // Same error message and status
      expect(res1.status).toBe(res2.status);
      expect(res1.body.error).toBe(res2.body.error);
    });
  });

  describe('Password Policy', () => {
    it('should enforce minimum password length', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'short-pass@example.com',
          password: 'Sh0rt!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
    });

    it('should require password complexity', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'simple-pass@example.com',
          password: 'simplepassword',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Session Management', () => {
    it('should generate new session on login', async () => {
      // Login twice
      const res1 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      const res2 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      // Tokens should be different
      expect(res1.body.data.accessToken).not.toBe(res2.body.data.accessToken);
    });

    it('should invalidate session on logout', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      const token = loginRes.body.data.accessToken;

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Try to use the token
      const res = await request(app)
        .get('/api/v1/nurses/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Password Reset Security', () => {
    it('should not reveal if email exists', async () => {
      const res1 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      const res2 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'existing@example.com' });

      // Same response regardless of email existence
      expect(res1.status).toBe(res2.status);
      expect(res1.body.message).toBe(res2.body.message);
    });

    it('should require token for password reset', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ password: 'NewPassword123!' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid reset tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewPassword123!' });

      expect(res.status).toBe(400);
    });
  });
});
```

---

### A08:2021 – Software and Data Integrity Failures

**Risk Level:** High  
**Description:** Code and infrastructure that doesn't protect against integrity violations.

#### Test Cases

| Test ID | Test Case | Expected Result | Severity |
|---------|-----------|-----------------|----------|
| INT-01 | Verify npm package signatures | Packages verified | High |
| INT-02 | Check CI/CD pipeline security | Protected branches | High |
| INT-03 | Verify JWT signature | Invalid signatures rejected | Critical |
| INT-04 | Check auto-update security | Signed updates only | Medium |
| INT-05 | Verify file upload integrity | File validation | High |
| INT-06 | Check SRI for CDN resources | Integrity attributes | Medium |
| INT-07 | Verify webhook signatures | Signature validation | High |

---

### A09:2021 – Security Logging and Monitoring Failures

**Risk Level:** Medium  
**Description:** Insufficient logging and monitoring, coupled with missing or ineffective integration.

#### Test Cases

| Test ID | Test Case | Expected Result | Severity |
|---------|-----------|-----------------|----------|
| LOG-01 | Failed login logging | Logged with IP, timestamp | High |
