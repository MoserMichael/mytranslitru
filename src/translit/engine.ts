import { CONSONANTS, DIRECT, RECOMPOSE, SEPARATOR } from './rules'

export interface KeyResult {
  /** Number of characters before the caret to replace. */
  remove: number
  insert: string
}

const isUpper = (ch: string) => ch !== ch.toLowerCase()

/**
 * Translates one Latin key typed after `before` (the text left of the caret).
 * `recompose` allows merging with the preceding letters (e.g. с + h → ш); the
 * editor turns it off after a separator or when the caret was moved.
 * Returns null when the key is not handled and should be inserted as-is.
 */
export function applyKey(before: string, key: string, recompose: boolean): KeyResult | null {
  if (key.length !== 1) return null
  const lower = key.toLowerCase()

  if (recompose) {
    for (const n of [2, 1]) {
      const prev = before.slice(-n)
      if (prev.length !== n) continue
      const target = RECOMPOSE[prev.toLowerCase() + lower]
      if (target) {
        return { remove: n, insert: isUpper(prev[0]) ? target.toUpperCase() : target }
      }
    }
  }

  let letter: string | undefined
  if (lower === 'y') {
    const prev = before.slice(-1).toLowerCase()
    letter = prev !== '' && CONSONANTS.includes(prev) && prev !== 'й' ? 'ы' : 'й'
  } else {
    letter = DIRECT[lower]
  }
  if (!letter) return null
  return { remove: 0, insert: isUpper(key) ? letter.toUpperCase() : letter }
}

/** Transliterates a whole Latin string, as if it were typed key by key. */
export function transliterate(latin: string): string {
  let out = ''
  let recompose = true
  for (const key of latin) {
    if (key === SEPARATOR) {
      recompose = false
      continue
    }
    const r = applyKey(out, key, recompose)
    out = r ? out.slice(0, out.length - r.remove) + r.insert : out + key
    recompose = true
  }
  return out
}
