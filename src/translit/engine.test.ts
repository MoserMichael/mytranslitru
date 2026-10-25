import assert from 'assert'
import { applyKey, transliterate } from './engine'

const cases: [string, string][] = [
  ['privet', 'привет'],
  ['shhi', 'щи'],
  ['wuka', 'щука'],
  ['zhuk', 'жук'],
  ['hleb', 'хлеб'],
  ['xleb', 'хлеб'],
  ['chaj', 'чай'],
  ["car'", 'царь'],
  ['jabloko', 'яблоко'],
  ['yabloko', 'яблоко'],
  ['qbloko', 'яблоко'],
  ['jolka', 'ёлка'],
  ['yolka', 'ёлка'],
  ['ölka', 'ёлка'],
  ['novyj', 'новый'],
  ['sinij', 'синий'],
  ['syn', 'сын'],
  ['moj', 'мой'],
  ['zanjatija', 'занятия'],
  ["ljubov'", 'любовь'],
  ['lyubovmjz', 'любовь'],
  ["p'ju", 'пью'],
  ['ob#javlenie', 'объявление'],
  ['obtvzjavlenie', 'объявление'],
  ['jeto', 'это'],
  ['äto', 'это'],
  ['otsjuda', 'отсюда'],
  ['s+hema', 'схема'],
  ['j+od', 'йод'],
  ['proj+ekt', 'пройект'],
  ['Moskva', 'Москва'],
  ['SHHI', 'ЩИ'],
  ['Shhuka', 'Щука'],
  ['Zhenja', 'Женя'],
  ['JA', 'Я'],
  ['Ja', 'Я'],
  ["''", 'Ь'],
  ['##', 'Ъ'],
  ['#+#', 'ъъ'],
  ['2+2=4', '2+2=4'],
  ['privet, mir! 123', 'привет, мир! 123']
]

let failed = 0
for (const [latin, expected] of cases) {
  const actual = transliterate(latin)
  if (actual !== expected) {
    failed++
    console.error(`FAIL ${latin}: expected ${expected}, got ${actual}`)
  }
}

// Recomposition is suppressed when the editor says so (e.g. after a caret move).
assert.deepStrictEqual(applyKey('с', 'h', false), { remove: 0, insert: 'х' })
assert.deepStrictEqual(applyKey('с', 'h', true), { remove: 1, insert: 'ш' })
assert.strictEqual(applyKey('', '`', true), null)

if (failed) {
  console.error(`${failed} of ${cases.length} cases failed`)
  process.exit(1)
}
console.log(`All ${cases.length} transliteration cases passed`)
