'use client'

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  Field,
  Input,
} from '@/src/components/ui'
import {usePublicHosts} from '@/src/services/publicHosts'
import {
  PublicSlug,
  type TvSlideshow,
  type UpdateSlideshowRequest,
} from '@/src/services/slideshows/domain'
import {Array, Schema} from 'effect'
import {type ReactNode, type SyntheticEvent, useEffect, useState} from 'react'
import {SlideList} from './SlideList'
import {slideError, useSlides} from './useSlides'

export function SlideshowForm({
  slideshowUuid,
  initial,
  submitLabel,
  savedMessage,
  aside,
  onSubmit,
}: {
  readonly slideshowUuid: string
  readonly initial?: TvSlideshow
  readonly submitLabel: string
  readonly savedMessage?: string
  readonly aside?: ReactNode
  readonly onSubmit: (data: UpdateSlideshowRequest) => Promise<void>
}) {
  const hosts = usePublicHosts()
  const [name, setName] = useState(initial?.name ?? '')
  const [publicSlug, setPublicSlug] = useState(initial?.publicSlug ?? '')
  const [isEnabled, setIsEnabled] = useState(initial?.isEnabled ?? true)
  const slides = useSlides(slideshowUuid, initial?.slides ?? [])
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const draft: UpdateSlideshowRequest = {
    name: name.trim(),
    publicSlug: publicSlug.trim() || null,
    isEnabled,
    slides: slides.slides,
  }
  const serializedDraft = JSON.stringify(draft)
  const [savedDraft, setSavedDraft] = useState(serializedDraft)
  const [justSaved, setJustSaved] = useState(false)
  const dirty = serializedDraft !== savedDraft

  const nameValid = draft.name !== ''
  const slugValid =
    draft.publicSlug === null || Schema.is(PublicSlug)(draft.publicSlug)
  const invalid =
    !nameValid ||
    !slugValid ||
    Array.some(slides.slides, (slide) => slideError(slide) !== null)
  const nameError =
    showErrors && !nameValid ? 'Give the slideshow a name' : null
  const slugError =
    showErrors && !slugValid
      ? '3 to 32 lowercase letters, numbers or hyphens, with no hyphen at either end'
      : null

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
    }
  }, [dirty])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    setSubmitError(null)
    if (invalid) return

    setSaving(true)
    try {
      await onSubmit(draft)
      setSavedDraft(serializedDraft)
      setJustSaved(true)
      setShowErrors(false)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to save slideshow'
      )
    } finally {
      setSaving(false)
    }
  }

  const error =
    showErrors && invalid ? 'Fix the highlighted fields first.' : submitError

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="space-y-6 xl:sticky xl:top-8 xl:col-start-2 xl:row-start-1">
        <Card title="Details">
          <div className="space-y-5">
            <Field
              label="Name"
              required
              hint="Only admins see it."
              error={nameError}
            >
              <Input
                value={name}
                invalid={nameError !== null}
                placeholder="Office lobby TV"
                onChange={(event) => {
                  setName(event.target.value)
                }}
              />
            </Field>
            <Field
              label="Public slug"
              hint={`Optional. Gives the TV a readable link: ${hosts.slideshows}/${draft.publicSlug ?? 'office-tv'}`}
              error={slugError}
            >
              <Input
                value={publicSlug}
                invalid={slugError !== null}
                placeholder="office-tv"
                onChange={(event) => {
                  setPublicSlug(event.target.value.toLowerCase())
                }}
              />
            </Field>
            <Checkbox
              label="Enabled"
              description="When off, the TV link shows “Slideshow not found”."
              checked={isEnabled}
              onChange={(event) => {
                setIsEnabled(event.target.checked)
              }}
            />
          </div>
        </Card>
        {aside}
      </div>

      <div className="min-w-0 xl:col-start-1 xl:row-start-1">
        <SlideList slides={slides} showErrors={showErrors} />
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 rounded-card border border-line bg-surface px-4 py-3 shadow-card xl:col-span-2">
        <div className="mr-auto min-w-0 text-sm text-ink-muted">
          {error ? (
            <Alert tone="error">{error}</Alert>
          ) : slides.uploading ? (
            'Uploading…'
          ) : dirty ? (
            'Unsaved changes'
          ) : justSaved ? (
            savedMessage
          ) : null}
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/slideshows">Cancel</ButtonLink>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={slides.uploading}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
