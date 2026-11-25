# Incident Evidence & Forensic Record — XTREME Admin Web Security Audit

**Incident Reference:** INC-20261124-ADMIN-SUPPLY-CHAIN  
**Date:** 2026-11-25  
**Repository:** `https://github.com/mridha-rakib/xtreme-admin-web.git`  
**Working Directory:** `C:\Users\rakib_bro\sta-projects\xtream\xtreme-admin-web`  

---

## 1. Suspicious Commit Identifiers & Metadata

### Suspicious Commit 1 (Batch 4 Impersonation)
- **Commit SHA:** `d1f312ffbccee2a02d917317f628586ca80531f7`
- **Parent SHA:** `86a8398d4edb8df8aaf23bb40002fdf8fb294eb5` (Batch 3 baseline)
- **Author:** `Rakib Mahmud Mridha <rakibmahmudmridha@gmail.com>`
- **Author Date:** `Tue Nov 24 16:53:48 2026 +0600`
- **Commit Date:** `Tue Nov 24 10:53:49 2026 +0000`
- **Commit Message:** `feat(admin): implement concierge requests and conversation management (Batch 4)`
- **Verification:** Unsigned (`verification.verified: false`, `signature: null`)
- **Push Event ID:** `28182574230` at `2026-11-24T14:29:09Z` by `mridha-rakib`
- **Associated CI Run:** `45379114696` at `2026-11-24T10:53:58Z` (Failed at `pnpm/action-setup@v4`)

### Suspicious Commit 2 (Batch 5 Impersonation & Re-injection)
- **Commit SHA:** `c66f6353f808bdff1b7c02f303a1818d1e7edde6`
- **Parent SHA:** `375bab45f67c775e2a299abd4a7c9d854268fd6e` (Trusted Batch 4 baseline)
- **Author:** `Rakib Mahmud Mridha <rakibmahmudmridha@gmail.com>`
- **Author Date:** `Tue Nov 24 21:51:07 2026 +0600`
- **Commit Date:** `Tue Nov 24 15:51:08 2026 +0000`
- **Commit Message:** `feat(admin): implement vendor organization management and scoped staff workspace`
- **Verification:** Unsigned (`verification.verified: false`, `signature: null`)
- **Pushed At:** `2026-11-24T17:56:51Z` (via forced update to `refs/heads/main`)
- **Associated CI Run:** `45454123399` at `2026-11-24T17:56:51Z` (Failed at `pnpm/action-setup@v4`)

---

## 2. Injected File Inventory & Payload Analysis

| File Path | Injected Modification | Forensic Finding |
|---|---|---|
| `init` | New file created (33 lines Node.js scaffolding + 72 KB single-line obfuscated JS string) | Obfuscated payload that registers a dynamic decryptor and executes `eval`-style runtime injection on startup. |
| `package.json` | Modified `scripts`: `"dev": "node init && next dev"`, `"build": "node init && next build"`, `"start": "node init && next start"` | Attempts to hook application execution and build cycles to trigger `init`. |
| `postcss.config.mjs` | Appended ~34 KB of identical obfuscated JS payload | Secondary execution vector during CSS processing if Next.js invokes PostCSS. |
| `.gitignore` | Removed `.env` and `.env.local` ignore patterns; added `config.bat` | Attempted exfiltration vector to permit uncommitted environment files to be tracked in git, while hiding Windows batch scripts. |

---

## 3. Local Execution & Exposure Findings

- **Local Git Reflog:** Confirmed local HEAD never checked out `d1f312f` or `c66f635`. Local history moved cleanly from `375bab4` to `7268a36`.
- **Filesystem Audit:** Neither `init` nor `config.bat` ever existed on the developer workstation.
- **Local Commands Executed:** All test, lint, and build executions ran strictly against the clean working tree of `7268a36` (derived from trusted `375bab4`).
- **Local Environment Secrets:** `.env` contains strictly 3 public mock configuration values (`NEXT_PUBLIC_APP_ENV=development`, `NEXT_PUBLIC_ENABLE_MOCK_PERSONAS=true`, `NEXT_PUBLIC_DEFAULT_ROLE=SUPER_ADMIN`). No real database, API, or third-party secrets were stored.

---

## 4. GitHub Actions Execution Findings

- Both CI runs for the suspicious commits failed during the GitHub Action setup step:
  - Run `45379114696`: `pnpm: onlyBuiltDependencies?.sort is not a function at getOutdatedLockfileSetting`
  - Run `45454123399`: `pnpm: onlyBuiltDependencies?.sort is not a function at getOutdatedLockfileSetting`
- Because the action failed before dependencies were installed and before `pnpm build` was invoked, the malicious `init` script was never executed on GitHub Actions hosted runners.

---

## 5. Other XTREME Repositories Inspection (Read-Only)

- **Repository Inspected:** `https://github.com/mridha-rakib/xtreme-mobile-app`
- **Latest Remote Commit:** `447dfae08d7d6e5ba23581a2f03403d15f0ea3fe` (`Revert "chore(admin): initialize command center web project foundation"` at `2026-11-24T08:12:46Z`)
- **Inspection Findings:** Zero commits after 2026-11-24T08:12:46Z. No unexpected commits, no obfuscated scripts, no `init` file, no modifications to package lifecycle scripts. Completely clean.
