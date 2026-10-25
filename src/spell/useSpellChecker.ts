import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import affUrl from 'dictionary-ru-files/index.aff?url'
import dicUrl from 'dictionary-ru-files/index.dic?url'
import type { FromWorker, ToWorker } from './protocol'

export type SpellStatus = 'loading' | 'ready' | 'error'

export interface WordRange {
  start: number
  end: number
  word: string
}

const WORD_RE = /[а-яё]+(?:-[а-яё]+)*/gi
const PERSONAL_KEY = 'translit.personalDictionary'
const CHECK_DELAY_MS = 300

export function findWords(text: string): WordRange[] {
  const words: WordRange[] = []
  for (const m of text.matchAll(WORD_RE)) {
    words.push({ start: m.index!, end: m.index! + m[0].length, word: m[0] })
  }
  return words
}

function loadPersonal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PERSONAL_KEY) || '[]')
  } catch {
    return []
  }
}

function savePersonal(words: string[]) {
  try {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(words))
  } catch {
    // Storage unavailable (private mode); the word stays added for this session.
  }
}

export function useSpellChecker(text: string) {
  const workerRef = useRef<Worker | null>(null)
  const checkId = useRef(0)
  const pendingSuggestions = useRef(new Map<string, (list: string[]) => void>())
  const [status, setStatus] = useState<SpellStatus>('loading')
  const [error, setError] = useState('')
  const [wrong, setWrong] = useState<Set<string>>(new Set())

  useEffect(() => {
    const worker = new Worker(new URL('./spell.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    const send = (msg: ToWorker) => worker.postMessage(msg)

    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data
      switch (msg.type) {
        case 'ready':
          setStatus('ready')
          break
        case 'error':
          setStatus('error')
          setError(msg.message)
          break
        case 'checked':
          if (msg.id === checkId.current) setWrong(new Set(msg.wrong))
          break
        case 'suggestions': {
          const resolve = pendingSuggestions.current.get(msg.word)
          pendingSuggestions.current.delete(msg.word)
          resolve?.(msg.list)
          break
        }
      }
    }
    worker.onerror = (e) => {
      setStatus('error')
      setError(e.message)
    }
    // Asset URLs may be relative to the page; the worker would resolve them against its own URL.
    const absolute = (url: string) => new URL(url, document.baseURI).href
    send({ type: 'init', affUrl: absolute(affUrl), dicUrl: absolute(dicUrl), personal: loadPersonal() })
    return () => worker.terminate()
  }, [])

  const words = useMemo(() => findWords(text), [text])

  useEffect(() => {
    if (status !== 'ready') return
    const timer = setTimeout(() => {
      const unique = Array.from(new Set(words.map((w) => w.word)))
      const msg: ToWorker = { type: 'check', id: ++checkId.current, words: unique }
      workerRef.current?.postMessage(msg)
    }, CHECK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [words, status])

  const misspelled = useMemo(() => words.filter((w) => wrong.has(w.word)), [words, wrong])

  const suggest = useCallback(
    (word: string) =>
      new Promise<string[]>((resolve) => {
        pendingSuggestions.current.set(word, resolve)
        const msg: ToWorker = { type: 'suggest', word }
        workerRef.current?.postMessage(msg)
      }),
    []
  )

  const addWord = useCallback((word: string) => {
    const msg: ToWorker = { type: 'add', word }
    workerRef.current?.postMessage(msg)
    savePersonal(Array.from(new Set([...loadPersonal(), word])))
    setWrong((prev) => {
      const next = new Set(prev)
      next.delete(word)
      return next
    })
  }, [])

  return { status, error, misspelled, wordCount: words.length, suggest, addWord }
}
