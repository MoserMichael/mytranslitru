import { useEffect, useRef, useState } from 'react'
import { Editor, EditorHandle, replaceRange } from './components/Editor'
import { RulesTable } from './components/RulesTable'
import { transliterate } from './translit/engine'
import { useSpellChecker } from './spell/useSpellChecker'

const TEXT_KEY = 'translit.text'

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
      ? 'Loading Russian dictionary…'
      : spell.status === 'error'
      ? `Spell checker unavailable: ${spell.error}`
      : spell.misspelled.length === 0
      ? 'No spelling errors'
      : `${spell.misspelled.length} possible spelling error${spell.misspelled.length === 1 ? '' : 's'}. Click an underlined word for suggestions.`

  return (
    <div className="app">
      <header>
        <h1>Russian transliteration</h1>
        <div className="toolbar">
          <button
            className={translit ? 'toggle on' : 'toggle'}
            aria-pressed={translit}
            onClick={() => setTranslit((t) => !t)}
            title="Esc, F12 or Ctrl+Space"
          >
            {translit ? 'Кириллица ON' : 'Latin (translit OFF)'}
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={convertSelection} title="Transliterate selected Latin text">
            Convert selection
          </button>
          <button onClick={copy}>{copied ? 'Copied' : 'Copy text'}</button>
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
            {spell.wordCount} word{spell.wordCount === 1 ? '' : 's'} · Esc toggles transliteration
          </span>
        </div>
      </main>

      <footer>
        Runs entirely in your browser. No data leaves this page. Spell checking by{' '}
        <a href="https://github.com/wooorm/nspell" rel="noreferrer">nspell</a> with the{' '}
        <a href="https://github.com/wooorm/dictionaries/tree/main/dictionaries/ru" rel="noreferrer">dictionary-ru</a>{' '}
        Hunspell dictionary.
      </footer>
    </div>
  )
}
