# Russian transliteration

Visit my transliteration page [here on github gh-pages](https://mosermichael.github.io/mytranslitru/)

Type Russian on a Latin keyboard: Latin letters are converted to Cyrillic as you type.
I am using it on a laptop, where the keyboard has no Cyrillic characters.

Runs entirely in the browser. No adds. No evil stuff. Spell checker runs locally.

(This is a vibe coding exercise. Sometimes it is preferable to spend a few thousand tokens, if it can spare you a visit to web pages with adds and other nasty things.)

----

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
