'use client'

import {useCmsImageUpload} from '@/src/hooks/useCms'
import {toDateTimeLocal} from '@/src/services/cms/dateTimeLocal'
import {
  EventInput,
  type CmsEvent,
  type CmsStatus,
} from '@vexl-next/domain/src/general/cms'
import {Array, Either, Option, pipe, Schema} from 'effect'
import {useRef, useState} from 'react'
import {type CmsFormProps} from './CmsEditor'
import {CmsFormFooter} from './CmsFormFooter'
import {Field, ImageField, inputClassName} from './fields'

interface SpeakerDraft {
  readonly key: string
  readonly name: string
  readonly linkToSocials: string
  readonly imageUrl: string
}

interface EventDraft {
  readonly name: string
  readonly venue: string
  readonly link: string
  readonly startDate: string
  readonly endDate: string
  readonly goldenGlasses: boolean
  readonly speakers: readonly SpeakerDraft[]
}

const emptySpeaker = (): SpeakerDraft => ({
  key: crypto.randomUUID(),
  name: '',
  linkToSocials: '',
  imageUrl: '',
})

const draftFromEvent = (event: CmsEvent | null): EventDraft =>
  event === null
    ? {
        name: '',
        venue: '',
        link: '',
        startDate: '',
        endDate: '',
        goldenGlasses: false,
        speakers: [],
      }
    : {
        name: event.name,
        venue: event.venue,
        link: event.link,
        startDate: toDateTimeLocal(event.startDate),
        endDate: Option.match(event.endDate, {
          onNone: () => '',
          onSome: toDateTimeLocal,
        }),
        goldenGlasses: event.goldenGlasses,
        speakers: Array.map(event.speakers, (speaker) => ({
          key: crypto.randomUUID(),
          name: speaker.name,
          linkToSocials: Option.getOrElse(speaker.linkToSocials, () => ''),
          imageUrl: Option.getOrElse(speaker.imageUrl, () => ''),
        })),
      }

const optional = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim()

const toInput = (draft: EventDraft): Either.Either<EventInput, string> =>
  draft.endDate !== '' && draft.endDate < draft.startDate
    ? Either.left('The event cannot end before it starts.')
    : Schema.decodeUnknownEither(EventInput)({
        name: draft.name.trim(),
        venue: draft.venue.trim(),
        link: draft.link.trim(),
        startDate: draft.startDate,
        endDate: optional(draft.endDate),
        goldenGlasses: draft.goldenGlasses,
        speakers: Array.map(draft.speakers, (speaker) => ({
          name: speaker.name.trim(),
          linkToSocials: optional(speaker.linkToSocials),
          imageUrl: optional(speaker.imageUrl),
        })),
      }).pipe(Either.mapLeft((error) => error.message))

type Props = CmsFormProps<CmsEvent, EventInput>

export function EventForm({
  item,
  saving,
  error,
  success,
  onSave,
  onUnpublish,
}: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const uploadImage = useCmsImageUpload()
  const [draft, setDraft] = useState(() => draftFromEvent(item))
  const [validationError, setValidationError] = useState<string | null>(null)
  const status: CmsStatus = item?.status ?? 'draft'

  const updateSpeaker = (key: string, changes: Partial<SpeakerDraft>) => {
    setDraft((current) => ({
      ...current,
      speakers: Array.map(current.speakers, (speaker) =>
        speaker.key === key ? {...speaker, ...changes} : speaker
      ),
    }))
  }

  const handleSave = (publish: boolean) => {
    setValidationError(null)
    if (!formRef.current?.reportValidity()) return
    Either.match(toInput(draft), {
      onLeft: setValidationError,
      onRight: (input) => {
        onSave(input, publish)
      },
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        handleSave(false)
      }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 gap-6 rounded-lg bg-white p-6 shadow-sm md:grid-cols-2">
        <Field label="Name *">
          <input
            type="text"
            required
            value={draft.name}
            onChange={(e) => {
              setDraft({...draft, name: e.target.value})
            }}
            className={inputClassName}
          />
        </Field>
        <Field label="Venue *">
          <input
            type="text"
            required
            value={draft.venue}
            onChange={(e) => {
              setDraft({...draft, venue: e.target.value})
            }}
            className={inputClassName}
          />
        </Field>
        <Field label="Link *">
          <input
            type="url"
            required
            value={draft.link}
            onChange={(e) => {
              setDraft({...draft, link: e.target.value})
            }}
            className={inputClassName}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={draft.goldenGlasses}
            onChange={(e) => {
              setDraft({...draft, goldenGlasses: e.target.checked})
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          Golden glasses
        </label>
        <Field label="Starts *">
          <input
            type="datetime-local"
            required
            value={draft.startDate}
            onChange={(e) => {
              setDraft({...draft, startDate: e.target.value})
            }}
            className={inputClassName}
          />
        </Field>
        <Field label="Ends">
          <input
            type="datetime-local"
            value={draft.endDate}
            onChange={(e) => {
              setDraft({...draft, endDate: e.target.value})
            }}
            className={inputClassName}
          />
        </Field>
      </div>

      <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Speakers</h2>
          <button
            type="button"
            onClick={() => {
              setDraft({
                ...draft,
                speakers: Array.append(draft.speakers, emptySpeaker()),
              })
            }}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Add speaker
          </button>
        </div>
        {draft.speakers.length === 0 && (
          <p className="text-sm text-gray-500">No speakers</p>
        )}
        {Array.map(draft.speakers, (speaker) => (
          <div
            key={speaker.key}
            className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 p-4 md:grid-cols-2"
          >
            <Field label="Name *">
              <input
                type="text"
                required
                value={speaker.name}
                onChange={(e) => {
                  updateSpeaker(speaker.key, {name: e.target.value})
                }}
                className={inputClassName}
              />
            </Field>
            <Field label="Link to socials">
              <input
                type="url"
                value={speaker.linkToSocials}
                onChange={(e) => {
                  updateSpeaker(speaker.key, {linkToSocials: e.target.value})
                }}
                className={inputClassName}
              />
            </Field>
            <ImageField
              label="Photo"
              value={speaker.imageUrl}
              onChange={(imageUrl) => {
                updateSpeaker(speaker.key, {imageUrl})
              }}
              uploadImage={uploadImage}
            />
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => {
                  setDraft((current) => ({
                    ...current,
                    speakers: pipe(
                      current.speakers,
                      Array.filter((one) => one.key !== speaker.key)
                    ),
                  }))
                }}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Remove speaker
              </button>
            </div>
          </div>
        ))}
      </section>

      <CmsFormFooter
        status={status}
        saving={saving}
        error={validationError ?? error}
        success={success}
        onSave={handleSave}
        onUnpublish={onUnpublish}
      />
    </form>
  )
}
