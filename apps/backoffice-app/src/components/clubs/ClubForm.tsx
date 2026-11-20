'use client'

import {
  Button,
  buttonClassName,
  ButtonLink,
  Card,
  cx,
  Field,
  FormMessage,
  Input,
  Spinner,
  Textarea,
} from '@/src/components/ui'
import {useClubImageUpload} from '@/src/hooks/useClubImageUpload'
import {HttpUrl} from '@/src/services/urlSchemas'
import {
  ClubInfoAdminInput,
  ClubUuid,
  type ClubInfo,
} from '@vexl-next/domain/src/general/clubs'
import {Array, Option, pipe, Predicate, Schema} from 'effect'
import {useState} from 'react'
import {ClubAvatar} from './ClubAvatar'
import {
  ClubImageCropper,
  loadImageToCrop,
  type ImageToCrop,
} from './ClubImageCropper'

const YEAR_MS = 365 * 24 * 60 * 60 * 1000

export interface ClubFormValues {
  readonly uuid: string
  readonly name: string
  readonly description: string
  readonly clubImageUrl: string
  readonly membersCountLimit: string
  readonly reportLimit: string
  /** `YYYY-MM-DD`, read as a UTC midnight. */
  readonly validUntil: string
}

type FieldErrors = {readonly [Field in keyof ClubFormValues]?: string}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10)

const newClubFormValues = (): ClubFormValues => ({
  uuid: crypto.randomUUID(),
  name: '',
  description: '',
  clubImageUrl: '',
  membersCountLimit: '100',
  reportLimit: '10',
  validUntil: isoDay(new Date(Date.now() + YEAR_MS)),
})

export const clubFormValues = (club: ClubInfo): ClubFormValues => ({
  uuid: club.uuid,
  name: club.name,
  description: Option.getOrElse(club.description, () => ''),
  clubImageUrl: club.clubImageUrl,
  membersCountLimit: String(club.membersCountLimit),
  reportLimit: String(club.reportLimit),
  validUntil: isoDay(club.validUntil),
})

const isPositiveInt = (value: string): boolean =>
  /^\d+$/.test(value) && Number(value) > 0

const validate = (values: ClubFormValues): FieldErrors => ({
  uuid: Schema.is(ClubUuid)(values.uuid) ? undefined : 'Enter a valid UUID.',
  name: values.name.trim() ? undefined : 'Enter a name.',
  clubImageUrl: Schema.is(HttpUrl)(values.clubImageUrl)
    ? undefined
    : 'Upload an image or paste its URL.',
  membersCountLimit: isPositiveInt(values.membersCountLimit)
    ? undefined
    : 'Enter a whole number above 0.',
  reportLimit: isPositiveInt(values.reportLimit)
    ? undefined
    : 'Enter a whole number above 0. A club with report limit 0 is deactivated the next time the cleanup job runs.',
  validUntil: values.validUntil ? undefined : 'Pick a date.',
})

const toClubInput = (values: ClubFormValues): ClubInfoAdminInput =>
  Schema.decodeSync(ClubInfoAdminInput)({
    uuid: values.uuid,
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    clubImageUrl: values.clubImageUrl,
    membersCountLimit: Number(values.membersCountLimit),
    reportLimit: Number(values.reportLimit),
    validUntil: new Date(values.validUntil).toISOString(),
  })

