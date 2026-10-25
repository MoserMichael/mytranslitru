# Russian transliteration

Visit my transliteration page [here on github gh-pages](https://mosermichael.github.io/mytranslitru/)

Runs entirely in the browser. No adds. No evil stuff. Spell checker runs locally.

(well, it's a vibe coding exercise, but it does something)
(... or: sometimes it is preferable to spend a few thousand tokens, if it can spare you a visit to web pages with adds and other nasty things)

----

Type Russian on a Latin keyboard: Latin letters are converted to Cyrillic as you type
(same rules as translit.net), and a Russian spell checker (nspell + dictionary-ru)
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
