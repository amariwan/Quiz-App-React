# Lernkarten AP Teil 1

🔒 **Secure Quiz Application with End-to-End Encryption**

This is a Next.js-based quiz application with enterprise-grade security features including end-to-end encryption, security monitoring, and comprehensive audit logging.

## 🚀 Features

- ✅ Next.js 16+ with React 19
- 🔐 End-to-End Encryption (AES-GCM 256-bit)
- 🛡️ Real-time Security Monitoring
- 📊 Security Dashboard with Live Events
- 🚦 Rate Limiting Protection
- 📝 Comprehensive Audit Logging
- 🔒 Secure HTTP Headers
- ✨ Input Validation & Sanitization

## 🔒 Security Features

This application implements multiple layers of security:

### 1. End-to-End Encryption

- **AES-GCM 256-bit encryption** for all sensitive data
- **Session-based encryption keys** generated per user session
- **Client-side encryption** of questions and answers
- **SHA-256 integrity hashing** for data verification

### 2. Security Monitoring

- **Real-time event tracking** for all security-relevant actions
- **Three-level event classification**: INFO, WARNING, CRITICAL
- **Live security dashboard** with event visualization
- **Audit log export** for compliance and forensics

### 3. Rate Limiting

- **Client-side rate limiting** (10 requests/minute)
- **Server-side rate limiting** (5 submissions/minute)
- **Automatic blocking** of excessive requests

### 4. HTTP Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` with HSTS
- `Content-Security-Policy`

### 5. Input Validation

- Strict validation of all user inputs
- Sanitization of potentially dangerous content
- Type checking and format validation

## 📋 Quick Start

### Installation

```bash
cd /home/snow/dev/github/Quiz-App-React
pnpm install
```

### Configuration

1. Copy the environment template:

```bash
cp .env.local.template .env.local
```

2. Generate a secure API key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Add the key to `.env.local`:

```bash
API_KEY=your-generated-api-key-here
NODE_ENV=development
```

### Development

```bash
pnpm run dev
```

Open http://localhost:3000

### Production Build

```bash
pnpm run build
pnpm start
```

### Testing

```bash
pnpm test
```

## 📖 Security Documentation

For detailed security documentation, see [SECURITY.md](./SECURITY.md)

Topics covered:

- End-to-End Encryption Implementation
- Security Monitoring System
- Rate Limiting Configuration
- Input Validation
- Audit API Usage
- Security Best Practices

## 🔐 API Endpoints

### Public Endpoints

- `GET /api/questions` - Fetch quiz questions (with encryption)
- `POST /api/submit` - Submit quiz answers (with rate limiting)

### Protected Endpoints (require API key)

- `GET /api/audit` - Get security audit summary
- `DELETE /api/audit` - Clear audit logs

## 🛡️ Security Dashboard

The application includes a built-in security dashboard visible in the bottom-right corner:

- **Encryption Status**: Shows if encryption is active
- **Event Counter**: Displays count by severity level
- **Recent Events**: Lists the last 10 security events
- **Audit Export**: Download complete audit log as JSON

## 🔧 Configuration

### Rate Limiting

Adjust rate limits in:

- `src/lib/security-monitor.ts` (client-side)
- `src/app/api/submit/route.ts` (server-side)

```typescript
// Client-side
const MAX_REQUESTS = 10;
const WINDOW_MS = 60000; // 1 minute

// Server-side
const MAX_REQUESTS = 5;
const WINDOW_MS = 60000; // 1 minute
```

### Security Headers

Modify headers in API routes:

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // ... add more headers
};
```

## 📊 Monitoring & Logging

### View Security Events

All security events are logged and can be viewed in the Security Dashboard or accessed programmatically:

```typescript
import { SecurityMonitor, SecurityLevel } from '@/lib/security-monitor';

// Get all critical events
const critical = SecurityMonitor.getEventsByLevel(SecurityLevel.CRITICAL);

// Export audit log
const auditLog = SecurityMonitor.exportEvents();
```

### Server-Side Logging

Server logs include:

- Request timestamps
- Session IDs (anonymized)
- User agents
- Rate limit violations
- Validation failures

Check console output in development:

```
[SECURITY] Questions requested { timestamp: '...', sessionId: '...' }
[SECURITY] Quiz submission received { ... }
[SECURITY] Rate limit exceeded { identifier: '...' }
```

## 🔍 Audit API

Access audit logs with API key:

```bash
# Get audit summary
curl -H "X-API-KEY: your-api-key" http://localhost:3000/api/audit

# Clear audit logs
curl -X DELETE -H "X-API-KEY: your-api-key" http://localhost:3000/api/audit
```

## Security notes (production)

- Prefer to set security headers at the server or CDN level (e.g. nginx, Cloudflare). Important headers:
  - Content-Security-Policy (CSP)
  - Referrer-Policy
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Strict-Transport-Security (HSTS) — only on HTTPS

- CSP recommendation: after bundling dependencies with Next, you can restrict script-src to 'self' and remove external CDNs. Consider SRI for any remaining third-party scripts.

- Use HTTPS (TLS) in production and enable HSTS. Keep certificates up-to-date.

- Regularly run `npm audit` and update dependencies. Consider Dependabot or Renovate.
