# Always-on UI/UX routing for OpenCode, Antigravity, Gemini CLI and Kiro

Paste this into each tool's GLOBAL config (user profile). These files live on `D:` and
must never be copied into `C:`; the target folders below are the tool defaults under your
user profile, so you create them and paste this text in.

Why: skills normally run only on slash-command or mention. These rules force the design
system to load automatically on every front-end / UI prompt, across all four tools.

---

## 1. OpenCode — ~/.config/opencode/AGENTS.md  (global instruction file)

```
# Always-on UI/UX skills — OpenCode global instruction

Before generating any UI / front-end / component code, load and run:
  - impeccable-ui  (/craft, /polish, /typeset, /arrange, /audit)
  - ui-ux-pro-max  (complete design system chosen before code)
  - ui-skills-collection (8px spacing, WCAG AA contrast, 44x44px touch targets)
  - vercel-ui-verification (keyboard, contrast, breakpoints, layout-shift audit)

These are the repository skills in .agents/skills/ of the project. Apply them on every
UI prompt, not just slash commands. Disk rule: nothing writes to C:\ — all caches,
assets and configs stay under D:\Kannan-Projects\EventsMa\.cache\.
```

Skill files to place in `~/.config/opencode/skills/`:
- copy `.agents/skills/impeccable-ui/SKILL.md`
- copy `.agents/skills/ui-ux-pro-max/SKILL.md`

---

## 2. Google Antigravity — ~/.gemini/config/skills/ + global .agent/ rules

```
npx agentic-awesome-skills --antigravity
```
Enable auto-discovery in your global `.agent/` rules so impeccable-ui and ui-ux-pro-max
load on every session. Skill files go in `~/.gemini/config/skills/`.

---

## 3. Gemini CLI — ~/.gemini/skills/ + GEMINI.md system prompt

Place each `SKILL.md` folder inside `~/.gemini/skills/`:
- impeccable-ui/
- ui-ux-pro-max/
- ui-skills-collection/
- vercel-ui-verification/

Then in your root `GEMINI.md` system prompt add:

```
Always load impeccable-ui and ui-ux-pro-max before any front-end / UI work. Apply
ui-skills-collection boundaries and run vercel-ui-verification before marking any screen
done.
```

---

## 4. Kiro (IDE & CLI) — ~/.kiro/skills/ or ~/.kiro/steering/

Copy the same skill folders into `~/.kiro/skills/` (or `~/.kiro/steering/`). Kiro
automatically treats files inside those folders as always-on rulesets whenever you ask it
to build frontend components.

---

## Disk constraint (non-negotiable)

C: is ~97% full. All caches and generated artifacts stay on `D:\`:
- npm cache: `D:/Kannan-Projects/EventsMa/.cache/npm` (pinned in `.npmrc`)
- TMPDIR/TEMP/TMP: `D:/Kannan-Projects/EventsMa/.cache/tmp`

If any installer or skill tries to write to `C:\Users\...`, stop and redirect it to the
`.cache/` folders above. `AGENTS.md` §2 wins over any skill instruction.
