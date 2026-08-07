import {SqlClient} from '@effect/sql'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
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
  expoToken: string
): string | undefined => {
  const entry = enqueued.find(
    (one) =>
      one.task._tag === 'UserInactivityNotificationMqEntry' &&
      one.task.notificationToken === expoToken
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
              expo_token,
              number_of_inactivity_notifications_sent,
              last_inactivity_notification_sent_at
            )
          VALUES
            (
              'pkFirst',
              'h1',
              CURRENT_DATE - 3,
              'tokenFirst',
              0,
              NULL
            ),
            (
              'pkLongInactive',
              'h2',
              CURRENT_DATE - 40,
              'tokenLongInactive',
              0,
              NULL
            ),
            (
              'pkFollowUpDue',
              'h3',
              CURRENT_DATE - 40,
              'tokenFollowUpDue',
              1,
              now() - INTERVAL '8 days'
            ),
            (
              'pkFollowUpNotDue',
              'h4',
              CURRENT_DATE - 40,
              'tokenFollowUpNotDue',
              1,
              now() - INTERVAL '2 days'
            ),
            (
              'pkRecurringNotDue',
              'h5',
              CURRENT_DATE - 40,
              'tokenRecurringNotDue',
              2,
              now() - INTERVAL '10 days'
            ),
            (
              'pkRecurringDue',
              'h6',
              CURRENT_DATE - 40,
              'tokenRecurringDue',
              2,
              now() - INTERVAL '31 days'
            ),
            (
              'pkActive',
              'h7',
              CURRENT_DATE,
              'tokenActive',
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

        const enqueued = yield* _(notifyAndGetEnqueued)

        expect(enqueued).toHaveLength(4)
        expect(variantForToken(enqueued, 'tokenFirst')).toEqual('FIRST')
        expect(variantForToken(enqueued, 'tokenLongInactive')).toEqual(
          'OFFERS_DEACTIVATED'
        )
        expect(variantForToken(enqueued, 'tokenFollowUpDue')).toEqual(
          'OFFERS_DEACTIVATED'
        )
        expect(variantForToken(enqueued, 'tokenRecurringDue')).toEqual(
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
              expo_token,
              number_of_inactivity_notifications_sent,
              last_inactivity_notification_sent_at
            )
          VALUES
            (
              'pkComesBack',
              'ServerHash:h1',
              CURRENT_DATE - 40,
              'tokenComesBack',
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
