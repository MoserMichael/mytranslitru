import { useEffect, useState } from 'react'

interface Props {
  word: string
  top: number
  left: number
  suggest: (word: string) => Promise<string[]>
  onPick: (replacement: string) => void
  onAdd: () => void
  onClose: () => void
}

export function SuggestionPopover({ word, top, left, suggest, onPick, onAdd, onClose }: Props) {
  const [list, setList] = useState<string[] | null>(null)

  useEffect(() => {
    let live = true
    setList(null)
    suggest(word).then((l) => live && setList(l))
    return () => {
      live = false
    }
  }, [word, suggest])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="popover" style={{ top, left }} role="menu" onMouseDown={(e) => e.preventDefault()}>
      {list === null && <div className="popover-info">Looking for suggestions…</div>}
      {list?.length === 0 && <div className="popover-info">No suggestions</div>}
      {list?.map((s) => (
        <button key={s} role="menuitem" onClick={() => onPick(s)}>
          {s}
        </button>
      ))}
      <hr />
      <button role="menuitem" onClick={onAdd}>
        Add “{word}” to dictionary
      </button>
    </div>
  )
}
