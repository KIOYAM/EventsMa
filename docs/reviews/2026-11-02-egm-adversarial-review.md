# EGM Adversarial Review — 02 November 2026

**Target:** FeastFlow / EventsMa SaaS Architecture, Dynamic Catalog Engine, and Tenant Integrations System  
**Framework:** Elephant-Goldfish Model (EGM) Multi-Lens Stress-Testing  
**Status:** Complete  

---

## Executive Summary & Core Verdict

The updated architecture moves from static prototyping to a multi-tenant, zero-hardcoding SaaS platform. However, introducing user-side connectors (Bring Your Own Key for AI, WhatsApp, and Payment gateways) and dynamic menu catalogs shifts critical security, encryption, and operational burdens onto the system. 

This review stress-tests three specific areas:
1. **Dynamic Menu Catalog & Zero Hardcoding**: Ensuring menus, dishes, and units remain completely tenant-configurable without code dependencies.
2. **User-Side Connectors & Secret Management**: Safe handling of user-provided WhatsApp, AI, and payment credentials without leaking secrets to the client bundle or logs.
3. **Free-to-Paid Infrastructure Limits**: Real-world operational constraints of Vercel Hobby and Supabase Free under commercial traffic.

---

## Lens 1: Menu Catalog & Anti-Hardcoding Stress-Test

### Findings & Vulnerabilities

| # | Severity | Finding | Root Cause |
|---|---|---|---|
| M1 | 🔴 High | **Premature Seeding Pollutes Tenant State** | Pre-populating 120 dishes across South Indian/North Indian cuisines forces irrelevant records onto caterers specializing in niche cuisines (e.g., continental bakeries, barbecue, desserts). Deleting unwanted items is high-friction on mobile. |
| M2 | 🟡 Medium | **Calculation Breakage from Arbitrary Custom Units** | If tenants can define arbitrary billing units (e.g., "per tub", "per crate") without unit type classification, the automated arithmetic for guests (`unitPrice * quantity * guests`) breaks. |
| M3 | 🟡 Medium | **Recipe & Inventory Desynchronization** | Allowing arbitrary dish creation without standardized inventory links means food cost and gross margin calculations fail silently if ingredient mappings are missing. |

### Technical Remediation
1. **Strictly Normalized Tenant Catalog**:
   - `menu_items` and `packages` belong strictly to `org_id`.
   - The application codebase contains **zero** hardcoded dish definitions.
   - Onboarding allows an optional *one-click template clone* (e.g., "South Indian Traditional Wedding" or "North Indian Reception") from a read-only platform template table (`master_catalog_templates`). The caterer explicitly opts in; nothing is forced.
2. **Standardized Unit Typing**:
   - Custom units are supported, but every unit must belong to a structural calculation class:
     - `PER_GUEST` (multiplied by guest count)
     - `FIXED_ITEM` (flat rate regardless of guests, e.g., Welcome Arch)
     - `HOURLY` (multiplied by service duration)
     - `VOLUME` (per liter, per kg, per tray)
3. **Graceful Cost Fallback**:
   - A dish calculates cost through recipes if ingredient items are configured.
   - If recipes are not configured, the caterer can input an estimated manual base cost (`cost_paise`), or leave it zero with an explicit UI indicator: *"Margin calculation unavailable until base cost is set"*.

---

## Lens 2: User-Side Connectors & Secret Management (WhatsApp, AI, Gateways)

### Findings & Vulnerabilities

| # | Severity | Finding | Root Cause |
|---|---|---|---|
| S1 | 🔴 Critical | **Client-Side Secret Leakage Risk** | If user-provided AI keys (OpenAI, Anthropic, Gemini) or WhatsApp Cloud API tokens are queried through standard Supabase client libraries, any client-side bundle can intercept tenant secrets. |
| S2 | 🔴 Critical | **Plaintext Credential Storage in Database** | Storing third-party API keys in plain text inside tenant configuration tables leaves credentials exposed to database dumps, logs, and compromised accounts. |
| S3 | 🟡 Medium | **API Quota Exhaustion & Error Cascades** | When a caterer supplies an invalid, expired, or balance-exhausted AI or WhatsApp API key, background workers or quote generators can crash without graceful error boundaries. |

