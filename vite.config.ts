import path from 'path'
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Strict CSP: the built page may only load resources from its own origin.
// Production only, because the dev server injects an inline React-refresh preamble.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
  "connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"

function cspPlugin(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }
    ]
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin()],
  resolve: {
    // dictionary-ru only exports index.js; alias the package folder to reach the raw .aff/.dic files.
    alias: { 'dictionary-ru-files': path.resolve(__dirname, 'node_modules/dictionary-ru') }
  },
  optimizeDeps: { include: ['nspell'] }
})
