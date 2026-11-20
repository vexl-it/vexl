'use client'

import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '@/src/components/ui'
import {toDateTimeLocal} from '@/src/services/cms/dateTimeLocal'
import {eventResource} from '@/src/services/cms/resources'
import {EventInput, type CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Array, Either, Option, Schema} from 'effect'
import {CmsEditor, type CmsFieldsProps} from './CmsEditor'
import {ImageField} from './ImageField'

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

type Fields = CmsFieldsProps<CmsEvent, EventDraft>

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

const endsBeforeStart = (draft: EventDraft): boolean =>
  draft.endDate !== '' && draft.endDate < draft.startDate

const toInput = (draft: EventDraft): Either.Either<EventInput, string> =>
  endsBeforeStart(draft)
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

function EventDetails({draft, setDraft, uploadImage}: Fields) {
  const update = (changes: Partial<EventDraft>) => {
    setDraft((current) => ({...current, ...changes}))
  }
  const updateSpeaker = (key: string, changes: Partial<SpeakerDraft>) => {
    setDraft((current) => ({
      ...current,
      speakers: Array.map(current.speakers, (speaker) =>
        speaker.key === key ? {...speaker, ...changes} : speaker
      ),
    }))
  }
  return (
    <>
      <Card title="Event details">
        <div className="space-y-5">
          <Field label="Name" required>
            <Input
              required
              value={draft.name}
              onChange={(e) => {
                update({name: e.target.value})
              }}
              className="h-11 text-lg font-semibold"
            />
          </Field>
          <Field
            label="Venue"
            required
            hint="Place, city and country, the way visitors should read it."
          >
            <Input
              required
              value={draft.venue}
              onChange={(e) => {
                update({venue: e.target.value})
              }}
            />
          </Field>
          <Field
            label="Link"
            required
            hint="The event's website or sign-up page."
          >
            <Input
              type="url"
              required
              placeholder="https://…"
              value={draft.link}
              onChange={(e) => {
                update({link: e.target.value})
              }}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Starts" required hint="In your local time.">
              <Input
                type="datetime-local"
                required
                value={draft.startDate}
                onChange={(e) => {
                  update({startDate: e.target.value})
                }}
              />
            </Field>
            <Field
              label="Ends"
              hint="Optional."
              error={
                endsBeforeStart(draft) ? 'Ends before the event starts.' : null
              }
            >
              <Input
                type="datetime-local"
                invalid={endsBeforeStart(draft)}
                value={draft.endDate}
                onChange={(e) => {
                  update({endDate: e.target.value})
                }}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="Speakers"
        description="The people speaking at the event."
        actions={
          <Button
            size="sm"
            icon={<PlusIcon />}
            onClick={() => {
              setDraft((current) => ({
                ...current,
                speakers: Array.append(current.speakers, emptySpeaker()),
              }))
            }}
          >
            Add speaker
          </Button>
        }
        flush
      >
        {Array.isNonEmptyReadonlyArray(draft.speakers) ? (
          <ul className="divide-y divide-line">
            {Array.map(draft.speakers, (speaker, index) => (
              <li key={speaker.key} className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                    Speaker {index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<TrashIcon />}
                    className="hover:text-danger"
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        speakers: Array.filter(
                          current.speakers,
                          (one) => one.key !== speaker.key
                        ),
                      }))
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name" required>
                    <Input
                      required
                      value={speaker.name}
                      onChange={(e) => {
                        updateSpeaker(speaker.key, {name: e.target.value})
                      }}
                    />
                  </Field>
                  <Field label="Link to socials">
                    <Input
                      type="url"
                      placeholder="https://…"
                      value={speaker.linkToSocials}
                      onChange={(e) => {
                        updateSpeaker(speaker.key, {
                          linkToSocials: e.target.value,
                        })
                      }}
                    />
                  </Field>
                </div>
                <ImageField
                  label="Photo URL"
                  value={speaker.imageUrl}
                  onChange={(imageUrl) => {
                    updateSpeaker(speaker.key, {imageUrl})
                  }}
                  uploadImage={uploadImage}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<UsersIcon className="size-5" />}
            title="No speakers"
            description="Add the people speaking at the event."
          />
        )}
      </Card>
    </>
  )
}

function EventOptions({draft, setDraft}: Fields) {
  return (
    <Card title="Options">
      <Checkbox
        label="Golden glasses"
        description="A chosen meetup where attendees get golden glasses for their avatar."
        checked={draft.goldenGlasses}
        onChange={(e) => {
          setDraft((current) => ({...current, goldenGlasses: e.target.checked}))
        }}
      />
    </Card>
  )
}

export function EventEditor({id}: {readonly id: string | null}) {
  return (
    <CmsEditor
      resource={eventResource}
      id={id}
      toDraft={draftFromEvent}
      toInput={toInput}
      Main={EventDetails}
      Side={EventOptions}
    />
  )
}
