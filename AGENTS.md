# AGENTS.md — Working agreement for this repository

Read this before changing anything. It is short on purpose.

## 1. Where we are

Design phase. There is **no application code yet**. The HTML file at the repo root is a
clickable prototype kept for reference only; never edit it to add features and never
treat it as the codebase.

- Design and decisions: [`docs/`](docs/README.md) — start with the index
- Next step: Phase 0 validation, then MVP-1 (see [docs/07](docs/07-roadmap-metrics-risks.md))

## 2. Hard constraint: do not use the C: drive

The machine's `C:` drive is ~97% full. Everything must stay on
`D:\Kannan-Projects\EventsMa`.

Before running any installer, package manager, or build:

```bash
export npm_config_cache="D:/Kannan-Projects/EventsMa/.cache/npm"
export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"
export TEMP="$TMPDIR"
export TMP="$TMPDIR"
export BUN_INSTALL_CACHE_DIR="D:/Kannan-Projects/EventsMa/.cache/bun"
export PIP_CACHE_DIR="D:/Kannan-Projects/EventsMa/.cache/pip"
mkdir -p .cache/npm .cache/tmp .cache/bun .cache/pip
```

- `.npmrc` in this repo already points the npm cache into the project.
- **No Docker.** Docker Desktop stores images on `C:`. Development uses a cloud
  Supabase project or branch.
- No global installs (`npm i -g`, `pipx install`, `uv tool install`). Project-local
  only.
- Download large artifacts into `.cache/`, never into the home directory.
- If a tool insists on writing to `C:`, stop and choose another tool.

## 3. Stack (decided, see ADR-002)

Next.js App Router + TypeScript, Tailwind + shadcn/ui, Supabase Postgres/Auth/Storage
(Mumbai), Drizzle ORM + SQL migrations, Resend, Vercel. Full reasoning and the
cost/scale limits: [docs/04](docs/04-architecture-cost-and-scale.md).

**Payments are manual by product decision.** The app stores each business's bank/UPI
instructions, shows them on the public quote, and records receipts by hand. There is no
gateway onboarding, pay-now flow, webhook or online collection in the MVP. Do not add a
payment-gateway dependency without a new ADR.

Do not add a dependency, service or framework without a line in that document
explaining its free-tier limit and the trigger that would make it paid.

## 4. How work flows

1. **Design first.** Any feature larger than a bug fix gets `docs/designs/<slug>.md`
   using the template in [docs/05 §9](docs/05-engineering-workflow.md). No code in this
   phase.
2. **Review with fresh eyes.** Use the installed `egm-review` / Goldfish pattern for
   anything touching money, auth, tenancy, deletion or migrations. A review in the same
   context is not a review.
3. **One vertical slice per PR.** Schema + policy + API + UI + tests together.
4. **Verify, then claim.** Types, lint, unit, RLS isolation, e2e on preview, and a real
   phone. A build passing is not evidence the feature works.

## 5. Non-negotiables

- `org_id` on every tenant table; RLS enabled; the two-tenant test must pass.
- Money in integer paise; totals computed on the server; client totals are previews.
- Sent quotations are immutable; edits create versions.
- Payments are append-only; corrections are reversing entries.
- No secrets in the client bundle, in git, or in logs.
- No fake data in production. Demo mode is labelled and separate.
- No marketing claim that the product does not implement. Phase 1 does not promise
  leads.
- Small files. Nothing over 400 lines. No 6,000-character lines.

## 6. Skills available in this repo

Installed under `.agents/skills/`:

| Skill | Use |
|---|---|
| `graphify` | Map the codebase into a queryable knowledge graph; consult it before large changes |
| `egm-brainstorm`, `egm-draft`, `egm-review`, `egm-review-loop`, `egm-resolve`, `egm-drift-report` | Elephant/Goldfish design and adversarial review |
| `supabase`, `supabase-postgres-best-practices` | Schema, RLS and query review |

Deferred until the first React component exists: `vercel-labs/agent-skills@react-best-practices`.
See [docs/09](docs/09-project-setup-and-skills.md) for the install record and the rules for
adding more (project scope only, never `-g`).

Read the relevant `SKILL.md` before use. Keep their resources next to the skill; do not
copy chunks into the app.

## 7. Useful commands (once the app exists)

```bash
npm run dev            # local app
npm run test           # unit + integration
npm run test:rls       # tenant isolation
npm run test:e2e       # Playwright
npm run db:migrate     # forward-only migrations
npm run lint && npm run typecheck
```

## 8. Always-on UI/UX skills (every tool)

Nine design-system playbooks live project-local under `.agents/skills/` and are committed
in `skills-lock.json`:

| Skill | Always on | What it forces |
|---|---|---|
| `impeccable-ui` | yes | `/craft`, `/polish`, `/typeset`, `/arrange`, `/audit`; tokens before values; blocks generic AI anti-patterns |
| `ui-ux-pro-max` | yes | Complete design system (style / palette / pairing) chosen before any UI code |
| `ui-skills-collection` | yes | Hard boundaries: 8px spacing, WCAG AA contrast, 44×44px touch targets |
| `vercel-ui-verification` | yes | Self-audit: keyboard nav, contrast, breakpoints, layout shift — before any UI task is "done" |
| `taste-hallmark` | no | Editorial layouts for landing / creative pages only |
| `diagram-design`, `algorithmic-canvas`, `motion-gsap`, `image-generation` | no | SVG/generative assets, micro-interactions, generated hero visuals — on demand |

**Make them run every time.** Each tool's global config (lives under your user profile on
`C:` — see the C: constraint in §2, so you paste this yourself, I do not write it) should
load `impeccable-ui` + `ui-ux-pro-max` before every UI/front-end prompt:

- OpenCode: add a global instruction at `~/.config/opencode/AGENTS.md` telling the agent to
  always load `impeccable-ui` and `ui-ux-pro-max` before generating UI; install the skill
  files into `~/.config/opencode/skills/`.
- Google Antigravity: `npx agentic-awesome-skills --antigravity`; enable auto-discovery in
  your global `.agent/` rules; skills go in `~/.gemini/config/skills/`.
- Gemini CLI: place `SKILL.md` folders inside `~/.gemini/skills/` and reference them in your
  root `GEMINI.md` system prompt.
- Kiro (IDE & CLI): place skill files under `~/.kiro/skills/` or `~/.kiro/steering/`;
  Kiro treats those as always-on rulesets for frontend builds.

Everything these tools generate (caches, assets, configs) must still stay on `D:` —
`AGENTS.md` §2 wins if a skill wants to write to a home-directory cache.

## 9. Definition of done

See [docs/05 §6](docs/05-engineering-workflow.md). Short version: designed, reviewed,
tested, measured, documented, reversible.
