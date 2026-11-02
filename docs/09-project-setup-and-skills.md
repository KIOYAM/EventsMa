# 09 — Project Setup and Skills

What was installed on 24 October 2026, why, where it lives, and how it was used for
this design pass. Everything is project-local. Nothing was installed globally and
nothing was written to `C:`.

---

## 1. Disk safety first

`C:` was at 97% (5.3 GB free) when this work started. Every package-manager cache was
redirected into the project before any install:

| Variable | Value |
|---|---|
| `npm_config_cache` | `D:/Kannan-Projects/EventsMa/.cache/npm` |
| `TMPDIR` / `TEMP` / `TMP` | `D:/Kannan-Projects/EventsMa/.cache/tmp` |
| `BUN_INSTALL_CACHE_DIR` | `D:/Kannan-Projects/EventsMa/.cache/bun` |
| `PIP_CACHE_DIR` | `D:/Kannan-Projects/EventsMa/.cache/pip` |

`.npmrc` in the repo pins the npm cache to the project, so future `npm`/`npx` runs do
not silently fall back to `C:\Users\...\AppData`.

**Measured footprint at the end of setup:** `.agents` ≈ 6.4 MB, `.cache` ≈ 11 MB,
all on `D:`.

**Verification**

```bash
du -sh .agents .cache
df -h /d /c          # confirm C: did not change
git status --short   # nothing written outside the project
```

---

## 2. What was installed

Installed with `npx skills add <owner/repo> -s <skill> -y`, which places skills in
`.agents/skills/` with a symlink for Claude-style harnesses. Project scope only.

| Skill | Source | Why it is here | Used in this pass |
|---|---|---|---|
| `graphify` | `graphify-labs/graphify` | Turns the codebase and docs into a queryable knowledge graph; reduces re-reading and surfaces hidden coupling | Method applied by hand in [08](08-knowledge-graph.md): entities, god nodes, communities, cross-doc edges. CLI not run (see §5) |
| `egm-bootstrap` | `google/elephant-goldfish-model` (Apache-2.0) | Sets up the Elephant/Goldfish Model in a repo | Read; no bootstrap needed for a docs-only phase |
| `egm-brainstorm` | same | Multi-lens ideation with adversarial reviewers | Its rules (no flattery, critique first, generate counter-arguments) shaped [03](03-ideation-and-mvp.md) |
| `egm-draft` | same | Turns a brief into an implementation-ready design document | Its structure shaped docs 01–07 and the template in [05 §9](05-engineering-workflow.md) |
| `egm-review` | same | Five-stage review protocol: zoom out, comprehension, critique, intermediate zoom out, readiness | Protocol applied in [reviews/2026-10-24-elephant-self-review.md](reviews/2026-10-24-elephant-self-review.md) |
| `egm-review-loop`, `egm-resolve`, `egm-drift-report` | same | Iterative adversarial review, finding resolution, design-vs-code drift | Reserved for the build phase |
| `supabase` | `supabase/agent-skills` | Correct patterns for Supabase auth, RLS and clients | Informs [04 §3](04-architecture-cost-and-scale.md) |
| `supabase-postgres-best-practices` | same | Index, query and schema review | Informs the performance rules and indexing plan |

**Sources and scale at the time of install:** graphify ~10.9K installs; the EGM plugin
is Google's official open-source release (Apache-2.0, announced 22 October 2026);
Supabase skills 341K and 459K installs. Quality was checked before recommending, per
the `find-skills` guidance: official owners, real install counts, published licences.

---

## 3. The Elephant/Goldfish workflow, as applied

The EGM idea: the **Elephant** is a long, context-rich design session that writes the
design and never writes code. The **Goldfish** are stateless reviewers with no shared
context who attack the design before implementation.

Applied here:

1. **Elephant phase** — read the 647 KB prototype, the research notes and the five
   reverse-engineering guides; produced docs 00–08 with every claim labelled FACT,
   ASSUMPTION, DECISION or OPEN.
2. **Goldfish phase** — the protocol requires fresh-context reviewers. This harness
   exposes only a web-research subagent, which cannot read local files, so the review
   ran as a **structured self-review** with the same three lenses (comprehension,
   critique, implementation readiness). That is weaker than an independent review and
   is recorded as a process gap, not presented as a Goldfish review.
3. **Resolution** — findings were fixed in the documents rather than acknowledged in
   prose. The six material corrections are listed in the review report.

**How to run a real Goldfish review** (Claude Code, Codex or Antigravity, where
`.agents/skills/` is discovered):

```
/egm-review docs/04-architecture-cost-and-scale.md
```

Choose "Consolidated report with all review rubrics". Expect `critic_report.md` and
`implementation_readiness_report.md` in the working directory. Fix findings with
`/egm-resolve`, then re-run once. A second re-audit is capped by the protocol for a
reason: endless review is procrastination.

---

## 4. What was deliberately not installed

| Candidate | Why not |
|---|---|
| **graphify Python runtime** (`pipx install graphifyy`) | `pipx`/`uv` write to the user home on `C:`. The manual graph plus the command in [08 §6](08-knowledge-graph.md) (project-local venv) is enough until code exists |
| **`edc`** | Searches surfaced three unrelated things (Event-Driven Coding-agents, Eclipse Dataspace, Electronic Data Capture). None match an ideation need, and one installs hooks that change agent behaviour. Installing an unknown hook-bearing package into a shared checkout is not a risk worth taking without confirmation |
| **`react-best-practices`** | Useful, but there is no React code yet. Vercel's skill should be installed at the first component milestone, not carried as dead weight |
| **Memory/persistence skills** (`memory-setup`, `goldfish`) | These solve an agent-context problem, not a product problem. The repository documents are the memory |
| **Any MCP server or background daemon** | Nothing in the design needs one yet; each adds a cost line and a failure mode |

**Open item:** if `edc` meant something specific to you, name the source repository and
it can be evaluated and installed in one step.

---

## 5. Keeping skills current

```bash
export npm_config_cache="D:/Kannan-Projects/EventsMa/.cache/npm"
export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"
npx skills list          # what is installed
npx skills update        # project + global update prompt; choose project
```

Rules:

- Review a skill's `SKILL.md` before letting it run. Skills execute with full agent
  permissions.
- Never install with `-g` on this machine; it writes to the user home on `C:`.
- `skills-lock.json` is committed and is the reproducible record. The `.claude/skills`
  symlinks are ignored by git and can be rebuilt with
  `npx skills experimental_install`.
- Update at the start of a milestone, not mid-debugging.
- If a skill's instructions conflict with `AGENTS.md` (for example, it wants to write
  to a home-directory cache), `AGENTS.md` wins.

---

## 6. Repository state after setup

```
EventsMa/
├─ AGENTS.md                     working agreement (read this first)
├─ .npmrc                        cache pinned to the project
├─ .gitignore                    caches, builds, env, generated graphs
├─ .agents/skills/               installed skills (project-local)
│  ├─ graphify/
│  ├─ egm-*/
│  └─ supabase*/
├─ docs/                         design and flows (this folder)
├─ .cache/                       npm/tmp caches, ignored by git
├─ FeastFlow_..._Portal.html     prototype, read-only reference
├─ EVENTSMA_..._research...md    prior research and evidence register
└─ 01–05 reverse-engineering     competitor references, read-only
```

Still missing on purpose: `package.json`, `app/`, `db/`, tests. They arrive in
Phase 1, after the design review and five caterer interviews.
