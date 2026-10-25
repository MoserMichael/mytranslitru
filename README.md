# Russian transliteration

Type Russian on a Latin keyboard: Latin letters are converted to Cyrillic as you type
(Wikipedia romanization rules), and a Russian spell checker (nspell + dictionary-ru)
underlines mistakes. Everything runs in the browser; no requests leave the page.

```sh
npm install
npm run dev      # development server
npm test         # transliteration engine tests
npm run build    # static site in dist/
npm run preview  # serve dist/ locally
```

`dist/` must be served over http(s) (any static file server), because browsers block
Web Workers and `fetch` on `file://` pages. See [DESIGN.md](DESIGN.md) for the design.
