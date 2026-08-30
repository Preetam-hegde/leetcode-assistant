# LeetSensei Global Learning Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the LeetSensei side panel into a guided, language-aware learning workspace for a broad international audience.

**Architecture:** Keep the current Chrome MV3 side-panel entry point and AI provider flow. Replace the equal action grid with an ordered learning flow, store three learner preferences in `chrome.storage.sync`, and append those preferences to existing prompt builders through one small context helper.

**Tech Stack:** Chrome Extension Manifest V3, vanilla HTML/CSS/ES modules, Chrome Storage API, existing markdown and provider utilities.

**Spec:** `docs/superpowers/specs/2026-08-30-leetsensei-global-redesign-design.md`

## Global Constraints

- Preserve the existing AI request and storage behavior wherever possible.
- Keep API/provider/model configuration in the existing popup and settings flow.
- Do not add backend services, accounts, telemetry, subscriptions, or new dependencies.
- Keep the UI English; the language control supplies response context rather than full UI localization.
- Preserve the existing missing-API-key settings path.

---

### Task 1: Add learner-context prompt support

**Files:**
- Modify: `src/utils/prompts.js`
- Modify: `src/sidepanel/sidepanel.js`
- Test: `src/utils/prompts.test.js` (create only if the repository has no existing JS test convention)

**Interfaces:**
- Produces `buildLearnerContext({ explanationLanguage, codeLanguage, level })`, returning a short prompt suffix.
- `executeAiStream` accepts the existing `{ title, promptText }` shape; callers pass `promptText + buildLearnerContext(preferences)`.

- [ ] **Step 1: Inspect existing prompt exports and test tooling**

Run:

```bash
sed -n '1,280p' src/utils/prompts.js
find . -maxdepth 2 -type f \( -name 'package.json' -o -name '*test*' \) -print
```

Expected: confirm whether a test runner already exists before adding a test file.

- [ ] **Step 2: Add the smallest context helper**

Implement a pure function with defaults:

```js
export function buildLearnerContext({
  explanationLanguage = 'English',
  codeLanguage = 'Python 3',
  level = 'Balanced'
} = {}) {
  return `\n\nLearner preferences: explain in ${explanationLanguage}; use ${codeLanguage} when code is requested; target a ${level.toLowerCase()} learner.`;
}
```

- [ ] **Step 3: Apply the helper at the shared request boundary**

Load the preferences once in `sidepanel.js`, then append the suffix in `executeAiStream` so button actions and chat use the same context.

- [ ] **Step 4: Run the smallest available check**

Run the repository’s existing test command if present; otherwise run:

```bash
node --check src/sidepanel/sidepanel.js
node --check src/utils/prompts.js
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/prompts.js src/sidepanel/sidepanel.js src/utils/prompts.test.js
git commit -m "feat: add learner context to LeetSensei prompts"
```

### Task 2: Replace the side-panel action grid with the learning workspace

**Files:**
- Modify: `src/sidepanel/sidepanel.html`
- Modify: `src/sidepanel/sidepanel.css`
- Modify: `src/sidepanel/sidepanel.js`

**Interfaces:**
- Existing action dispatch remains data-driven through `data-action` values.
- New controls use IDs `explanationLanguage`, `codeLanguage`, and `learnerLevel`.
- New learning actions map to existing prompt actions: `understand → reframe_description`, `hint → hints`, `try → review_code`, `review → step_explanation`, `solution → best_solution`.

- [ ] **Step 1: Replace the equal action cards with five ordered actions**

Use semantic buttons with visible step numbers and concise copy. Keep the existing problem banner, response area, loading state, chat input, and settings notice.

- [ ] **Step 2: Add compact learner controls below the problem context**

Add native `<select>` controls with these values:

```html
<select id="explanationLanguage">
  <option>English</option><option>Spanish</option><option>Hindi</option>
  <option>French</option><option>German</option><option>Portuguese</option>
  <option>Japanese</option><option>Chinese</option>
</select>
<select id="codeLanguage">
  <option>Python 3</option><option>JavaScript</option><option>Java</option>
  <option>C++</option><option>Go</option><option>TypeScript</option>
</select>
<select id="learnerLevel">
  <option>Beginner</option><option selected>Balanced</option><option>Interview-ready</option>
</select>
```

- [ ] **Step 3: Restyle the panel around one primary workspace**

Use the current color variables and native CSS only. Remove the dense two-column card treatment, give the active problem and next step stronger hierarchy, preserve visible focus outlines, and add a narrow-width media rule so labels and controls do not overflow.

- [ ] **Step 4: Wire action mapping and preference persistence**

On load, read `leetsensei_preferences` from `chrome.storage.sync`, merge defaults, set the selects, and save on change. Map each new button to the existing `handleAiAction` switch without duplicating prompt logic.

- [ ] **Step 5: Run syntax and manifest checks**

```bash
node --check src/sidepanel/sidepanel.js
node --check src/utils/prompts.js
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('manifest.json')); for (const p of [m.side_panel.default_path,m.action.default_popup,m.background.service_worker,...m.content_scripts.flatMap(x=>x.js),...m.content_scripts.flatMap(x=>x.css)]) if(!fs.existsSync(p)) throw new Error(p); console.log('manifest paths ok')"
```

- [ ] **Step 6: Commit**

```bash
git add src/sidepanel/sidepanel.html src/sidepanel/sidepanel.css src/sidepanel/sidepanel.js
git commit -m "feat: redesign LeetSensei learning workspace"
```

### Task 3: Verify the finished extension surface

**Files:**
- Inspect: `src/sidepanel/sidepanel.html`
- Inspect: `src/sidepanel/sidepanel.css`
- Inspect: `manifest.json`

- [ ] **Step 1: Check the final diff and repository status**

```bash
git diff HEAD~2..HEAD --stat
git status --short
```

Expected: only the spec/plan and requested side-panel/prompt files are changed; no secrets or generated files appear.

- [ ] **Step 2: Manually load the unpacked extension**

In Chrome, load `/Users/prhehegd/Documents/Workspace/GITHUB/extension/leetcode-assistant`, open a LeetCode problem, open the side panel, and verify: problem detection, all five learning actions, preference persistence, missing-key settings link, chat, keyboard focus, and narrow-panel layout.

- [ ] **Step 3: Record any boundary that cannot be verified locally**

If no API key/provider is available, verify UI state and request construction without claiming a live AI response works.
