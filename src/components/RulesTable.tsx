import { LETTERS, LetterRule, SPECIAL_RULES } from '../translit/rules'

const COLUMNS = 3
const perColumn = Math.ceil(LETTERS.length / COLUMNS)
const columns = Array.from({ length: COLUMNS }, (_, i) => LETTERS.slice(i * perColumn, (i + 1) * perColumn))
const noted = LETTERS.filter((l) => l.notes)
const noteNumber = (l: LetterRule) => noted.indexOf(l) + 1

export function RulesTable() {
  return (
    <details className="rules" open>
      <summary>Transliteration rules</summary>
      <div className="rules-columns">
        {columns.map((col, i) => (
          <table key={i}>
            <thead>
              <tr>
                <th scope="col">Cyrillic</th>
                <th scope="col">Romanization</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              {col.map((l) => (
                <tr key={l.cyrillic}>
                  <td className="cyr">{l.cyrillic}</td>
                  <td>
                    {l.romanization}
                    {l.notes && <sup>{noteNumber(l)}</sup>}
                  </td>
                  <td>
                    <kbd>{l.input}</kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
      <ol className="notes">
        {noted.map((l) => (
          <li key={l.cyrillic}>
            <strong>{l.cyrillic}</strong>: {l.notes}
          </li>
        ))}
      </ol>
      <ul className="notes">
        {SPECIAL_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="source">
        Romanization follows Wikipedia's{' '}
        <a href="https://en.wikipedia.org/wiki/Wikipedia:Romanization_of_Russian#Full_rules" rel="noreferrer">
          Romanization of Russian
        </a>{' '}
        full rules.
      </p>
    </details>
  )
}
