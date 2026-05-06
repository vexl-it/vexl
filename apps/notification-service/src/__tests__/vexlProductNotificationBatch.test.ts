import {type HttpClient} from '@effect/platform/HttpClient'
import {SqlClient} from '@effect/sql'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  VexlProductNotificationUuid,
  type VexlProductNotification,
} from '@vexl-next/domain/src/general/vexlProductNotification'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {VexlProductNotificationMqEntry} from '@vexl-next/server-utils/src/UserNotificationMq'
import {type TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Either, Option, Schema} from 'effect'
import {NotificationTokensDb} from '../services/NotificationTokensDb'
import {
  PendingBatchedNotificationDbRecord,
  PendingBatchedNotificationsDb,
} from '../services/PendingBatchedNotificationsDb'
import {issueNotificationBatch} from '../services/VexlProductNotificationBatchWorker'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {
  enqueuedUserNotifications,
  failUserNotificationEnqueueForToken,
  runPromiseInMockedEnvironment,
} from './utils/runPromiseInMockedEnvironment'

const headers = makeCommonHeaders({
  platform: 'ANDROID',
  versionCode: Schema.decodeSync(VersionCode)(100),
  semver: Schema.decodeSync(SemverString)('1.0.0'),
  appSource: Schema.decodeSync(AppSource)('playStore'),
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.none(),
})

const uuid = (value: string): VexlProductNotificationUuid =>
  Schema.decodeSync(VexlProductNotificationUuid)(value)

const token = (value: string): VexlNotificationToken =>
  Schema.decodeSync(VexlNotificationToken)(value)

const expoToken = (value: string): ExpoNotificationToken =>
  Schema.decodeSync(ExpoNotificationToken)(value)

const makeVexlProductNotification = (args: {
  uuid: VexlProductNotificationUuid
  type: VexlProductNotification['type']
}): VexlProductNotification => ({
  uuid: args.uuid,
  title: `Title ${args.uuid}`,
  description: 'Description',
  issuePushNotification: true,
  date: new Date('2026-01-01T10:00:00.000Z'),
  type: args.type,
})

const createSecretWithTokens = (args: {
  expoToken: ExpoNotificationToken
  systemVexlToken?: VexlNotificationToken
  marketingVexlToken?: VexlNotificationToken
}): Effect.Effect<void, never, HttpClient | TestRequestHeaders> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const createResp = yield* _(
      app.NotificationTokenGroup.CreateNotificationSecret({
        payload: {expoNotificationToken: args.expoToken},
        headers,
      }),
      Effect.either
    )

    expect(Either.isRight(createResp)).toBe(true)
    if (Either.isLeft(createResp)) return

    const updateResp = yield* _(
      app.NotificationTokenGroup.updateNoficationInfo({
        payload: {
          secret: createResp.right.secret,
          expoNotificationToken: args.expoToken,
          systemVexlToken: args.systemVexlToken,
          marketingVexlToken: args.marketingVexlToken,
        },
        headers,
      }),
      Effect.either
    )

    expect(Either.isRight(updateResp)).toBe(true)
  }).pipe(Effect.orDie)

