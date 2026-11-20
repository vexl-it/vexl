'use client'

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  cx,
  Field,
  FormMessage,
  Input,
  Modal,
  Page,
  PageHeader,
  Textarea,
  useConfirm,
} from '@/src/components/ui'
import {useAdminApi} from '@/src/hooks/useAdminApi'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {makeContentAdminClient} from '@/src/services/contentAdminApi'
import {
  VexlProductNotificationUuid,
  type VexlProductNotification,
} from '@vexl-next/domain/src/general/vexlProductNotification'
import {Array, Option, Predicate, Schema} from 'effect'
import {useState, type SyntheticEvent} from 'react'
import {
  NOTIFICATION_TYPE_ORDER,
  NOTIFICATION_TYPES,
  NotificationPreview,
  NotificationSummary,
  type NotificationContent,
  type NotificationType,
} from '../NotificationPreview'

interface Draft {
  readonly uuid: string
  readonly title: string
  readonly description: string
  readonly type: NotificationType
  readonly actionLink: string
  readonly actionText: string
  readonly issuePushNotification: boolean
}

const HISTORY = {href: '/product-notification', label: 'Product notifications'}

const errorMessage = makeApiErrorMessage({
  DuplicateVexlProductNotificationUuidError:
    'A notification with this ID already exists, so it was probably sent already. Check the history before sending again.',
})

const emptyDraft = (): Draft => ({
  uuid: crypto.randomUUID(),
  title: '',
  description: '',
  type: 'GENERAL',
  actionLink: '',
  actionText: '',
  issuePushNotification: false,
})

const contentOf = (draft: Draft): NotificationContent => {
  const actionLink = draft.actionLink.trim()
  const actionText = draft.actionText.trim()
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    type: draft.type,
    issuePushNotification: draft.issuePushNotification,
    ...(actionLink === '' ? {} : {actionLink}),
    ...(actionText === '' ? {} : {actionText}),
  }
}

const validate = (
  {title, description, actionLink, actionText}: NotificationContent,
  uuid: Option.Option<VexlProductNotificationUuid>
) => ({
  title: title === '' ? 'Add a title.' : undefined,
  description: description === '' ? 'Add a description.' : undefined,
  actionLink:
    actionLink !== undefined && !URL.canParse(actionLink)
      ? 'Enter a full link, for example https://vexl.it/blog.'
      : undefined,
  actionText:
    actionText !== undefined && actionLink === undefined
      ? 'The button only shows when there is a link. Add a link or remove this text.'
      : undefined,
  uuid: Option.isNone(uuid) ? 'Enter a valid UUID.' : undefined,
})

