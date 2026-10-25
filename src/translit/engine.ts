import { DIRECT, RULES } from './rules'

export interface KeyResult {
  /** Number of characters before the caret to replace. */
  remove: number
  insert: string
}

/**
 * Translates one Latin key typed after `before` (the text left of the caret).
 * `recompose` allows merging with the preceding letters (e.g. с + h → ш); the
 * editor turns it off when the caret was moved since the last typed letter.
 * Returns null when the key is not handled and should be inserted as-is.
 */
export function applyKey(before: string, key: string, recompose: boolean): KeyResult | null {
  if (key.length !== 1) return null
  if (recompose) {
    const rule = RULES.find((r) => r.key === key && before.endsWith(r.prev))
    if (rule) return { remove: rule.prev.length, insert: rule.result }
  }
  const letter = DIRECT[key]
  return letter ? { remove: 0, insert: letter } : null
}

/** Transliterates a whole Latin string, as if it were typed key by key. */
export function transliterate(latin: string): string {
  let out = ''
  for (const key of latin) {
    const r = applyKey(out, key, true)
    out = r ? out.slice(0, out.length - r.remove) + r.insert : out + key
  }
  return out
}
