// Single source of truth for the transliteration scheme: the rules table is
// rendered from LETTERS, and the input engine is driven by DIRECT and RECOMPOSE.
// The romanization column follows Wikipedia's "Romanization of Russian" full rules.

export interface LetterRule {
  cyrillic: string
  romanization: string
  /** What to type in the editor to get this letter. */
  input: string
  notes?: string
}

export const LETTERS: LetterRule[] = [
  { cyrillic: 'А а', romanization: 'a', input: 'a' },
  { cyrillic: 'Б б', romanization: 'b', input: 'b' },
  { cyrillic: 'В в', romanization: 'v', input: 'v' },
  { cyrillic: 'Г г', romanization: 'g', input: 'g' },
  { cyrillic: 'Д д', romanization: 'd', input: 'd' },
  {
    cyrillic: 'Е е',
    romanization: 'e, ye',
    input: 'e, ye',
    notes: 'ye at the start of a word and after vowels, ъ and ь'
  },
  { cyrillic: 'Ё ё', romanization: 'yo', input: 'yo' },
  { cyrillic: 'Ж ж', romanization: 'zh', input: 'zh' },
  { cyrillic: 'З з', romanization: 'z', input: 'z' },
  { cyrillic: 'И и', romanization: 'i', input: 'i' },
  { cyrillic: 'Й й', romanization: 'y', input: 'y, j', notes: 'y is й after a vowel or at the start of a word' },
  { cyrillic: 'К к', romanization: 'k', input: 'k' },
  { cyrillic: 'Л л', romanization: 'l', input: 'l' },
  { cyrillic: 'М м', romanization: 'm', input: 'm' },
  { cyrillic: 'Н н', romanization: 'n', input: 'n' },
  { cyrillic: 'О о', romanization: 'o', input: 'o' },
  { cyrillic: 'П п', romanization: 'p', input: 'p' },
  { cyrillic: 'Р р', romanization: 'r', input: 'r' },
  { cyrillic: 'С с', romanization: 's', input: 's' },
  { cyrillic: 'Т т', romanization: 't', input: 't' },
  { cyrillic: 'У у', romanization: 'u', input: 'u' },
  { cyrillic: 'Ф ф', romanization: 'f', input: 'f' },
  { cyrillic: 'Х х', romanization: 'kh', input: 'kh, h' },
  { cyrillic: 'Ц ц', romanization: 'ts', input: 'ts, c' },
  { cyrillic: 'Ч ч', romanization: 'ch', input: 'ch' },
  { cyrillic: 'Ш ш', romanization: 'sh', input: 'sh' },
  { cyrillic: 'Щ щ', romanization: 'shch', input: 'shch' },
  { cyrillic: 'Ъ ъ', romanization: 'ʺ', input: '"', notes: 'Hard sign; omitted in simplified romanization' },
  { cyrillic: 'Ы ы', romanization: 'y', input: 'y', notes: 'y is ы after a consonant' },
  { cyrillic: 'Ь ь', romanization: 'ʹ', input: "'", notes: 'Soft sign; omitted in simplified romanization' },
  { cyrillic: 'Э э', romanization: 'e', input: 'eh', notes: 'Typed as eh so it is not confused with е' },
  { cyrillic: 'Ю ю', romanization: 'yu', input: 'yu' },
  { cyrillic: 'Я я', romanization: 'ya', input: 'ya' }
]

export const SPECIAL_RULES: string[] = [
  'The endings -ий and -ый are written -y in names (Достоевский → Dostoyevsky). To type them, use iy and yy.',
  'Type ` (backtick) between two letters to keep them apart: t`s → тс (отсюда), s`h → сх (схема).',
  'Ctrl+Space turns transliteration off and on, for typing Latin text or quotes.'
]

/** Latin key → Cyrillic letter when no recomposition applies. "y" is contextual, see engine. */
export const DIRECT: Record<string, string> = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й', k: 'к',
  l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф',
  h: 'х', c: 'ц', "'": 'ь', '"': 'ъ'
}

/** Already-typed Cyrillic letter(s) + Latin key → replacement letter. */
export const RECOMPOSE: Record<string, string> = {
  'зh': 'ж',
  'кh': 'х',
  'сh': 'ш',
  'цh': 'ч',
  'шцh': 'щ',
  'тs': 'ц',
  'еh': 'э',
  'йa': 'я',
  'йu': 'ю',
  'йo': 'ё',
  'йe': 'е',
  'ыa': 'я',
  'ыu': 'ю',
  'ыo': 'ё'
}

export const CONSONANTS = 'бвгджзйклмнпрстфхцчшщ'

/** Key that separates letters and blocks the next recomposition. */
export const SEPARATOR = '`'
