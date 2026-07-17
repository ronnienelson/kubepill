# Contributing to kubePill

Thanks for helping out. The bar is low and PRs are welcome.

## Adding commands (no code required)

Most contributions should only touch [`src/commands.json`](src/commands.json).

A command entry looks like this:

```json
{
  "cmd": "kubectl rollout",
  "short": "manage rollouts",
  "desc": "One or two sentences on what it does and when you'd reach for it.",
  "examples": [
    { "command": "kubectl rollout status deploy/api", "note": "wait for a rollout to finish" },
    { "command": "kubectl rollout undo deploy/api", "note": "roll back to previous revision" }
  ]
}
```

Style guide for entries:

- **`cmd`** — the command as you'd say it out loud, not the full syntax. `kubectl logs`, not `kubectl logs [POD] [-c CONTAINER]`.
- **`short`** — lowercase, a few words, fits in the right margin of a row. It's a comment, not a title.
- **`desc`** — say *why* someone reaches for it, not just what the docs say. The value here is judgement, not restating `--help`.
- **`examples`** — 2–5, ordered simplest-first. Every example needs a `note` explaining what that particular invocation does. Prefer realistic names (`deploy/api`, `my-pod`) over `<RESOURCE>` placeholders.

If you're adding a whole category, give it a `name` (lowercase, one word) and a `color` from the [gruvbox](https://github.com/morhetz/gruvbox) palette that isn't already in use.

**Please don't** add commands that are destructive-by-default without a note saying so, or vendor-specific commands (EKS/GKE/AKS CLIs) — those belong in a separate category if there's demand.

## Running it locally

```bash
npm install
npx neu update
npm run dev
```

Changes to `commands.json`, `app.js`, or `styles.css` just need an app restart.

## Code changes

Keep it dependency-free. kubePill has no build step and no framework on purpose — it's plain HTML/CSS/JS, and the ~1 MB binary size is a feature. If a change needs a bundler, it probably belongs in a different project.

If you touch the expand/collapse logic, please test the full cycle a few times on a real machine (expand → collapse → type-to-expand → collapse). The window resize ordering is fussy and easy to break; there's a comment in `app.js` explaining why.

## Reporting bugs

Include your OS and version, and a screenshot if it's visual. Rendering bugs in particular tend to be webview-version-specific, so "Windows 11 23H2, WebView2 120" is much more useful than "it looks broken".
