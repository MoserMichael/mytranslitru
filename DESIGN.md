# Russian Transliteration Web Page: System Design Blueprint

## Context
On a laptop with a Latin-only keyboard there's no easy way to type Cyrillic. This page lets the user type Russian with the English layout. The text turns into Cyrillic as they type, and a Russian spell checker runs alongside. Everything happens in the browser: once the page loads it makes no requests to other servers, and it shows no ads. The repo (`/mnt/c/Users/michael.moser/mystuff/trn`) is empty, so this is a new project.

## Tech stack
- **React 18 + TypeScript + Vite 2.9** (static build; the output in `dist/` can be opened from any static host or from a local server). Node is needed only to build, never to run the page. Vite 2.9 is used because it still supports the Node 12 installed here.
- **nspell** (Hunspell-compatible spell checking in JS) and **dictionary-ru** (Russian `.aff`/`.dic`)
- No backend, no analytics, no CDN fonts or scripts. All assets, including the dictionary files, ship from the same origin. A strict CSP `<meta>` (`default-src 'self'`) enforces this.

## Page layout
```
┌──────────────────────────────────────────────────────────┐
│ Header: title · [Translit ON/OFF] (Ctrl+Space) · Copy     │
├──────────────────────────────────────────────────────────┤
│ UPPER: Transliteration rules table (collapsible)          │
│  Cyrillic | Latin | Notes/examples   (33 letters + rules) │
├──────────────────────────────────────────────────────────┤
│ LOWER: Multiline editor                                    │
│  textarea + highlight overlay (red underline on errors)    │
│  click a misspelled word → suggestions popover             │
│ Status bar: spell checker loading/ready · word count       │
└──────────────────────────────────────────────────────────┘
```

## Modules
```
src/
  main.tsx, App.tsx
  translit/rules.ts        // single source of truth: data for the table AND the input engine
  translit/engine.ts       // pure functions: applyKey(text, caret, key) → {text, caret}
  translit/engine.test.ts  // unit tests (esbuild + node assert; Vitest needs Node 14+)
  components/RulesTable.tsx
  components/Editor.tsx    // textarea + overlay + keyboard interception
  components/SuggestionPopover.tsx
  spell/spell.worker.ts    // loads dictionary, runs nspell off the main thread
  spell/useSpellChecker.ts // React hook: postMessage API, debounced checks
```

## 1. Rules section (upper)
Mirrors the Wikipedia "Romanization of Russian, Full rules" table: А–Я with their Latin equivalents (a, b, v, g, d, e/ye, yo, zh, z, i, y, k, l, m, n, o, p, r, s, t, u, f, kh, ts, ch, sh, shch, ʺ, y, ʹ, e, yu, ya), plus the special notes (e → *ye* at the start of a word and after vowels/ъ/ь, the -ий/-ый endings, and so on). The table is generated from `rules.ts`, so what's displayed and what the input engine does can't drift apart. The table is static content bundled with the app, not fetched from Wikipedia.

## 2. Transliteration engine
Wikipedia's romanization is lossy in reverse: е and э both map to *e*, й and ы both map to *y*, and ь/ъ are often dropped. So the input engine follows the Wikipedia scheme and adds a few unambiguous keys for those cases. The table marks which keys are input-only.

**How it works.** The editor intercepts printable keys (`onKeyDown` / `beforeinput`) while translit is ON. Each Latin key either inserts a Cyrillic letter or *recomposes* the letter(s) just before the caret. It follows the same approach as translit.ru-style tools, so no hidden buffer is needed:

| Typed | Result | Mechanism |
|---|---|---|
| a b v g d e z i k l m n o p r s t u f | а б в г д е з и к л м н о п р с т у ф | direct |
| y | ы after a consonant, otherwise й | context |
| z+h, k+h, c+h, s+h | ж, х, ч, ш | recompose previous char |
| t+s | ц | recompose (т+с → ц) |
| ш+c+h (shch) | щ | recompose шч → щ |
| y+a / y+u / y+o / y+e | я / ю / ё / е | recompose й/ы + vowel |
| e+h (input-only) | э | recompose |
| ' / " | ь / ъ | direct (Wikipedia's ʹ ʺ) |
| `` ` `` (backtick, input-only) | separator that blocks the next recomposition, e.g. `t`s` → тс (отсюда) | consumed |

- Capitals are preserved (`Sh` → Ш, `SH` → Ш).
- Digits, punctuation, Enter, Backspace, paste, and IME input pass through untouched. Pasted Latin text stays Latin; a "Convert selection" button transliterates it explicitly.
- Ctrl+Space toggles translit off so the user can type Latin words.
- The engine is a pure function, which makes it fully unit-testable. Undo works through `document.execCommand('insertText')` / `setRangeText`, so the browser's native undo stack keeps working.

## 3. Spell checker
- **Loading:** Vite imports `dictionary-ru/index.aff?url` and `index.dic?url` as same-origin static assets. A **Web Worker** fetches them and builds `nspell(aff, dic)`. The Russian dictionary is several MB and slow to initialize, so it must not block typing. The status bar shows "Loading dictionary…" until it's ready.
- **Checking:** text changes are debounced (~300 ms) and sent to the worker. The worker tokenizes Cyrillic words (`/[а-яё]+(-[а-яё]+)*/gi`), runs `spell.correct()`, and returns misspelled ranges. Results are cached per word.
- **Display:** a `<div>` behind a transparent-background `<textarea>`, with the same font, padding, and scroll sync, renders `<mark>` underlines at the misspelled ranges. The native `spellcheck` attribute is set to `false`.
- **Suggestions:** clicking (or right-clicking) a misspelled word asks the worker for `spell.suggest(word)`, computed lazily because it's expensive. A popover lists up to 8 suggestions plus "Add to dictionary". Words the user adds are kept in `localStorage` and replayed with `spell.add()` on load.

## 4. Persistence and offline
- The editor text auto-saves to `localStorage`.
- Optional, later: a service worker or PWA manifest so the page works fully offline after the first visit.

## Risks
- **nspell performance:** nspell is known to be slow with large affix files. Mitigations: the worker, the per-word cache, and lazy suggestions. If initialization is still too slow, fall back to a pre-expanded word list.
- **dictionary-ru packaging:** newer versions are ESM and may read files with Node `fs`. Importing the raw files with `?url` avoids that.
- **License:** dictionary-ru is LGPL/MPL-style licensed. Credit it in the footer.

## Verification
1. `npm test`: unit test cases for the engine (`privet`→привет, `shchi`→щи, `zhuk`→жук, `yabloko`→яблоко, `t`s`→тс, `ehto`→это, `syn`→сын, `moy`→мой, capital letters).
2. `npm run dev`, then type in the editor: check the conversion, the Ctrl+Space toggle, undo/redo, paste, and the caret position mid-text.
3. Spell check: misspell a word (`превет`) and confirm the underline appears and `привет` is among the suggestions.
4. DevTools Network tab: after the first load, typing and spell checking trigger zero requests, and there are no third-party domains at all.
5. `npm run build && npx vite preview`: the production build works.