export default function NewProductNotificationPage() {
  const api = useAdminApi(makeContentAdminClient, errorMessage)
  const {confirm, dialog} = useConfirm()
  const [draft, setDraft] = useState(emptyDraft)
  const [showErrors, setShowErrors] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sent, setSent] = useState<VexlProductNotification | null>(null)

  const content = contentOf(draft)
  const uuid = Schema.decodeUnknownOption(VexlProductNotificationUuid)(
    draft.uuid.trim()
  )
  const errors = validate(content, uuid)
  const shown: Partial<typeof errors> = showErrors ? errors : {}
  const isDirty =
    content.title !== '' ||
    content.description !== '' ||
    content.actionLink !== undefined ||
    content.actionText !== undefined

  const update = (changes: Partial<Draft>) => {
    setDraft((current) => ({...current, ...changes}))
  }

  const startOver = () => {
    setDraft(emptyDraft())
    setShowErrors(false)
    setSendError(null)
    setSent(null)
  }

  const clear = async () => {
    if (
      isDirty &&
      !(await confirm({
        title: 'Clear this draft?',
        message: 'Everything you typed will be removed.',
        confirmLabel: 'Clear draft',
      }))
    )
      return
    startOver()
  }

  const review = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    if (Array.some(Object.values(errors), Predicate.isString)) return
    setAcknowledged(false)
    setSendError(null)
    setReviewing(true)
  }

  const send = async () => {
    if (Option.isNone(uuid)) return
    setSending(true)
    setSendError(null)
    try {
      const result = await api((client) =>
        client.createVexlProductNotification({
          payload: {
            vexlProductNotification: {
              ...content,
              uuid: uuid.value,
              date: new Date(),
            },
            issuePushNotification: content.issuePushNotification,
          },
        })
      )
      setSent(result.vexlProductNotification)
      setReviewing(false)
    } catch (error) {
      setSendError(errorMessage(error))
    } finally {
      setSending(false)
    }
  }

  if (sent)
    return (
      <Page narrow>
        <PageHeader title="Notification sent" back={HISTORY} />
        <Alert tone="success" title="The notification is out">
          {sent.issuePushNotification
            ? 'Push delivery has started, and the notification now shows in the app.'
            : 'It shows in the app the next time users open it.'}
        </Alert>
        <Card title="What users see">
          <NotificationPreview notification={sent} />
        </Card>
        <div className="flex justify-end gap-2">
          <Button onClick={startOver}>Compose another</Button>
          <ButtonLink href={HISTORY.href} variant="primary">
            View history
          </ButtonLink>
        </div>
      </Page>
    )

  return (
    <Page>
      <PageHeader
        title="New product notification"
        description="Write the notification, check the preview, then review and send. Nothing is sent until you confirm."
        back={HISTORY}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={review} noValidate>
          {/* A dismissed review dialog must not let the draft change mid-send. */}
          <fieldset disabled={sending} className="min-w-0 space-y-6">
            <Card title="Message">
              <div className="space-y-5">
                <Field
                  label="Title"
                  required
                  error={shown.title}
                  hint={`Keep it short: push banners cut long titles off. ${content.title.length} characters.`}
                >
                  <Input
                    value={draft.title}
                    invalid={shown.title !== undefined}
                    onChange={(event) => {
                      update({title: event.target.value})
                    }}
                  />
                </Field>
                <Field
                  label="Description"
                  required
                  error={shown.description}
                  hint={`The app shows it right after the title, as one paragraph. ${content.description.length} characters.`}
                >
                  <Textarea
                    rows={5}
                    value={draft.description}
                    invalid={shown.description !== undefined}
                    onChange={(event) => {
                      update({description: event.target.value})
                    }}
                  />
                </Field>
              </div>
            </Card>

            <Card
              title="Button"
              description="Optional. Adds a button under the text that opens a link."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Link"
                  error={shown.actionLink}
                  hint="Opens outside the app when the button is tapped."
                >
                  <Input
                    type="url"
                    placeholder="https://"
                    value={draft.actionLink}
                    invalid={shown.actionLink !== undefined}
                    onChange={(event) => {
                      update({actionLink: event.target.value})
                    }}
                  />
                </Field>
                <Field
                  label="Button text"
                  error={shown.actionText}
                  hint="Leave empty to use “Learn more”, which the app translates."
                >
                  <Input
                    value={draft.actionText}
                    invalid={shown.actionText !== undefined}
                    onChange={(event) => {
                      update({actionText: event.target.value})
                    }}
                  />
                </Field>
              </div>
            </Card>

            <Card title="Audience and delivery">
              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium text-ink">
                    Type
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.map(NOTIFICATION_TYPE_ORDER, (type) => (
                      <label
                        key={type}
                        className={cx(
                          'flex cursor-pointer items-start gap-2.5 rounded-control border p-3 text-sm',
                          draft.type === type
                            ? 'border-ink ring-1 ring-ink'
                            : 'border-line-strong hover:bg-surface-muted'
                        )}
                      >
                        <input
                          type="radio"
                          name="type"
                          className="mt-0.5 size-4 shrink-0 accent-ink"
                          checked={draft.type === type}
                          onChange={() => {
                            update({type})
                          }}
                        />
                        <span>
                          <span className="font-medium text-ink">
                            {NOTIFICATION_TYPES[type].label}
                          </span>
                          <span className="block text-ink-muted">
                            {NOTIFICATION_TYPES[type].audience}. Labelled “
                            {NOTIFICATION_TYPES[type].appCategory}” in the app.
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Checkbox
                  label="Also send a push notification"
                  description="Phones get a push with the title and description. Without it, users only find the notification the next time they open the app."
                  checked={draft.issuePushNotification}
                  onChange={(event) => {
                    update({issuePushNotification: event.target.checked})
                  }}
                />
              </div>
            </Card>

            <details
              open={shown.uuid === undefined ? undefined : true}
              className="rounded-card border border-line bg-surface shadow-card"
            >
              <summary className="cursor-pointer px-5 py-3.5 text-sm font-semibold text-ink">
                Advanced
              </summary>
              <div className="border-t border-line p-5">
                <Field
                  label="Notification ID"
                  required
                  error={shown.uuid}
                  hint="Generated for you. The same ID cannot be sent twice, which protects against double sends when you retry."
                >
                  <Input
                    className="font-mono"
                    value={draft.uuid}
                    invalid={shown.uuid !== undefined}
                    onChange={(event) => {
                      update({uuid: event.target.value})
                    }}
                  />
                </Field>
              </div>
            </details>

            <FormMessage error={reviewing ? null : sendError} />

            <div className="flex justify-end gap-2">
              <Button onClick={clear}>Clear</Button>
              <Button type="submit" variant="primary">
                Review and send
              </Button>
            </div>
          </fieldset>
        </form>

        <Card
          title="Preview"
          description="What users see."
          className="lg:sticky lg:top-8"
        >
          <NotificationPreview notification={content} />
        </Card>
      </div>

      <Modal
        open={reviewing}
        onClose={() => {
          setReviewing(false)
        }}
        title="Send this notification?"
        description="Check it one more time. This is exactly what goes out."
        size="lg"
        footer={
          <>
            <Button
              disabled={sending}
              onClick={() => {
                setReviewing(false)
              }}
            >
              Back to editing
            </Button>
            <Button
              variant="primary"
              loading={sending}
              disabled={!acknowledged}
              onClick={send}
            >
              Send notification
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <NotificationPreview notification={content} />
            <NotificationSummary notification={content} />
          </div>
          <Alert tone="warning" title="This cannot be undone">
            The notification goes to real users right away. It cannot be edited,
            recalled or deleted afterwards.
          </Alert>
          <Checkbox
            label="I checked the text, the link and the audience"
            checked={acknowledged}
            disabled={sending}
            onChange={(event) => {
              setAcknowledged(event.target.checked)
            }}
          />
          <FormMessage error={sendError} />
        </div>
      </Modal>
      {dialog}
    </Page>
  )
}
