// Single source of truth for the transliteration scheme, following https://translit.net/.
// The rules strip is rendered from LETTERS; the input engine is driven by DIRECT and RULES.

export interface LetterRule {
  lower: string
  upper: string
  /** Latin input for the capital letter, as shown on translit.net. */
  latinUpper: string
  /** Latin input for the small letter, alternatives separated by commas. */
  latinLower: string
}

const letter = (lower: string, latinUpper: string, latinLower: string): LetterRule => ({
  lower,
  upper: lower.toUpperCase(),
  latinUpper,
  latinLower
})

export const LETTERS: LetterRule[] = [
  letter('а', 'A', 'a'),
  letter('б', 'B', 'b'),
  letter('в', 'V', 'v'),
  letter('г', 'G', 'g'),
  letter('д', 'D', 'd'),
  letter('е', 'E', 'e'),
  letter('ё', 'Jo', 'jo, yo, ö'),
  letter('ж', 'Zh', 'zh'),
  letter('з', 'Z', 'z'),
  letter('и', 'I', 'i'),
  letter('й', 'J', 'j'),
  letter('к', 'K', 'k'),
  letter('л', 'L', 'l'),
  letter('м', 'M', 'm'),
  letter('н', 'N', 'n'),
  letter('о', 'O', 'o'),
  letter('п', 'P', 'p'),
  letter('р', 'R', 'r'),
  letter('с', 'S', 's'),
  letter('т', 'T', 't'),
  letter('у', 'U', 'u'),
  letter('ф', 'F', 'f'),
  letter('х', 'H', 'h, x'),
  letter('ц', 'C', 'c'),
  letter('ч', 'Ch', 'ch'),
  letter('ш', 'Sh', 'sh'),
  letter('щ', 'Shh', 'shh, w'),
  letter('ъ', '##', '#, tvz'),
  letter('ы', 'Y', 'y'),
  letter('ь', "''", "', mjz"),
  letter('э', 'Je', 'je, ä'),
  letter('ю', 'Ju', 'ju, yu, ü'),
  letter('я', 'Ja', 'ja, ya, q')
]

export const SPECIAL_RULES: string[] = [
  "Ъ = ##, Ь = '' (type the sign twice for the capital letter).",
  'Type + to separate letters that would otherwise combine: j+o → йо, j+e → йе, s+h → сх.',
  'Esc, F12 or Ctrl+Space switches between Cyrillic and Latin input.'
]

/** Separator: "й+a" becomes "йа" instead of "я". */
export const SEPARATOR = '+'

/** Latin key → Cyrillic letter when no rule applies. */
export const DIRECT: Record<string, string> = { "'": 'ь', '#': 'ъ', [SEPARATOR]: SEPARATOR }
const directLower: Record<string, string> = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й', k: 'к', l: 'л',
  m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', x: 'х',
  c: 'ц', w: 'щ', y: 'ы', q: 'я', 'ö': 'ё', 'ä': 'э', 'ü': 'ю'
}
for (const [key, cyr] of Object.entries(directLower)) {
  DIRECT[key] = cyr
  DIRECT[key.toUpperCase()] = cyr.toUpperCase()
}

export interface Rule {
  /** Text that must precede the caret. */
  prev: string
  key: string
  /** Replaces `prev` + `key`. */
  result: string
}

// Combinations in lowercase; case variants and "+" separator variants are derived below.
const COMBINATIONS: [string, string, string][] = [
  ['й', 'a', 'я'], ['ы', 'a', 'я'],
  ['й', 'o', 'ё'], ['ы', 'o', 'ё'],
  ['й', 'u', 'ю'], ['ы', 'u', 'ю'],
  ['й', 'e', 'э'],
  ['з', 'h', 'ж'], ['ц', 'h', 'ч'], ['с', 'h', 'ш'], ['ш', 'h', 'щ'], ['сх', 'h', 'щ'],
  ['тв', 'z', 'ъ'], ['мй', 'z', 'ь']
]

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)

function buildRules(): Rule[] {
  const rules: Rule[] = []
  for (const [prev, key, result] of COMBINATIONS) {
    // Like translit.net: "sh"/"Sh" → ш/Ш, "SH" → Ш, but "sH" is not combined.
    const variants: Rule[] = [
      { prev, key, result },
      { prev: capitalize(prev), key, result: result.toUpperCase() },
      { prev: prev.toUpperCase(), key: key.toUpperCase(), result: result.toUpperCase() }
    ]
    for (const v of variants) {
      rules.push(v, { prev: v.prev + SEPARATOR, key: v.key, result: v.prev + DIRECT[v.key] })
    }
  }
  // Doubling a sign gives the capital letter; "+" keeps two small signs.
  for (const sign of ["'", '#']) {
    const cyr = DIRECT[sign]
    rules.push({ prev: cyr, key: sign, result: cyr.toUpperCase() })
    rules.push({ prev: cyr + SEPARATOR, key: sign, result: cyr + cyr })
  }
  // Dedupe (capitalize === toUpperCase for one-letter prev) and try longer contexts first.
  const unique = new Map(rules.map((r) => [r.prev + '\u0000' + r.key, r]))
  return Array.from(unique.values()).sort((a, b) => b.prev.length - a.prev.length)
}

export const RULES: Rule[] = buildRules()
