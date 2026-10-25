import { useEffect, useRef } from 'react'
import { SPECIAL_RULES } from '../translit/rules'

interface Props {
  open: boolean
  onClose: () => void
}

/** Modal with the input rules and notes that would otherwise crowd the page. */
export function HelpDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="help"
      aria-labelledby="help-title"
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="help-body">
        <h2 id="help-title">Справка</h2>

        <h3>Ввод</h3>
        <ul>
          {SPECIAL_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
          <li>Кнопки с буквами вставляют букву в текст; с shift — заглавную.</li>
          <li>«Преобразовать выделенное» транслитерирует выделенный латинский текст.</li>
        </ul>

        <h3>Проверка орфографии</h3>
        <p>
          Слова с возможными ошибками подчёркнуты. Нажмите на слово, чтобы увидеть варианты или добавить его в
          словарь.
        </p>

        <h3>О странице</h3>
        <p>
          Страница работает полностью в браузере, данные никуда не передаются. Правила транслитерации как на{' '}
          <a href="https://translit.net/" rel="noreferrer">translit.net</a>. Проверка орфографии:{' '}
          <a href="https://github.com/wooorm/nspell" rel="noreferrer">nspell</a> со словарём Hunspell{' '}
          <a href="https://github.com/wooorm/dictionaries/tree/main/dictionaries/ru" rel="noreferrer">dictionary-ru</a>.
        </p>

        <div className="help-actions">
          <button onClick={onClose} autoFocus>
            Закрыть
          </button>
        </div>
      </div>
    </dialog>
  )
}
