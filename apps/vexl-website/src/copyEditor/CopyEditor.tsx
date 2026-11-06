'use client'

import {Array, Either, Option, pipe, Record, Schema} from 'effect'
import {useRouter} from 'next/navigation'
import React, {useEffect, useState} from 'react'
import {parseInlineCopy} from '../copy/inlineCopy'
import {type Locale, locales} from '../i18n/locales'
import './CopyEditor.css'
import {saveCopy, type SaveCopyResult} from './saveCopy'

type Copy = Readonly<
  Record<string, Readonly<Record<Locale, Readonly<Record<string, string>>>>>
>

const Values = Schema.Struct({en: Schema.String, cs: Schema.String})
type Values = typeof Values.Type

const Session = Schema.Struct({
  enabled: Schema.Boolean,
  /** Edited but not saved, by `page:key`. */
  drafts: Schema.Record({key: Schema.String, value: Values}),
  /** Saved from this browser tab, by `page:key`. */
  saved: Schema.Record({key: Schema.String, value: Values}),
})
type Session = typeof Session.Type

const SESSION_KEY = 'vexl-copy-editor'
const emptySession: Session = {enabled: false, drafts: {}, saved: {}}
const decodeSession = Schema.decodeUnknownOption(Schema.parseJson(Session))

const LOCALE_NAMES: Record<Locale, string> = {en: 'English', cs: 'Czech'}
const META_KEY = /(?:^|\.)meta\./

function splitId(id: string): {readonly page: string; readonly key: string} {
  const separator = id.indexOf(':')
  return {page: id.slice(0, separator), key: id.slice(separator + 1)}
}

function currentValues(copy: Copy, id: string): Option.Option<Values> {
  const {page, key} = splitId(id)
  return pipe(
    Option.fromNullable(copy[page]),
    Option.flatMap(({en, cs}) =>
      Option.all({en: Record.get(en, key), cs: Record.get(cs, key)})
    )
  )
}

const valueProblem = (value: string): Option.Option<string> =>
  Either.match(parseInlineCopy(value), {
    onLeft: (error) => Option.some(error.message),
    onRight: () => Option.none(),
  })

const sameValues = (a: Values, b: Values): boolean =>
  a.en === b.en && a.cs === b.cs

function useSession(): [Session, (update: (s: Session) => Session) => void] {
  const [session, setSession] = useState(emptySession)
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SESSION_KEY)
      if (stored !== null)
        setSession(Option.getOrElse(decodeSession(stored), () => emptySession))
    } catch {
      // Storage blocked: edits only last until the next page load
    }
  }, [])
  const update = (change: (s: Session) => Session): void => {
    setSession((previous) => {
      const next = change(previous)
      try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
      } catch {
        // Storage blocked: keep the edits in memory
      }
      return next
    })
  }
  return [session, update]
}

/** The `page:key` of the copy under the pointer, if any. */
function markedId(target: EventTarget | null): Option.Option<Element> {
  if (!(target instanceof Element) || target.closest('.vexl-copy-editor'))
    return Option.none()
  return Option.fromNullable(target.closest('[data-copy]'))
}

/** Pages whose copy is on screen, for the page meta entries. */
function pagesOnScreen(): readonly string[] {
  return pipe(
    document.querySelectorAll('[data-copy]'),
    Array.fromIterable,
    Array.map(
      (element) => splitId(element.getAttribute('data-copy') ?? '').page
    ),
    Array.dedupe,
    Array.filter((page) => page !== 'shared')
  )
}

