import {Array, pipe} from 'effect'
import {ADMIN_TOKEN_HEADERS, CONTENT_INTERNAL_URL, psql} from './shared'

interface SeedNotification {
  readonly daysAgo: number
  readonly type: 'GENERAL' | 'MARKETING'
  readonly push: boolean
  readonly title: string
  readonly description: string
  readonly actionLink?: string
  readonly actionText?: string
}

const NOTIFICATIONS: readonly SeedNotification[] = [
  {
    daysAgo: 2,
    type: 'GENERAL',
    push: true,
    title: 'Vexl 26.11 is here',
    description:
      'Faster chat sync, a redesigned offer detail and fewer taps to import new contacts. Update from your app store to get it.',
    actionLink: 'https://example.com/blog/vexl-26-11',
    actionText: 'See what is new',
  },
  {
    daysAgo: 9,
    type: 'GENERAL',
    push: true,
    title: 'Short maintenance tonight',
    description:
      'Chats may arrive with a delay between 23:00 and 23:30 CET. Your offers stay online.',
  },
  {
    daysAgo: 16,
    type: 'MARKETING',
    push: true,
    title: 'Meet the team at the Example Bitcoin Meetup',
    description:
      'We are bringing stickers, a live demo of clubs and an open Q&A about what we build next. Entry is free, seats are limited.',
    actionLink: 'https://example.com/meetups/autumn',
    actionText: 'Save a seat',
  },
  {
    daysAgo: 27,
    type: 'GENERAL',
    push: false,
    title: 'Clubs now have moderators',
    description:
      'Club admins can hand out moderator rights. Moderators can approve new members and remove offers that break the club rules, without getting access to anything else.\n\nNothing changes for clubs that do not use it.',
    actionLink: 'https://example.com/blog/club-moderators',
  },
  {
    daysAgo: 41,
    type: 'GENERAL',
    push: true,
    title: 'Update now',
    description: 'Version 26.9.2 fixes missed chat notifications on Android.',
  },
  {
    daysAgo: 58,
    type: 'MARKETING',
    push: false,
    title: 'Two minutes to help us decide what comes next',
    description:
      'Tell us which of five ideas you would use most. The survey is anonymous and we do not ask for any contact details.',
    actionLink: 'https://example.com/survey/roadmap',
    actionText: 'Open the survey',
  },
  {
    daysAgo: 74,
    type: 'GENERAL',
    push: false,
    title:
      'Trading safely: five things to check before you meet someone for a cash trade for the first time',
    description:
      'Agree on the amount and the rate in chat first. Meet in a public place. Check the common friends you share. Count the cash before you send. Never share your seed.',
    actionLink: 'https://example.com/guides/safe-trading',
    actionText: 'Read the guide',
  },
  {
    daysAgo: 96,
    type: 'GENERAL',
    push: true,
    title: 'Filter offers by payment method',
    description:
      'Looking for cash only, or a bank transfer? Pick the payment methods you want in the marketplace filter.',
  },
  {
    daysAgo: 121,
    type: 'MARKETING',
    push: true,
    title: 'Vexl runs on donations',
    description:
      'No ads, no fees and no data to sell. If Vexl is useful to you, consider a small donation so it stays that way.',
    actionLink: 'https://example.com/donate',
    actionText: 'Donate',
  },
  {
    daysAgo: 149,
    type: 'GENERAL',
    push: false,
    title: 'Dark mode',
    description: 'Now in Settings.',
  },
  {
    daysAgo: 177,
    type: 'GENERAL',
    push: false,
    title: 'Refreshed Czech, Slovak and German translations',
    description:
      'Thanks to everyone who reported wording that sounded off. Found another one? Let us know.',
    actionLink: 'https://example.com/feedback',
  },
  {
    daysAgo: 203,
    type: 'MARKETING',
    push: false,
    title: 'New on the blog: why peer to peer still matters',
    description:
      'A long read about custody, privacy and trading with people you actually know.',
    actionLink:
      'https://example.com/blog/why-peer-to-peer-still-matters?utm_source=app&utm_medium=notification',
    actionText: 'Read the article',
  },
  {
    daysAgo: 238,
    type: 'GENERAL',
    push: true,
    title: 'All your notifications in one place',
    description:
      'The new Notifications screen keeps announcements like this one, club invitations and reminders together.',
  },
]

const DAY_MS = 86_400_000

const seedUuid = (index: number): string =>
  `5eed0000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`

// Created without push on purpose: with it the service queues a real push.
const create = async (
  notification: SeedNotification,
  index: number
): Promise<void> => {
  const response = await fetch(
    `${CONTENT_INTERNAL_URL}/content/vexl-product-notifications/admin`,
    {
      method: 'POST',
      headers: {...ADMIN_TOKEN_HEADERS, 'content-type': 'application/json'},
      body: JSON.stringify({
        vexlProductNotification: {
          uuid: seedUuid(index),
          title: notification.title,
          description: notification.description,
          type: notification.type,
          actionLink: notification.actionLink,
          actionText: notification.actionText,
          date: new Date(
            Date.now() - notification.daysAgo * DAY_MS
          ).toISOString(),
          issuePushNotification: false,
        },
        issuePushNotification: false,
      }),
    }
  )
  const body = await response.text()
  if (
    !response.ok &&
    !body.includes('DuplicateVexlProductNotificationUuidError')
  )
    throw new Error(`Creating "${notification.title}" failed: ${body}`)
}

const pushedUuids = pipe(
  NOTIFICATIONS,
  Array.flatMap((notification, index) =>
    notification.push ? [`'${seedUuid(index)}'`] : []
  )
)

const main = async (): Promise<void> => {
  await Promise.all(Array.map(NOTIFICATIONS, create))

  // The history shows these as sent with a push; no API can record that without sending one.
  psql(
    'content',
    `UPDATE vexl_product_notifications SET issue_push_notification = TRUE WHERE uuid IN (${pushedUuids.join(', ')})`
  )

  console.log(`Seeded ${NOTIFICATIONS.length} product notifications.`)
}

void main()
