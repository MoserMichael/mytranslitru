import { forwardRef, KeyboardEvent, ReactNode, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { applyKey } from '../translit/engine'
import { SEPARATOR } from '../translit/rules'
import type { WordRange } from '../spell/useSpellChecker'
import { SuggestionPopover } from './SuggestionPopover'

export interface EditorHandle {
  textarea: HTMLTextAreaElement | null
}

interface Props {
  text: string
  onChange: (text: string) => void
  translit: boolean
  misspelled: WordRange[]
  suggest: (word: string) => Promise<string[]>
  addWord: (word: string) => void
}

/**
 * Replaces text[start, end) through the browser's editing commands, so the
 * native undo/redo stack keeps working and React sees a normal input event.
 */
export function replaceRange(ta: HTMLTextAreaElement, start: number, end: number, insert: string) {
  ta.focus()
  ta.setSelectionRange(start, end)
  if (!document.execCommand('insertText', false, insert)) {
    ta.setRangeText(insert, start, end, 'end')
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

interface Popover {
  range: WordRange
  top: number
  left: number
}

export const Editor = forwardRef<EditorHandle, Props>(function Editor(
  { text, onChange, translit, misspelled, suggest, addWord },
  ref
) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  // Caret position right after the last transliterated letter; letters only
  // recompose (с + h → ш) when typing continues from exactly there.
  const lastPos = useRef(-1)
  const blocked = useRef(false)
  const [popover, setPopover] = useState<Popover | null>(null)

  useImperativeHandle(ref, () => ({ textarea: taRef.current }))

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!translit || e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) return
    if (e.key.length !== 1) return
    if (e.key === SEPARATOR) {
      e.preventDefault()
      blocked.current = true
      return
    }
    const ta = e.currentTarget
    const { selectionStart: start, selectionEnd: end } = ta
    const recompose = !blocked.current && start === end && start === lastPos.current
    blocked.current = false
    const r = applyKey(ta.value.slice(0, start), e.key, recompose)
    if (!r) return
    e.preventDefault()
    replaceRange(ta, start - r.remove, end, r.insert)
    lastPos.current = start - r.remove + r.insert.length
  }

  const syncScroll = () => {
    if (overlayRef.current && taRef.current) {
      overlayRef.current.scrollTop = taRef.current.scrollTop
      overlayRef.current.scrollLeft = taRef.current.scrollLeft
    }
    setPopover(null)
  }

  const onClick = () => {
    const ta = taRef.current
    if (!ta || ta.selectionStart !== ta.selectionEnd) return setPopover(null)
    const caret = ta.selectionStart
    const range = misspelled.find((w) => w.start <= caret && caret <= w.end)
    const mark = range && overlayRef.current?.querySelector(`mark[data-start="${range.start}"]`)
    if (!range || !mark || !wrapRef.current) return setPopover(null)
    const m = mark.getBoundingClientRect()
    const w = wrapRef.current.getBoundingClientRect()
    setPopover({ range, top: m.bottom - w.top + 4, left: Math.max(0, m.left - w.left) })
  }

  const closePopover = useCallback(() => setPopover(null), [])

  const pick = (replacement: string) => {
    const ta = taRef.current
    if (ta && popover && ta.value.slice(popover.range.start, popover.range.end) === popover.range.word) {
      replaceRange(ta, popover.range.start, popover.range.end, replacement)
    }
    setPopover(null)
  }

  const add = () => {
    if (popover) addWord(popover.range.word)
    setPopover(null)
    taRef.current?.focus()
  }

  const segments: ReactNode[] = []
  let pos = 0
  for (const w of misspelled) {
    segments.push(text.slice(pos, w.start))
    segments.push(
      <mark key={w.start} data-start={w.start}>
        {text.slice(w.start, w.end)}
      </mark>
    )
    pos = w.end
  }
  // The trailing space keeps a final empty line the same height as in the textarea.
  segments.push(text.slice(pos) + ' ')

  return (
    <div className="editor" ref={wrapRef}>
      <div className="editor-overlay" ref={overlayRef} aria-hidden="true">
        {segments}
      </div>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => {
          onChange(e.target.value)
          setPopover(null)
        }}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        onClick={onClick}
        onBlur={closePopover}
        spellCheck={false}
        autoFocus
        aria-label="Text editor. Latin letters are converted to Cyrillic as you type."
        placeholder="Type here with the English keyboard: privet, mir → привет, мир"
      />
      {popover && (
        <SuggestionPopover
          word={popover.range.word}
          top={popover.top}
          left={popover.left}
          suggest={suggest}
          onPick={pick}
          onAdd={add}
          onClose={closePopover}
        />
      )}
    </div>
  )
})