function EditPanel({
  id,
  saved,
  draft,
  onDraft,
  onSaved,
  onClose,
}: {
  readonly id: string
  readonly saved: Values
  readonly draft: Values
  readonly onDraft: (values: Values) => void
  readonly onSaved: (values: Values) => void
  readonly onClose: () => void
}): React.JSX.Element {
  const [status, setStatus] = useState<
    | {readonly type: 'saving'}
    | {readonly type: 'error'; readonly message: string}
  >()
  const problems = Record.map(draft, valueProblem)
  const isValid = Array.every(Record.values(problems), Option.isNone)
  const isChanged = !sameValues(draft, saved)
  const viewing = document.documentElement.lang

  const save = async (): Promise<void> => {
    setStatus({type: 'saving'})
    const {page, key} = splitId(id)
    const result = await saveCopy({page, key, ...draft}).catch(
      (error: unknown): SaveCopyResult => ({ok: false, error: String(error)})
    )
    if (result.ok) {
      setStatus(undefined)
      onSaved(draft)
    } else setStatus({type: 'error', message: result.error})
  }

  return (
    <aside className="vexl-copy-editor vexl-copy-editor__panel">
      <header className="vexl-copy-editor__header">
        <code>{id}</code>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="vexl-copy-editor__locales">
        {Array.map(locales, (locale) => (
          <label key={locale} className="vexl-copy-editor__field">
            <span>
              {LOCALE_NAMES[locale]}
              {locale === viewing ? ' (viewing)' : ''}
            </span>
            <textarea
              value={draft[locale]}
              rows={Math.max(3, draft[locale].split('\n').length + 1)}
              onChange={(event) => {
                onDraft({...draft, [locale]: event.target.value})
              }}
            />
            {Option.match(problems[locale], {
              onNone: () => null,
              onSome: (problem) => (
                <em className="vexl-copy-editor__error">{problem}</em>
              ),
            })}
          </label>
        ))}
      </div>
      <p className="vexl-copy-editor__hint">
        Allowed: **bold**, *italic*, [link text](https://…, mailto:… or /path)
        and new lines. Both languages are required.
      </p>
      {status?.type === 'error' ? (
        <p className="vexl-copy-editor__error">{status.message}</p>
      ) : null}
      <footer className="vexl-copy-editor__actions">
        <button
          type="button"
          disabled={!isChanged || !isValid || status?.type === 'saving'}
          onClick={() => {
            void save()
          }}
        >
          {status?.type === 'saving' ? 'Saving…' : 'Save both languages'}
        </button>
        <button
          type="button"
          disabled={!isChanged}
          onClick={() => {
            onDraft(saved)
          }}
        >
          Discard changes
        </button>
      </footer>
    </aside>
  )
}

function EditList({
  title,
  ids,
  onOpen,
}: {
  readonly title: string
  readonly ids: readonly string[]
  readonly onOpen: (id: string) => void
}): React.JSX.Element | null {
  if (!Array.isNonEmptyReadonlyArray(ids)) return null
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {Array.map(ids, (id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => {
                onOpen(id)
              }}
            >
              {id}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The `next dev` copy editor: click marked text to edit its English and Czech copy. */
export function CopyEditor({copy}: {readonly copy: Copy}): React.JSX.Element {
  const router = useRouter()
  const [session, updateSession] = useSession()
  const [openId, setOpenId] = useState<string>()
  const [metaIds, setMetaIds] = useState<readonly string[]>()

  useEffect(() => {
    if (!session.enabled) return
    const root = document.documentElement
    let hovered: Element | undefined
    const onOver = (event: MouseEvent): void => {
      hovered?.removeAttribute('data-copy-hover')
      hovered = Option.getOrUndefined(markedId(event.target))
      hovered?.setAttribute('data-copy-hover', '')
    }
    const onClick = (event: MouseEvent): void => {
      if (event.altKey) return
      Option.map(markedId(event.target), (element) => {
        event.preventDefault()
        event.stopPropagation()
        setOpenId(element.getAttribute('data-copy') ?? undefined)
      })
    }
    root.setAttribute('data-copy-editing', '')
    document.addEventListener('mouseover', onOver)
    document.addEventListener('click', onClick, true)
    return () => {
      root.removeAttribute('data-copy-editing')
      hovered?.removeAttribute('data-copy-hover')
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('click', onClick, true)
    }
  }, [session.enabled])

  const unsavedIds = pipe(
    Record.toEntries(session.drafts),
    Array.filter(([id, draft]) =>
      Option.match(currentValues(copy, id), {
        onNone: () => false,
        onSome: (saved) => !sameValues(draft, saved),
      })
    ),
    Array.map(([id]) => id)
  )
  const savedIds = Record.keys(session.saved)

  const toggleList = (): void => {
    setMetaIds(
      metaIds
        ? undefined
        : pipe(
            pagesOnScreen(),
            Array.flatMap((page) =>
              pipe(
                Option.fromNullable(copy[page]),
                Option.map(({en}) =>
                  pipe(
                    Record.keys(en),
                    Array.filter((key) => META_KEY.test(key)),
                    Array.map((key) => `${page}:${key}`)
                  )
                ),
                Option.getOrElse((): string[] => [])
              )
            )
          )
    )
  }

  const panel = pipe(
    Option.fromNullable(openId),
    Option.flatMap((id) =>
      Option.map(currentValues(copy, id), (saved) => ({id, saved}))
    ),
    Option.match({
      onNone: () => null,
      onSome: ({id, saved}) => (
        <EditPanel
          key={id}
          id={id}
          saved={saved}
          draft={Option.getOrElse(Record.get(session.drafts, id), () => saved)}
          onDraft={(values) => {
            updateSession((s) => ({
              ...s,
              drafts: {...s.drafts, [id]: values},
            }))
          }}
          onSaved={(values) => {
            updateSession((s) => ({
              ...s,
              drafts: Record.remove(s.drafts, id),
              saved: {...s.saved, [id]: values},
            }))
            setOpenId(undefined)
            router.refresh()
          }}
          onClose={() => {
            setOpenId(undefined)
          }}
        />
      ),
    })
  )

  return (
    <>
      {panel}
      {metaIds && openId === undefined ? (
        <aside className="vexl-copy-editor vexl-copy-editor__list">
          <p className="vexl-copy-editor__hint">
            Click outlined text to edit it. Alt-click uses the page as usual.
          </p>
          <EditList title="Page meta" ids={metaIds} onOpen={setOpenId} />
          <EditList title="Unsaved edits" ids={unsavedIds} onOpen={setOpenId} />
          <EditList
            title="Saved this session (your PR)"
            ids={savedIds}
            onOpen={setOpenId}
          />
        </aside>
      ) : null}
      <div className="vexl-copy-editor vexl-copy-editor__toolbar">
        {session.enabled ? (
          <button type="button" onClick={toggleList}>
            Edits ({unsavedIds.length} unsaved, {savedIds.length} saved)
          </button>
        ) : null}
        <button
          type="button"
          aria-pressed={session.enabled}
          onClick={() => {
            updateSession((s) => ({...s, enabled: !s.enabled}))
            setOpenId(undefined)
            setMetaIds(undefined)
          }}
        >
          {session.enabled ? 'Stop editing' : 'Edit copy'}
        </button>
      </div>
    </>
  )
}
