# Security Guide for Loom Framework

This document outlines security considerations and best practices for deploying Loom in production.

## Critical Configuration Requirements

### 1. JWT Secret

**NEVER** use the default JWT secret in production. Generate a secure secret:

```bash
openssl rand -hex 32
```

Set via environment variable:
```bash
LOOM_JWT_SECRET=your_generated_secret
```

### 2. Database Credentials

- Use strong, unique passwords for database accounts
- Restrict database network access to application servers only
- Enable SSL/TLS for database connections
- Regular database backups with encryption at rest

### 3. Execution Mode

Always set `LOOM_WORKSPACE_TYPE=organization` for production:

```bash
LOOM_WORKSPACE_TYPE=organization
```

This enables:
- Strict RBAC enforcement
- Mandatory audit logging
- Disabled debug endpoints
- Blueprint hot-reload disabled

### 4. CORS Configuration

Explicitly configure allowed origins:

```bash
LOOM_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

**NEVER** use `*` in production.

## Security Features

### Authentication & Authorization

- JWT tokens with configurable expiry (default: 1 hour)
- Role-based access control (RBAC)
- Permission wildcards (`*:*` for superadmin, `module:*` for module access)
- Row-level security through tenant_id filtering

### Audit Logging

All create, update, and delete operations are logged with:
- Actor identification
- Timestamp
- Change diff (before/after values)
- IP address (via middleware)

### Request Security

- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Rate limiting (configurable, default 60 req/min)
- Request logging with timing
- Input validation through Pydantic models

### Blueprint Security

- YAML loading uses `safe_load` to prevent code injection
- File path traversal protection in plugin loading
- Blueprint hot-reload disabled in organization mode

## Deployment Checklist

- [ ] JWT secret changed from default
- [ ] Database using strong credentials
- [ ] `LOOM_WORKSPACE_TYPE=organization` set
- [ ] CORS origins explicitly configured
- [ ] HTTPS enabled with valid certificates
- [ ] Debug endpoints disabled (`/debug/*`)
- [ ] Health checks enabled
- [ ] Logging configured (JSON format for aggregation)
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] Security headers verified
- [ ] Input validation tested

## Reporting Security Issues

Please report security vulnerabilities to the maintainers privately. Do not open public issues for security bugs.

## Security Updates

Keep dependencies updated:

```bash
# Backend
pip list --outdated
pip install --upgrade <package>

# Frontend
npm outdated
npm update
```

## Penetration Testing

Recommended areas for security testing:

1. Authentication bypass attempts
2. RBAC permission escalation
3. SQL injection through blueprint fields
4. YAML loading vulnerabilities
5. File path traversal in plugin loading
6. JWT token manipulation
7. CORS misconfiguration
8. Rate limiting effectiveness