function ClubImageField({
  value,
  clubName,
  error,
  imageUpload: {upload, uploading, error: uploadError},
  onChange,
}: {
  readonly value: string
  readonly clubName: string
  readonly error: string | undefined
  readonly imageUpload: ReturnType<typeof useClubImageUpload>
  readonly onChange: (url: string) => void
}) {
  // The file just uploaded, shown without waiting for the CDN to serve it.
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [imageToCrop, setImageToCrop] = useState<ImageToCrop | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)

  const handlePick = async (file: File) => {
    setPickError(null)
    try {
      setImageToCrop(await loadImageToCrop(file))
    } catch (loadError) {
      setPickError(
        loadError instanceof Error ? loadError.message : 'Failed to open file.'
      )
    }
  }
  const closeCropper = () => {
    if (imageToCrop) URL.revokeObjectURL(imageToCrop.image.src)
    setImageToCrop(null)
  }
  const handleCropped = async (file: File) => {
    closeCropper()
    const url = await upload(file)
    if (url === null) return
    setLocalPreview(URL.createObjectURL(file))
    onChange(url)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <ClubAvatar src={localPreview ?? value} name={clubName} size="lg" />
      <div className="min-w-0 flex-1 space-y-3">
        <Field
          label="Image URL"
          required
          error={pickError ?? uploadError ?? error}
          hint="Filled in when you upload a file. You can also paste a URL."
        >
          <Input
            type="url"
            value={value}
            invalid={!!error}
            placeholder="https://resources.vexl.it/clubs/…"
            onChange={(e) => {
              setLocalPreview(null)
              setPickError(null)
              onChange(e.target.value)
            }}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={cx(
              buttonClassName({size: 'sm'}),
              'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
              uploading && 'pointer-events-none opacity-50'
            )}
          >
            {uploading ? <Spinner /> : null}
            {uploading ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void handlePick(file)
              }}
            />
          </label>
          <span className="text-xs text-ink-muted">
            Any image. You crop it to a square before it uploads.
          </span>
        </div>
      </div>
      {imageToCrop ? (
        <ClubImageCropper
          source={imageToCrop}
          onCancel={closeCropper}
          onCropped={(file) => {
            void handleCropped(file)
          }}
        />
      ) : null}
    </div>
  )
}

export function ClubForm({
  initial,
  submitLabel,
  successMessage,
  onSubmit,
}: {
  /** Omit for a new club, whose UUID can still be chosen. */
  readonly initial?: ClubFormValues
  readonly submitLabel: string
  readonly successMessage?: string
  readonly onSubmit: (club: ClubInfoAdminInput) => Promise<void>
}) {
  const [values, setValues] = useState(initial ?? newClubFormValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const imageUpload = useClubImageUpload()

  const set = (field: keyof ClubFormValues) => (value: string) => {
    setValues((current) => ({...current, [field]: value}))
    setErrors((current) => ({...current, [field]: undefined}))
    setSubmitError(null)
    setSaved(false)
  }
  const bind = (field: keyof ClubFormValues) => ({
    value: values[field],
    invalid: !!errors[field],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      set(field)(e.target.value)
    },
  })

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fieldErrors = validate(values)
    setErrors(fieldErrors)
    setSaved(false)
    if (pipe(Object.values(fieldErrors), Array.some(Predicate.isString))) {
      setSubmitError('Fix the highlighted fields.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(toClubInput(values))
      setSaved(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to save the club.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card title="Details" description="Shown to members in the Vexl app.">
        <div className="space-y-5">
          <Field label="Name" required error={errors.name}>
            <Input {...bind('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} {...bind('description')} />
          </Field>
          <ClubImageField
            imageUpload={imageUpload}
            value={values.clubImageUrl}
            clubName={values.name}
            error={errors.clubImageUrl}
            onChange={set('clubImageUrl')}
          />
        </div>
      </Card>

      <Card title="Limits and validity">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Member limit"
              required
              error={errors.membersCountLimit}
              hint="Nobody can join once the club has this many members."
            >
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                {...bind('membersCountLimit')}
              />
            </Field>
            <Field
              label="Report limit"
              required
              error={errors.reportLimit}
              hint="The club is deactivated when its reports reach this number."
            >
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                {...bind('reportLimit')}
              />
            </Field>
          </div>
          <Field
            label="Valid until"
            required
            error={errors.validUntil}
            hint="The club expires at 00:00 UTC on this day and is then deactivated."
            className="sm:max-w-xs"
          >
            <Input type="date" {...bind('validUntil')} />
          </Field>
        </div>
      </Card>

      {initial ? null : (
        <Card title="Identifier">
          <Field
            label="UUID"
            required
            error={errors.uuid}
            hint="Generated for you. Change it only if the club needs a specific UUID."
          >
            <Input className="font-mono" {...bind('uuid')} />
          </Field>
        </Card>
      )}

      <FormMessage
        error={submitError}
        success={saved && successMessage ? successMessage : null}
      />
      <div className="flex justify-end gap-2">
        <ButtonLink href="/clubs">Cancel</ButtonLink>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={imageUpload.uploading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
