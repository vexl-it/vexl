'use client'

import {Array, Either, Option, pipe, Record, Schema} from 'effect'
import {useRouter} from 'next/navigation'
import React, {useEffect, useState} from 'react'
import {parseInlineCopy} from '../copy/inlineCopy'
import './CopyEditor.css'
import {saveCopy, type SaveCopyResult} from './saveCopy'

type Copy = Readonly<Record<string, Readonly<Record<string, string>>>>

const Session = Schema.Struct({
  enabled: Schema.Boolean,
  /** Edited but not saved, by `page:key`. */
  drafts: Schema.Record({key: Schema.String, value: Schema.String}),
  /** Saved from this browser tab, by `page:key`. */
  saved: Schema.Record({key: Schema.String, value: Schema.String}),
})
type Session = typeof Session.Type

const SESSION_KEY = 'vexl-foundation-copy-editor'
const emptySession: Session = {enabled: false, drafts: {}, saved: {}}
const decodeSession = Schema.decodeUnknownOption(Schema.parseJson(Session))
const META_KEY = /(?:^|\.)meta\./

function splitId(id: string): {readonly page: string; readonly key: string} {
  const separator = id.indexOf(':')
  return {page: id.slice(0, separator), key: id.slice(separator + 1)}
}

function currentValue(copy: Copy, id: string): Option.Option<string> {
  const {page, key} = splitId(id)
  return pipe(
    Option.fromNullable(copy[page]),
    Option.flatMap((pageValues) => Record.get(pageValues, key))
  )
}

const valueProblem = (value: string): Option.Option<string> =>
  Either.match(parseInlineCopy(value), {
    onLeft: (error) => Option.some(error.message),
    onRight: () => Option.none(),
  })

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
    Array.dedupe
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
  readonly saved: string
  readonly draft: string
  readonly onDraft: (value: string) => void
  readonly onSaved: (value: string) => void
  readonly onClose: () => void
}): React.JSX.Element {
  const [status, setStatus] = useState<
    | {readonly type: 'saving'}
    | {readonly type: 'error'; readonly message: string}
  >()
  const problem = valueProblem(draft)
  const isValid = Option.isNone(problem)
  const isChanged = draft !== saved

  const save = async (): Promise<void> => {
    setStatus({type: 'saving'})
    const {page, key} = splitId(id)
    const result = await saveCopy({page, key, value: draft}).catch(
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
      <label className="vexl-copy-editor__field">
        <span>English</span>
        <textarea
          value={draft}
          rows={Math.max(3, draft.split('\n').length + 1)}
          onChange={(event) => {
            onDraft(event.target.value)
          }}
        />
        {Option.match(problem, {
          onNone: () => null,
          onSome: (message) => (
            <em className="vexl-copy-editor__error">{message}</em>
          ),
        })}
      </label>
      <p className="vexl-copy-editor__hint">
        Allowed: **bold**, *italic*, [link text](https://…, mailto:… or /path)
        and new lines.
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
          {status?.type === 'saving' ? 'Saving…' : 'Save'}
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

/** The `next dev` copy editor: click marked text to edit its copy. */
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
      Option.match(currentValue(copy, id), {
        onNone: () => false,
        onSome: (saved) => draft !== saved,
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
                Option.map((pageValues) =>
                  pipe(
                    Record.keys(pageValues),
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
      Option.map(currentValue(copy, id), (saved) => ({id, saved}))
    ),
    Option.match({
      onNone: () => null,
      onSome: ({id, saved}) => (
        <EditPanel
          key={id}
          id={id}
          saved={saved}
          draft={Option.getOrElse(Record.get(session.drafts, id), () => saved)}
          onDraft={(value) => {
            updateSession((s) => ({
              ...s,
              drafts: {...s.drafts, [id]: value},
            }))
          }}
          onSaved={(value) => {
            updateSession((s) => ({
              ...s,
              drafts: Record.remove(s.drafts, id),
              saved: {...s.saved, [id]: value},
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