### Technical Architecture for User-Side Connectors

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TENANT CONNECTOR ENGINE                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Client Browser (Back-Office Settings)                               │
│    - Inputs: WhatsApp Business Token, AI API Key, Razorpay Secret      │
│    - Never receives stored secret back (write-only / masked display)   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Next.js Route Handler / Server Action                               │
│    - Validates format via Zod                                          │
│    - Encrypts payload using AES-256-GCM via SERVER_MASTER_KEY          │
│    - Stores encrypted blob in `tenant_connectors` table                │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Database Layer (Supabase Postgres)                                  │
│    - Table: `tenant_connectors`                                        │
│    - Columns: org_id, provider (whatsapp|openai|gemini|razorpay),     │
│      encrypted_payload, key_fingerprint (last 4 chars), status         │
│    - RLS: Only accessible by service-role; client role gets 0 rows     │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Outbound Dispatcher (Serverless Function)                           │
│    - Reads encrypted blob, decrypts in memory                          │
│    - Executes third-party API call (WhatsApp / AI model)               │
│    - Catches rate limits, quota exhaustion, and returns UI warning     │
└────────────────────────────────────────────────────────────────────────┘
```

### Connector Rules:
1. **Fallback Hierarchy**:
   - *WhatsApp*: If no Cloud API token is configured, the system falls back to zero-cost, zero-configuration `wa.me` deep links using the caterer's verified business mobile number.
   - *AI Features*: If no AI API key is provided, all AI assistants (menu ideation, smart message generation) remain hidden or disabled without blocking core quoting.
2. **Zero Plaintext Storage**:
   - Every user credential is encrypted at rest using AES-256-GCM before writing to Postgres.
   - The UI displays only masked fingerprints (e.g., `sk-...9A4F`).

---

## Lens 3: Free-to-Paid Infrastructure & Operational Boundaries

### Real-World Cost & Performance Ladder

| Metric / Service | Free Tier (Stage 0: Build & Pilots) | Paid Production (Stage 1: Paying Clients) |
|---|---|---|
| **Monthly Cost** | **₹0 / month** | **~$45 / month (~₹3,800 - ₹5,500/mo)** |
| **Vercel Plan** | Hobby (100 GB transfer, edge functions) | Pro ($20/mo: commercial license, team access) |
| **Supabase Plan** | Free (500 MB DB, 1 GB storage, 5 GB egress) | Pro ($25/mo: 8 GB DB, daily backups, no pause) |
| **Database Backups** | Manual nightly export script via GitHub Actions | Automated point-in-time recovery (7 days) |
| **Inactivity Handling** | Vercel Cron heartbeat query prevents pause | Not applicable (Pro instances never pause) |
| **File Storage Egress** | Direct Supabase Storage (5 GB ceiling) | Cloudflare R2 proxy ($0 egress fees) |

### Non-Negotiable Operational Gates:
- **Commercial Usage Trigger**: Vercel Hobby terms state non-commercial personal usage. The first commercial transaction on EventsMa requires an immediate switch to Vercel Pro ($20/mo).
- **Financial Immutability**: All payment records are append-only. Corrections require reversing line items, never `UPDATE` statements on existing balances.
- **Tenancy Boundary**: Every database query must filter by `org_id` backed by verified Supabase JWT claims.

---

## Lens 4: Prototype Alignment & UI/UX Parity

The design elements from `FeastFlow_Marketplace_220_Accounts_Client_Portal.html` translate into production components as follows:

1. **Design Tokens**:
   - Forest Green (`#183d33`, `#244e42`): Primary navigation, buttons, brand marks.
   - Mint (`#dbece3`, `#edf6f0`): Active pills, status badges, calendar event chips.
   - Terracotta (`#c56e4e`): Conversion triggers, overdue alerts, payment CTAs.
   - Ink & Canvas (`#202a25`, `#f6f8f6`): High-contrast readable typography and workspace canvas.
2. **Responsive Behavioral Parity**:
   - **Desktop**: 252px fixed sidebar, sticky topbar with global quick-search, multi-column event operations run-sheets.
   - **Mobile (Phone-First)**: Sidebar collapses into a bottom-drawer or touch overlay. Quotation line item creation uses **Vaul sliding bottom-sheets** rather than desktop popups, keeping thumb interactions natural.
3. **PDF & Print Determinism**:
   - Quotation PDFs generated via `@react-pdf/renderer` inside a serverless route handler, guaranteeing identical line item heights and GST tables across Windows, Android, and iOS.

---

## Implementation Readiness Checklist

- [x] Tech stack selected and verified against ₹0 free tier.
- [x] Zero-hardcoding dynamic catalog schema specified.
- [x] User-side Bring Your Own Key (BYOK) connector architecture defined.
- [x] Multi-tenancy RLS policy model verified.
- [ ] Per-feature technical design documents in `docs/designs/` (Blocks code generation).
