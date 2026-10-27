import {SqlClient} from '@effect/sql'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {mockedReportMetric} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {Effect, Option, Schema} from 'effect'
import {UserDbService} from '../db/UserDbService'
import {UserNotificationService} from '../services/UserNotificationService'
import {ServerHashedNumber} from '../utils/serverHashContact'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
  type EnqueuedNotification,
} from './utils/mockEnqueueUserNotification'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const notifyAndGetEnqueued = Effect.gen(function* (_) {
  yield* _(clearEnqueuedNotifications)
  const userNotificationService = yield* _(UserNotificationService)
  yield* _(userNotificationService.notifyUsersAboutInactivity())
  return yield* _(getEnqueuedNotifications)
})

const variantForToken = (
  enqueued: EnqueuedNotification[],
  token: string
): string | undefined => {
  const entry = enqueued.find(
    (one) =>
      one.task._tag === 'UserInactivityNotificationMqEntry' &&
      one.task.token === token
  )
  if (!entry || entry.task._tag !== 'UserInactivityNotificationMqEntry')
    return undefined
  return entry.task.variant
}

describe('Notify users about inactivity', () => {
  // .env.test: INACTIVITY_NOTIFICATION_AFTER_DAYS=2. Defaults: follow up
  // after 7 days, recurring every 30 days. First wording window is
  // therefore 2-9 days of inactivity.
  it('Sends the right wording on the right cadence and records sends', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM user_contact`)
        yield* _(sql`DELETE FROM users`)
        yield* _(sql`
          INSERT INTO
            users (
              public_key,
              hash,
              refreshed_at,
              vexl_notification_token,
              number_of_inactivity_notifications_sent,
              last_inactivity_notification_sent_at
            )
          VALUES
            (
              'pkFirst',
              'h1',
              CURRENT_DATE - 3,
              'vexl_nt_First',
              0,
              NULL
            ),
            (
              'pkLongInactive',
              'h2',
              CURRENT_DATE - 40,
              'vexl_nt_LongInactive',
              0,
              NULL
            ),
            (
              'pkFollowUpDue',
              'h3',
              CURRENT_DATE - 40,
              'vexl_nt_FollowUpDue',
              1,
              now() - INTERVAL '8 days'
            ),
            (
              'pkFollowUpNotDue',
              'h4',
              CURRENT_DATE - 40,
              'vexl_nt_FollowUpNotDue',
              1,
              now() - INTERVAL '2 days'
            ),
            (
              'pkRecurringNotDue',
              'h5',
              CURRENT_DATE - 40,
              'vexl_nt_RecurringNotDue',
              2,
              now() - INTERVAL '10 days'
            ),
            (
              'pkRecurringDue',
              'h6',
              CURRENT_DATE - 40,
              'vexl_nt_RecurringDue',
              2,
              now() - INTERVAL '31 days'
            ),
            (
              'pkActive',
              'h7',
              CURRENT_DATE,
              'vexl_nt_Active',
              0,
              NULL
            ),
            (
              'pkNoToken',
              'h8',
              CURRENT_DATE - 40,
              NULL,
              0,
              NULL
            )
        `)

        mockedReportMetric.mockClear()
        const enqueued = yield* _(notifyAndGetEnqueued)
        // metric reports are forked into the background
        yield* _(Effect.sleep(200))

        expect(enqueued).toHaveLength(4)
        expect(variantForToken(enqueued, 'vexl_nt_First')).toEqual('FIRST')
        expect(variantForToken(enqueued, 'vexl_nt_LongInactive')).toEqual(
          'OFFERS_DEACTIVATED'
        )
        expect(variantForToken(enqueued, 'vexl_nt_FollowUpDue')).toEqual(
          'OFFERS_DEACTIVATED'
        )
        expect(variantForToken(enqueued, 'vexl_nt_RecurringDue')).toEqual(
          'OFFERS_DEACTIVATED'
        )

        const counts = yield* _(sql`
          SELECT
            public_key,
            number_of_inactivity_notifications_sent AS count,
            last_inactivity_notification_sent_at AS sent_at
          FROM
            users
        `)
        const countByKey = Object.fromEntries(
          counts.map((row) => [row.publicKey, row.count])
        )
        expect(countByKey).toEqual({
          pkFirst: 1,
          pkLongInactive: 2,
          pkFollowUpDue: 2,
          pkFollowUpNotDue: 1,
          pkRecurringNotDue: 2,
          pkRecurringDue: 3,
          pkActive: 0,
          pkNoToken: 0,
        })
        expect(
          counts
            .filter((row) =>
              [
                'pkFirst',
                'pkLongInactive',
                'pkFollowUpDue',
                'pkRecurringDue',
              ].includes(String(row.publicKey))
            )
            .every((row) => row.sentAt !== null)
        ).toBe(true)

        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'INACTIVITY_NOTIFICATION_SENT',
            value: 1,
            attributes: {variant: 'FIRST', notificationOrdinal: 1},
          })
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'INACTIVITY_NOTIFICATION_SENT',
            value: 2,
            attributes: {variant: 'OFFERS_DEACTIVATED', notificationOrdinal: 2},
          })
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'INACTIVITY_NOTIFICATION_SENT',
            value: 1,
            attributes: {variant: 'OFFERS_DEACTIVATED', notificationOrdinal: 3},
          })
        )

        // Snapshot after the send: pkNoToken has 0 reminders; pkFirst and
        // pkFollowUpNotDue have 1; pkLongInactive, pkFollowUpDue and
        // pkRecurringNotDue have 2; pkRecurringDue has 3. pkActive is not
        // inactive and is excluded.
        const snapshotByRemindersSent = [
          {remindersSent: 0, value: 1},
          {remindersSent: 1, value: 2},
          {remindersSent: 2, value: 3},
          {remindersSent: 3, value: 1},
        ]
        for (const {remindersSent, value} of snapshotByRemindersSent) {
          expect(mockedReportMetric).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'COUNT_OF_INACTIVE_USERS_BY_REMINDERS_SENT',
              value,
              attributes: {remindersSent},
            })
          )
        }

        // Running the job again right away must not send anything new
        const enqueuedSecondRun = yield* _(notifyAndGetEnqueued)
        expect(enqueuedSecondRun).toHaveLength(0)
      })
    )
  })

  it('Resets the send history when the user refreshes', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM user_contact`)
        yield* _(sql`DELETE FROM users`)
        yield* _(sql`
          INSERT INTO
            users (
              public_key,
              hash,
              refreshed_at,
              vexl_notification_token,
              number_of_inactivity_notifications_sent,
              last_inactivity_notification_sent_at
            )
          VALUES
            (
              'pkComesBack',
              'ServerHash:h1',
              CURRENT_DATE - 40,
              'vexl_nt_ComesBack',
              3,
              now() - INTERVAL '40 days'
            )
        `)

        const userDb = yield* _(UserDbService)
        yield* _(
          userDb.updateRefreshUser({
            publicKey: Schema.decodeSync(PublicKeyPemBase64)('pkComesBack'),
            hash: Schema.decodeSync(ServerHashedNumber)('ServerHash:h1'),
            clientVersion: Option.none(),
            countryPrefix: Option.none(),
            appSource: Option.none(),
            vexlNotificationToken: Option.none(),
            refreshedAt: new Date(),
            publicKeyV2: Option.none(),
          })
        )

        const [user] = yield* _(sql`
          SELECT
            number_of_inactivity_notifications_sent AS count,
            last_inactivity_notification_sent_at AS sent_at
          FROM
            users
          WHERE
            public_key = 'pkComesBack'
        `)
        expect(user.count).toEqual(0)
        expect(user.sentAt).toBeNull()

        const enqueued = yield* _(notifyAndGetEnqueued)
        expect(enqueued).toHaveLength(0)
      })
    )
  })
})
