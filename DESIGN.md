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
│ Header: title · [Translit ON/OFF] (Esc) · Copy            │
├──────────────────────────────────────────────────────────┤
│ UPPER: translit.net-style letter strip                   │
│  [shift] A/a [а] B/b [б] … Ja/ja,ya,q [я]  + special rules │
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
Follows the letter strip on https://translit.net/: a "shift" cell, then one cell per letter in alphabetical order (А–Я). Each cell shows the Latin input for the capital letter (bold), the Latin input(s) for the small letter, and a button that inserts the Cyrillic letter at the caret. Shift (the cell or the Shift key) inserts the capital. Below the strip are the special rules (signs, the `+` separator, toggle keys). The strip is generated from `rules.ts`, so what's displayed and what the input engine does can't drift apart.

## 2. Transliteration engine
Same scheme as translit.net. Every key either inserts a letter directly or, if the text before the caret matches a rule, replaces that text (rules with longer matches are tried first):

| Typed | Result |
|---|---|
| a b v g d e z i j k l m n o p r s t u f h c y | а б в г д е з и й к л м н о п р с т у ф х ц ы |
| x / w / q / ö / ä / ü | х / щ / я / ё / э / ю |
| z+h, c+h, s+h | ж, ч, ш |
| sh+h (shh) | щ |
| j or y + a / o / u | я / ё / ю |
| j+e (je) | э |
| ' / # | ь / ъ; typed twice: Ь / Ъ |
| tvz / mjz | ъ / ь |
| `+` | separator: j+o → йо, j+e → йе, s+h → сх |

- Capitals: `Sh`/`SH` → Ш, `Ja`/`JA` → Я.
- Letters only combine while typing continues from the last converted letter. After the caret is moved, the next key is inserted directly.
- Digits, punctuation, Enter, Backspace, paste and IME input pass through untouched. Pasted Latin text stays Latin; a "Convert selection" button transliterates it.
- Esc or F12 (as on translit.net), or Ctrl+Space, toggles between Cyrillic and Latin input.
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
1. `npm test`: unit test cases for the engine (`privet`→привет, `shhi`→щи, `zhuk`→жук, `jabloko`→яблоко, `s+hema`→схема, `jeto`→это, `ob#javlenie`→объявление, capital letters).
2. `npm run dev`, then type in the editor: check the conversion, the Esc toggle, the letter buttons, undo/redo, paste, and the caret position mid-text.
3. Spell check: misspell a word (`превет`) and confirm the underline appears and `привет` is among the suggestions.
4. DevTools Network tab: after the first load, typing and spell checking trigger zero requests, and there are no third-party domains at all.
5. `npm run build && npx vite preview`: the production build works.
