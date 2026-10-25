import { MouseEvent, useState } from 'react'
import { LETTERS } from '../translit/rules'

interface Props {
  /** Inserts a Cyrillic letter at the editor caret. */
  onInsert: (letter: string) => void
}

/**
 * The letter strip in translit.net style: for each letter, the Latin input for
 * the capital, the Latin input for the small letter, and a button that inserts
 * the Cyrillic letter (capital with "shift" on or Shift held).
 */
export function RulesTable({ onInsert }: Props) {
  const [shift, setShift] = useState(false)

  // Keep the editor's focus and selection when a button is pressed.
  const keepFocus = (e: MouseEvent) => e.preventDefault()

  return (
    <section className="rules" aria-label="Правила транслитерации">
      <ul className="letters">
        <li className="letter shift-cell">
          <button className={shift ? 'shift on' : 'shift'} aria-pressed={shift} onMouseDown={keepFocus} onClick={() => setShift((s) => !s)}>
            shift
          </button>
        </li>
        {LETTERS.map((l) => (
          <li key={l.lower} className="letter">
            <span className="latin-upper">{l.latinUpper}</span>
            <span className="latin-lower">{l.latinLower}</span>
            <button
              className="cyr"
              onMouseDown={keepFocus}
              onClick={(e) => onInsert(shift !== e.shiftKey ? l.upper : l.lower)}
              title={`Вставить ${l.upper} / ${l.lower}`}
            >
              {shift ? l.upper : l.lower}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
