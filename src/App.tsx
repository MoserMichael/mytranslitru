import { useEffect, useRef, useState } from 'react'
import { Editor, EditorHandle, replaceRange } from './components/Editor'
import { RulesTable } from './components/RulesTable'
import { transliterate } from './translit/engine'
import { useSpellChecker } from './spell/useSpellChecker'

const TEXT_KEY = 'translit.text'

/** Russian plural form: plural(5, ['слово', 'слова', 'слов']) → 'слов'. */
function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function loadText(): string {
  try {
    return localStorage.getItem(TEXT_KEY) || ''
  } catch {
    return ''
  }
}

export function App() {
  const [text, setText] = useState(loadText)
  const [translit, setTranslit] = useState(true)
  const [copied, setCopied] = useState(false)
  const editorRef = useRef<EditorHandle>(null)
  const spell = useSpellChecker(text)

  useEffect(() => {
    try {
      localStorage.setItem(TEXT_KEY, text)
    } catch {
      // Storage unavailable; the text simply isn't kept across reloads.
    }
  }, [text])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc and F12 as on translit.net; Ctrl+Space as well, since F12 is often taken by dev tools.
      if (e.key === 'Escape' || e.key === 'F12' || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault()
        setTranslit((t) => !t)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const convertSelection = () => {
    const ta = editorRef.current?.textarea
    if (!ta || ta.selectionStart === ta.selectionEnd) return
    const { selectionStart: start, selectionEnd: end } = ta
    replaceRange(ta, start, end, transliterate(ta.value.slice(start, end)))
  }

  const insertLetter = (letter: string) => {
    const ta = editorRef.current?.textarea
    if (ta) replaceRange(ta, ta.selectionStart, ta.selectionEnd, letter)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      editorRef.current?.textarea?.select()
    }
  }

  const spellStatus =
    spell.status === 'loading'
      ? 'Загрузка русского словаря…'
      : spell.status === 'error'
      ? `Проверка орфографии недоступна: ${spell.error}`
      : spell.misspelled.length === 0
      ? 'Орфографических ошибок нет'
      : `Возможные ошибки: ${spell.misspelled.length}. Нажмите на подчёркнутое слово, чтобы увидеть варианты.`

  return (
    <div className="app">
      <header>
        <h1>Русская транслитерация</h1>
        <div className="toolbar">
          <button
            className={translit ? 'toggle on' : 'toggle'}
            aria-pressed={translit}
            onClick={() => setTranslit((t) => !t)}
            title="Esc, F12 или Ctrl+Space"
          >
            {translit ? 'Ввод: кириллица' : 'Ввод: латиница'}
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={convertSelection} title="Транслитерировать выделенный латинский текст">
            Преобразовать выделенное
          </button>
          <button onClick={copy}>{copied ? 'Скопировано' : 'Копировать текст'}</button>
        </div>
      </header>

      <RulesTable onInsert={insertLetter} />

      <main>
        <Editor
          ref={editorRef}
          text={text}
          onChange={setText}
          translit={translit}
          misspelled={spell.misspelled}
          suggest={spell.suggest}
          addWord={spell.addWord}
        />
        <div className="status" role="status">
          <span className={`spell-${spell.status}`}>{spellStatus}</span>
          <span>
            {spell.wordCount} {plural(spell.wordCount, ['слово', 'слова', 'слов'])} · Esc — кириллица/латиница
          </span>
        </div>
      </main>

      <footer>
        Страница работает полностью в браузере, данные никуда не передаются. Проверка орфографии:{' '}
        <a href="https://github.com/wooorm/nspell" rel="noreferrer">nspell</a> со словарём Hunspell{' '}
        <a href="https://github.com/wooorm/dictionaries/tree/main/dictionaries/ru" rel="noreferrer">dictionary-ru</a>.
      </footer>
    </div>
  )
}
