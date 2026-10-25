import assert from 'assert'
import { applyKey, transliterate } from './engine'

const cases: [string, string][] = [
  ['privet', 'привет'],
  ['shchi', 'щи'],
  ['zhuk', 'жук'],
  ['khleb', 'хлеб'],
  ['chay', 'чай'],
  ['tsar\'', 'царь'],
  ['yabloko', 'яблоко'],
  ['yolka', 'ёлка'],
  ['Yelena', 'Елена'],
  ['moye', 'мое'],
  ['novyy', 'новый'],
  ['siniy', 'синий'],
  ['syn', 'сын'],
  ['moy', 'мой'],
  ['zanyatiya', 'занятия'],
  ['lyubov\'', 'любовь'],
  ['p\'yu', 'пью'],
  ['ob"yavleniye', 'объявление'],
  ['ehto', 'это'],
  ['t`s', 'тс'],
  ['ot`syuda', 'отсюда'],
  ['s`khema', 'схема'],
  ['Moskva', 'Москва'],
  ['SHCHI', 'ЩИ'],
  ['Shchuka', 'Щука'],
  ['Zhenya', 'Женя'],
  ['Yuriy', 'Юрий'],
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
assert.strictEqual(applyKey('', 'q', true), null)

if (failed) {
  console.error(`${failed} of ${cases.length} cases failed`)
  process.exit(1)
}
console.log(`All ${cases.length} transliteration cases passed`)
