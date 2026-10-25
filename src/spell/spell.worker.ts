// Runs nspell off the main thread: building the Russian dictionary takes seconds.
import nspell from 'nspell'
import type { FromWorker, ToWorker } from './protocol'

type Spell = ReturnType<typeof nspell>

let spell: Spell | null = null
const cache = new Map<string, boolean>()
const post = (msg: FromWorker) => (self as unknown as Worker).postMessage(msg)

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`не удалось загрузить ${url} (${res.status})`)
  return res.text()
}

function isCorrect(word: string): boolean {
  let ok = cache.get(word)
  if (ok === undefined) {
    ok = spell!.correct(word) || (word.includes('-') && word.split('-').every((p) => spell!.correct(p)))
    cache.set(word, ok)
  }
  return ok
}

self.onmessage = async (e: MessageEvent<ToWorker>) => {
  const msg = e.data
  switch (msg.type) {
    case 'init':
      try {
        const [aff, dic] = await Promise.all([fetchText(msg.affUrl), fetchText(msg.dicUrl)])
        spell = nspell(aff, dic)
        msg.personal.forEach((w) => spell!.add(w))
        post({ type: 'ready' })
      } catch (err) {
        post({ type: 'error', message: String(err) })
      }
      break
    case 'check':
      if (spell) post({ type: 'checked', id: msg.id, wrong: msg.words.filter((w) => !isCorrect(w)) })
      break
    case 'suggest':
      if (spell) post({ type: 'suggestions', word: msg.word, list: spell.suggest(msg.word).slice(0, 8) })
      break
    case 'add':
      if (spell) {
        spell.add(msg.word)
        cache.set(msg.word, true)
      }
      break
  }
}