describe('Vexl product notification batching', () => {
  it('uses marketing tokens for MARKETING notifications and skips nulls', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const db = yield* _(NotificationTokensDb)
        const marketingToken = token('vexl_nt_marketing_batch_1')
        const systemToken = token('vexl_nt_system_batch_1')

        yield* _(
          createSecretWithTokens({
            expoToken: expoToken('ExponentPushToken[marketingBatch1]'),
            systemVexlToken: systemToken,
            marketingVexlToken: marketingToken,
          })
        )
        yield* _(
          createSecretWithTokens({
            expoToken: expoToken('ExponentPushToken[marketingBatch2]'),
            systemVexlToken: token('vexl_nt_system_batch_2'),
          })
        )

        const selectedTokens = yield* _(db.selectVexlTokens('marketing'))
        expect(
          Option.isSome(
            Array.findFirst(selectedTokens, (one) => one === marketingToken)
          )
        ).toBe(true)
        expect(
          Option.isNone(
            Array.findFirst(selectedTokens, (one) => one === systemToken)
          )
        ).toBe(true)
      })
    )
  })

  it('uses system tokens for GENERAL notifications and skips nulls', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const db = yield* _(NotificationTokensDb)
        const systemToken = token('vexl_nt_system_batch_3')
        const marketingToken = token('vexl_nt_marketing_batch_3')

        yield* _(
          createSecretWithTokens({
            expoToken: expoToken('ExponentPushToken[generalBatch1]'),
            systemVexlToken: systemToken,
            marketingVexlToken: marketingToken,
          })
        )
        yield* _(
          createSecretWithTokens({
            expoToken: expoToken('ExponentPushToken[generalBatch2]'),
            marketingVexlToken: token('vexl_nt_marketing_batch_4'),
          })
        )

        const selectedTokens = yield* _(db.selectVexlTokens('general'))
        expect(
          Option.isSome(
            Array.findFirst(selectedTokens, (one) => one === systemToken)
          )
        ).toBe(true)
        expect(
          Option.isNone(
            Array.findFirst(selectedTokens, (one) => one === marketingToken)
          )
        ).toBe(true)
      })
    )
  })

  it('pending rows encode and decode through UserNotificationMqEntry JSON', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM pending_batched_notifications`)
        const db = yield* _(PendingBatchedNotificationsDb)
        const entry = new VexlProductNotificationMqEntry({
          token: token('vexl_nt_encode_decode'),
          notificationToken: null,
          vexlProductNotification: makeVexlProductNotification({
            uuid: uuid('cc8e3f9b-f8b4-4739-a1db-1d8f02ae3187'),
            type: 'GENERAL',
          }),
        })

        yield* _(db.insertPendingEntries([entry]))

        const rows = yield* _(db.findOldestPendingRows(1))
        expect(rows).toHaveLength(1)
        const decoded = Schema.decodeUnknownSync(
          PendingBatchedNotificationDbRecord
        )(rows[0])
        expect(decoded.notificationData).toEqual(entry)
      })
    )
  })

  it('batch worker sends only the configured oldest batch size', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        process.env.VEXL_PRODUCT_NOTIFICATION_BATCH_SIZE = '2'
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM pending_batched_notifications`)
        const db = yield* _(PendingBatchedNotificationsDb)
        const entries = [
          new VexlProductNotificationMqEntry({
            token: token('vexl_nt_batch_oldest_1'),
            notificationToken: null,
            vexlProductNotification: makeVexlProductNotification({
              uuid: uuid('75b15fea-00ef-430f-a36e-2fa195e3e722'),
              type: 'GENERAL',
            }),
          }),
          new VexlProductNotificationMqEntry({
            token: token('vexl_nt_batch_oldest_2'),
            notificationToken: null,
            vexlProductNotification: makeVexlProductNotification({
              uuid: uuid('abf39bc3-cfc4-4c1f-b1c6-195a503568b5'),
              type: 'GENERAL',
            }),
          }),
          new VexlProductNotificationMqEntry({
            token: token('vexl_nt_batch_oldest_3'),
            notificationToken: null,
            vexlProductNotification: makeVexlProductNotification({
              uuid: uuid('2bc3871d-5128-48f3-9455-9d14e1f5233c'),
              type: 'GENERAL',
            }),
          }),
        ]

        yield* _(db.insertPendingEntries(entries))
        yield* _(issueNotificationBatch)

        expect(enqueuedUserNotifications).toEqual([entries[0], entries[1]])
        const remainingRows = yield* _(db.findOldestPendingRows(10))
        expect(remainingRows).toHaveLength(1)
        const decodedRemaining = Schema.decodeUnknownSync(
          PendingBatchedNotificationDbRecord
        )(remainingRows[0])
        expect(decodedRemaining.notificationData).toEqual(entries[2])
      })
    )
  })

  it('deletes successfully enqueued and invalid rows while keeping failed rows', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        process.env.VEXL_PRODUCT_NOTIFICATION_BATCH_SIZE = '10'
        const db = yield* _(PendingBatchedNotificationsDb)
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM pending_batched_notifications`)
        const failedToken = token('vexl_nt_batch_failure')
        const successfulEntry = new VexlProductNotificationMqEntry({
          token: token('vexl_nt_batch_success'),
          notificationToken: null,
          vexlProductNotification: makeVexlProductNotification({
            uuid: uuid('aa282556-1872-48a7-ac38-8322f4b86f18'),
            type: 'GENERAL',
          }),
        })
        const failedEntry = new VexlProductNotificationMqEntry({
          token: failedToken,
          notificationToken: null,
          vexlProductNotification: makeVexlProductNotification({
            uuid: uuid('d25287a5-6261-4ea1-863e-08a31631e41d'),
            type: 'GENERAL',
          }),
        })

        failUserNotificationEnqueueForToken(failedToken)
        yield* _(db.insertPendingEntries([successfulEntry, failedEntry]))
        yield* _(sql`
          INSERT INTO
            pending_batched_notifications (notification_data)
          VALUES
            (${JSON.stringify({unexpected: true})}::jsonb)
        `)

        yield* _(issueNotificationBatch)

        expect(enqueuedUserNotifications).toEqual([successfulEntry])
        const remainingRows = yield* _(db.findOldestPendingRows(10))
        expect(remainingRows).toHaveLength(1)
        const decodedRemaining = Schema.decodeUnknownSync(
          PendingBatchedNotificationDbRecord
        )(remainingRows[0])
        expect(decodedRemaining.notificationData).toEqual(failedEntry)
      })
    )
  })
})
