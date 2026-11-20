'use client'

import {
  Button,
  CopyButton,
  cx,
  Field,
  FormMessage,
  Input,
  Modal,
} from '@/src/components/ui'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {publicUrl, usePublicHosts} from '@/src/services/publicHosts'
import {createShortLink} from '@/src/services/shortLinks/api'
import {
  isHttpUrl,
  isShortLinkSlug,
  type ShortLink,
} from '@/src/services/shortLinks/domain'
import {Array} from 'effect'
import {useState} from 'react'

const errorMessage = makeApiErrorMessage({})
const FORM_ID = 'create-short-link'

export function CreateShortLinkModal({
  takenSlugs,
  onCreated,
  onClose,
}: {
  readonly takenSlugs: readonly string[]
  readonly onCreated: (link: ShortLink) => void
  readonly onClose: () => void
}) {
  const hosts = usePublicHosts()
  const [targetUrl, setTargetUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<ShortLink | null>(null)

  const target = targetUrl.trim()
  const customSlug = slug.trim()
  const targetError = isHttpUrl(target)
    ? null
    : 'Enter a full URL starting with https:// or http://'
  const shownTargetError = attempted ? targetError : null
  const slugError =
    customSlug === ''
      ? null
      : !isShortLinkSlug(customSlug)
        ? 'Use up to 64 letters, digits and dashes, starting and ending with a letter or digit.'
        : Array.contains(takenSlugs, customSlug)
          ? 'This slug is already used by another link.'
          : null

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttempted(true)
    if (targetError || slugError) return

    setSubmitting(true)
    setError(null)
    try {
      const result = await createShortLink({
        targetUrl: target,
        ...(customSlug ? {slug: customSlug} : {}),
      })
      onCreated(result.link)
      setCreated(result.link)
    } catch (createError) {
      setError(errorMessage(createError))
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    const shortUrl = publicUrl(hosts.shortLinks, created.slug)
    return (
      <Modal
        open
        onClose={onClose}
        title="Short link created"
        description="It works right away. Copy it and share it."
        footer={
          <>
            <Button
              onClick={() => {
                setCreated(null)
                setTargetUrl('')
                setSlug('')
                setAttempted(false)
              }}
            >
              Create another
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-control border border-line bg-surface-muted py-2 pr-2 pl-3">
          <span className="min-w-0 flex-1 font-mono font-medium break-all">
            {shortUrl}
          </span>
          <CopyButton value={shortUrl} variant="primary" />
        </div>
        <p className="mt-3 break-all text-ink-muted">
          Redirects to {created.targetUrl}
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New short link"
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={submitting}
          >
            Create link
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Field
          label="Target URL"
          required
          hint="Where the short link sends people."
          error={shownTargetError}
        >
          <Input
            type="url"
            autoFocus
            value={targetUrl}
            onChange={(event) => {
              setTargetUrl(event.target.value)
            }}
            placeholder="https://vexl.it/…"
            invalid={shownTargetError !== null}
          />
        </Field>
        <Field
          label="Slug"
          hint="Optional. Leave empty to get a random 6-character slug. It cannot be changed later."
          error={slugError}
        >
          <div
            className={cx(
              'flex h-9 items-center rounded-control border bg-surface shadow-card transition-shadow focus-within:ring-3',
              slugError
                ? 'border-danger focus-within:ring-danger/20'
                : 'border-line-strong focus-within:border-focus focus-within:ring-accent/40'
            )}
          >
            <span className="pl-3 font-mono text-xs text-ink-subtle">
              {hosts.shortLinks}/
            </span>
            <input
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value.toLowerCase())
              }}
              placeholder="random"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={slugError !== null}
              className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-0.5 font-mono text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </div>
        </Field>
        <FormMessage error={error} />
      </form>
    </Modal>
  )
}
