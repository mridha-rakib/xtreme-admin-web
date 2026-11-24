# XTREME Concierge MVP — Admin Web Command Center

Independent Admin Web Command Center application built with Next.js App Router, Tailwind CSS, TypeScript strict mode, Biome, Vitest, and Playwright.

## Authoritative Design Reference
- **Figma File**: `aiQY8SMEt3PTWfZn7js7l1`
- **Section**: `05_Command_Center` (Canvas `3:2`)

## Architecture Principles
1. **Completely Independent Application**: Sibling to mobile apps, no shared packages or dependencies.
2. **Strict Zero-Reuse Policy**: Independent native web components, tokens, styles, types, and mock services.
3. **Role-Based Access Control**: Fail-closed RBAC with explicit persona switching (`SUPER_ADMIN`, `ADMIN`, `CONCIERGE`, `VENDOR`).
4. **Scope Restriction**: Foundation setup completed. Business screens (0/64) are implemented in subsequent batches (Phase 4.1+).

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Quality & Verification
pnpm check       # Biome formatting and lint check
pnpm format      # Biome formatting auto-fix
pnpm typecheck   # TypeScript check
pnpm test        # Vitest unit & integration tests
pnpm build       # Next.js production build
pnpm test:e2e    # Playwright end-to-end tests
```
