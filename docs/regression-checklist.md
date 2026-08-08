# WITHUS Platform - Regression Checklist

> **Rule 16: Regression Rule**
> After every runtime commit, never rely only on build, TypeScript, or lint success. A phase is considered complete ONLY when manual regression passes against this checklist.

## GitHub (Migrated Phase 2)
- [ ] Login completes without errors
- [ ] Delegated Access magic toast appears
- [ ] Credential Autofill (Username correctly detected and filled)
- [ ] Credential Autofill (Password correctly detected and filled)
- [ ] Auto-submit correctly triggers
- [ ] Logout detection (If applicable)
- [ ] Session Expiry triggers correctly
- [ ] Session Revocation succeeds in backend
- [ ] Audit Logs record the reveal event

## Vercel (Legacy Fallback)
- [ ] Login completes without errors
- [ ] Delegated Access magic toast appears
- [ ] Credential Autofill (Email correctly detected and filled)
- [ ] Auto-submit correctly triggers
- [ ] Session Expiry triggers correctly
- [ ] Session Revocation succeeds in backend
- [ ] Audit Logs record the reveal event

## GoDaddy (Legacy Fallback)
- [ ] Login completes without errors
- [ ] Delegated Access magic toast appears
- [ ] Credential Autofill (Username correctly detected and filled)
- [ ] Credential Autofill (Password correctly detected and filled)
- [ ] Auto-submit correctly triggers
- [ ] Session Expiry triggers correctly
- [ ] Session Revocation succeeds in backend
- [ ] Audit Logs record the reveal event

## Future Implementations
- [ ] **Gmail OAuth:** Token storage, connection status
- [ ] **OTP Engine:** Interception, Gmail polling, auto-fill of 2FA codes
