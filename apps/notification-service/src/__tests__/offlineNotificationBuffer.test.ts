import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {NewChatMessageNoticeSendTask} from '../services/NotificationSocketMessaging/domain'
import {OfflineNotificationBuffer} from '../services/OfflineNotificationBuffer'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

// Read by OfflineNotificationBuffer.Live, which is constructed inside each test
process.env.NOTIFICATION_OFFLINE_BUFFER_MAX_COUNT = '3'

const validHeaders = makeCommonHeaders({
  platform: 'ANDROID',
  versionCode: Schema.decodeSync(VersionCode)(100),
  semver: Schema.decodeSync(VersionString)('1.0.0'),
  appSource: Schema.decodeSync(AppSource)('playStore'),
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.none(),
})

const createSecret = (
  backgroundSocketEnabled: boolean
): Effect.Effect<
  VexlNotificationTokenSecret,
  unknown,
  Effect.Services<typeof NodeTestingApp>
> =>
  Effect.gen(function* () {
    const app = yield* NodeTestingApp
    const createResp =
      yield* app.NotificationTokenGroup.CreateNotificationSecret({
        payload: {},
        headers: validHeaders,
      })
    yield* app.NotificationTokenGroup.updateNoficationInfo({
      payload: {
        secret: createResp.secret,
        backgroundSocketEnabled,
      },
      headers: validHeaders,
    })
    return createResp.secret
  })

const makeTask = (
  notificationToken: VexlNotificationTokenSecret,
  sentAtMs: number
): NewChatMessageNoticeSendTask =>
  new NewChatMessageNoticeSendTask({
    notificationToken,
    sendNewChatMessageNotification: true,
    sentAt: Schema.decodeSync(UnixMilliseconds)(sentAtMs),
    trackingId: createNotificationTrackingId(),
  })

describe('OfflineNotificationBuffer', () => {
  it('Buffers tasks only for secrets with background socket enabled', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const buffer = yield* OfflineNotificationBuffer

        const disabledSecret = yield* createSecret(false)
        yield* buffer.bufferTaskIfEnabled(makeTask(disabledSecret, 1000))
        const disabledTasks =
          yield* buffer.getAndClearBufferedTasks(disabledSecret)
        expect(disabledTasks).toHaveLength(0)

        const enabledSecret = yield* createSecret(true)
        const task = makeTask(enabledSecret, 1000)
        yield* buffer.bufferTaskIfEnabled(task)

        const bufferedTasks =
          yield* buffer.getAndClearBufferedTasks(enabledSecret)
        expect(bufferedTasks).toHaveLength(1)
        expect(bufferedTasks[0]?.trackingId).toEqual(task.trackingId)

        // Draining clears the buffer
        const drainedAgain =
          yield* buffer.getAndClearBufferedTasks(enabledSecret)
        expect(drainedAgain).toHaveLength(0)
      }).pipe(Effect.provide(OfflineNotificationBuffer.Live))
    )
  })

  it('Replays tasks oldest first and keeps only the newest up to the cap', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const buffer = yield* OfflineNotificationBuffer
        const secret = yield* createSecret(true)

        const tasks = pipe(
          Array.range(1, 5),
          Array.map((i) => makeTask(secret, i * 1000))
        )
        yield* Effect.forEach(tasks, (task) => buffer.bufferTaskIfEnabled(task))

        const bufferedTasks = yield* buffer.getAndClearBufferedTasks(secret)

        // NOTIFICATION_OFFLINE_BUFFER_MAX_COUNT is 3 for this test file
        expect(Array.map(bufferedTasks, (one) => one.sentAt)).toEqual([
          3000, 4000, 5000,
        ])
      }).pipe(Effect.provide(OfflineNotificationBuffer.Live))
    )
  })

  it('Clears the buffer without returning tasks', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const buffer = yield* OfflineNotificationBuffer
        const secret = yield* createSecret(true)

        yield* buffer.bufferTaskIfEnabled(makeTask(secret, 1000))
        yield* buffer.clearBufferedTasks(secret)

        const bufferedTasks = yield* buffer.getAndClearBufferedTasks(secret)
        expect(bufferedTasks).toHaveLength(0)
      }).pipe(Effect.provide(OfflineNotificationBuffer.Live))
    )
  })

  it('Removes a task once its processing is confirmed by trackingId', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const buffer = yield* OfflineNotificationBuffer
        const secret = yield* createSecret(true)

        const processedTask = makeTask(secret, 1000)
        const unprocessedTask = makeTask(secret, 2000)
        yield* buffer.bufferTaskIfEnabled(processedTask)
        yield* buffer.bufferTaskIfEnabled(unprocessedTask)

        yield* buffer.removeBufferedTaskByTrackingId(processedTask.trackingId)
        // Unknown trackingId is a no-op
        yield* buffer.removeBufferedTaskByTrackingId(
          createNotificationTrackingId()
        )

        const bufferedTasks = yield* buffer.getAndClearBufferedTasks(secret)
        expect(Array.map(bufferedTasks, (one) => one.trackingId)).toEqual([
          unprocessedTask.trackingId,
        ])
      }).pipe(Effect.provide(OfflineNotificationBuffer.Live))
    )
  })

  it('Ignores tasks for unknown secrets', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const buffer = yield* OfflineNotificationBuffer
        const unknownSecret = Schema.decodeSync(VexlNotificationTokenSecret)(
          'vexl_nt_secret_00000000-0000-0000-0000-000000000000'
        )

        yield* buffer.bufferTaskIfEnabled(makeTask(unknownSecret, 1000))
        const bufferedTasks =
          yield* buffer.getAndClearBufferedTasks(unknownSecret)
        expect(bufferedTasks).toHaveLength(0)
      }).pipe(Effect.provide(OfflineNotificationBuffer.Live))
    )
  })
})
