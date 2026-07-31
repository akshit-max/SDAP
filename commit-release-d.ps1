git add packages/db/prisma/schema.prisma packages/types/src/permissions.ts packages/types/src/schemas/auth.ts
git commit -m "feat(db): update schema with models for Integrations, API Keys, and Webhooks"

git add apps/api/src/integrations/core/ apps/api/src/integrations/integrations.service.ts apps/api/src/integrations/integrations.controller.ts apps/api/src/integrations/integrations.module.ts apps/api/src/integrations/integrations.dto.ts
git commit -m "feat(api): implement generic Integration Framework and registry"

git add apps/api/src/integrations/vercel/ apps/api/src/integrations/github/ apps/api/src/integrations/godaddy/
git commit -m "feat(api): add Vercel, GitHub, and GoDaddy integration adapters"

git add apps/api/src/api-keys/ apps/api/src/common/guards/api-key.guard.ts
git commit -m "feat(api): implement API Keys service and guard for programmatic access"

git add apps/api/src/webhooks/
git commit -m "feat(api): implement Webhooks service for event fan-out"

git add apps/api/src/programmatic/
git commit -m "feat(api): implement Programmatic API for CI/CD secret retrieval"

git add apps/extension/
git commit -m "feat(extension): implement MV3 browser extension for credential autofill"

git add apps/web/app/settings/integrations/ apps/web/app/settings/api-keys/ apps/web/hooks/useIntegrations.ts apps/web/lib/api/integrations.ts apps/web/lib/api/api-keys.ts apps/web/components/common/ConfirmModal.tsx apps/web/components/common/PromptModal.tsx
git commit -m "feat(web): build frontend UI and hooks for Integrations & API Keys"

git add apps/api/src/main.ts apps/web/next.config.js apps/web/middleware.ts
git commit -m "chore(security): harden Next.js CSP and API Helmet configurations"

git add .
git commit -m "chore: update dependencies, app modules, and configuration for Release D"

git push personal main
