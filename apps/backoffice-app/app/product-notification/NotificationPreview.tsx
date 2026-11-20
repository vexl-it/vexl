import {cx, ExternalLinkIcon} from '@/src/components/ui'
import {type VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {type ReactNode} from 'react'

export type NotificationType = VexlProductNotification['type']

/** `appCategory` is the label the mobile app puts on the notification card. */
export const NOTIFICATION_TYPES: Record<
  NotificationType,
  {
    readonly label: string
    readonly appCategory: string
    readonly audience: string
  }
> = {
  GENERAL: {
    label: 'General',
    appCategory: 'System',
    audience: 'Every app user',
  },
  MARKETING: {
    label: 'Marketing',
    appCategory: 'Important',
    audience: 'Only users who allow marketing notifications',
  },
}

/** What the app puts on the button when a link has no button text. */
export const DEFAULT_ACTION_TEXT = 'Learn more'

export const NOTIFICATION_TYPE_ORDER: readonly NotificationType[] = [
  'GENERAL',
  'MARKETING',
]

export const deliveryLabel = (issuePushNotification: boolean): string =>
  issuePushNotification ? 'Push + in-app' : 'In-app only'

export type NotificationContent = Omit<VexlProductNotification, 'uuid' | 'date'>

function VexlAvatar({className}: {readonly className: string}) {
  return (
    <span
      className={cx(
        'flex size-9 shrink-0 items-center justify-center bg-ink text-sm font-bold text-accent',
        className
      )}
    >
      V
    </span>
  )
}

function Surface({
  label,
  children,
}: {
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      {children}
    </div>
  )
}

function Text({
  value,
  placeholder,
  className,
}: {
  readonly value: string
  readonly placeholder: string
  readonly className?: string
}) {
  return (
    <p
      className={cx(
        'break-words whitespace-pre-wrap',
        className,
        value === '' && 'font-normal text-ink-subtle'
      )}
    >
      {value === '' ? placeholder : value}
    </p>
  )
}

/** Mirrors the mobile app: the push banner and the notification centre card. */
export function NotificationPreview({
  notification,
  time = 'now',
}: {
  readonly notification: NotificationContent
  readonly time?: string
}) {
  const {title, description, type, actionLink, actionText} = notification

  return (
    <div className="space-y-5">
      {notification.issuePushNotification ? (
        <Surface label="Push notification">
          <div className="flex gap-3 rounded-2xl bg-canvas p-3">
            <VexlAvatar className="rounded-lg" />
            <div className="min-w-0 flex-1 text-sm">
              <Text
                value={title}
                placeholder="Title"
                className="font-semibold text-ink"
              />
              <Text
                value={description}
                placeholder="Description"
                className="line-clamp-4 text-ink-muted"
              />
            </div>
          </div>
        </Surface>
      ) : null}
      <Surface label="In the app, on the Notifications screen">
        <div className="space-y-0.5 text-sm">
          <div className="flex items-center gap-3 rounded-t-2xl rounded-b-md bg-line p-3">
            <VexlAvatar className="rounded-full" />
            <div className="min-w-0">
              <p className="font-semibold text-ink">Vexl</p>
              <p className="text-xs text-ink-muted">
                {time} · {NOTIFICATION_TYPES[type].appCategory}
              </p>
            </div>
          </div>
          <div className="rounded-t-md rounded-b-2xl bg-canvas p-3">
            <Text
              value={`${title} ${description}`.trim()}
              placeholder="Title and description"
              className="text-ink-muted"
            />
            {actionLink ? (
              <p className="mt-3 rounded-xl bg-line px-3 py-2 text-center font-medium text-ink">
                {actionText ?? DEFAULT_ACTION_TEXT}
              </p>
            ) : null}
          </div>
        </div>
      </Surface>
    </div>
  )
}

export function SummaryRow({
  label,
  children,
}: {
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-ink">{children}</dd>
    </div>
  )
}

/** Who gets the notification and how; extra rows go in `children`. */
export function NotificationSummary({
  notification,
  children,
}: {
  readonly notification: NotificationContent
  readonly children?: ReactNode
}) {
  const {type, actionLink, actionText, issuePushNotification} = notification

  return (
    <dl className="space-y-4 text-sm">
      <SummaryRow label="Audience">
        {NOTIFICATION_TYPES[type].audience} ({NOTIFICATION_TYPES[type].label})
      </SummaryRow>
      <SummaryRow label="Delivery">
        {issuePushNotification
          ? 'Push notification and the in-app Notifications screen'
          : 'In-app Notifications screen only, no push'}
      </SummaryRow>
      <SummaryRow label="Button">
        {actionLink ? (
          <>
            “{actionText ?? DEFAULT_ACTION_TEXT}” opens{' '}
            <a
              href={actionLink}
              target="_blank"
              rel="noreferrer"
              className="break-all underline decoration-accent decoration-2 underline-offset-2"
            >
              {actionLink}
              <ExternalLinkIcon className="ml-1 inline size-3.5" />
            </a>
          </>
        ) : (
          'None'
        )}
      </SummaryRow>
      {children}
    </dl>
  )
}
