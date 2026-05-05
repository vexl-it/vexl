import {
  VexlProductNotificationUuid,
  type VexlProductNotification,
} from '@vexl-next/domain/src/general/vexlProductNotification'
import {PLATFORM_IOS} from '@vexl-next/domain/src/utility/PlatformName'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {
  DuplicateVexlProductNotificationUuidError,
  InvalidContentAdminTokenError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Either, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'

const commonHeaders = makeCommonHeaders({
  platform: PLATFORM_IOS,
  versionCode: Schema.decodeSync(VersionCode)(1),
  semver: Schema.decodeSync(SemverString)('1.0.0'),
  appSource: Schema.decodeSync(AppSource)('test'),
  language: 'en',
  isDeveloper: true,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.none(),
})

const uuid = (value: string): VexlProductNotificationUuid =>
  Schema.decodeSync(VexlProductNotificationUuid)(value)

const date = (value: string): Date => new Date(value)

const makeVexlProductNotification = (args: {
  uuid: VexlProductNotificationUuid
  title: string
  date: Date
  actionLink?: string
  actionText?: string
  type?: VexlProductNotification['type']
}): VexlProductNotification => ({
  uuid: args.uuid,
  title: args.title,
  description: `${args.title} description`,
  issuePushNotification: false,
  date: args.date,
  type: args.type ?? 'GENERAL',
  ...(args.actionLink === undefined ? {} : {actionLink: args.actionLink}),
  ...(args.actionText === undefined ? {} : {actionText: args.actionText}),
})

describe('Vexl product notifications', () => {
  it('creates and returns a Vexl product notification with action fields for a valid admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const vexlProductNotification = makeVexlProductNotification({
          uuid: uuid('2f7c70e1-91a0-4010-bf9e-fcae8de71801'),
          title: 'Created with action',
          date: date('2026-01-01T10:00:00.000Z'),
          actionLink: 'https://vexl.it',
          actionText: 'Open Vexl',
          type: 'MARKETING',
        })

        const resp = yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification},
          }),
          Effect.either
        )

        expect(Either.isRight(resp)).toBe(true)
        if (Either.isLeft(resp)) return

        expect(resp.right.vexlProductNotification).toEqual(
          vexlProductNotification
        )
      })
    )
  })

  it('returns 401 for an invalid admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const vexlProductNotification = makeVexlProductNotification({
          uuid: uuid('5952517e-ecc2-4088-b70c-1a95148a4787'),
          title: 'Invalid token',
          date: date('2026-01-01T10:00:00.000Z'),
        })

        const resp = yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: 'bad-token'},
            payload: {vexlProductNotification},
          }),
          Effect.either
        )

        expectErrorResponse(InvalidContentAdminTokenError)(resp)
      })
    )
  })

  it('returns the handled duplicate UUID error', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const vexlProductNotification = makeVexlProductNotification({
          uuid: uuid('0fbfb72e-073a-4a55-badb-948f32bc768c'),
          title: 'Duplicate',
          date: date('2026-01-02T10:00:00.000Z'),
        })

        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification},
          })
        )

        const resp = yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification},
          }),
          Effect.either
        )

        expectErrorResponse(DuplicateVexlProductNotificationUuidError)(resp)
      })
    )
  })

  it('fetches Vexl product notifications newer than the provided date in stable order', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const first = makeVexlProductNotification({
          uuid: uuid('f530f462-1288-457f-9e96-de0458753671'),
          title: 'First',
          date: date('2026-02-01T10:00:00.000Z'),
        })
        const second = makeVexlProductNotification({
          uuid: uuid('d8aa0ba3-d2da-4c31-9d59-fe38e9033f19'),
          title: 'Second',
          date: date('2026-02-02T10:00:00.000Z'),
        })
        const third = makeVexlProductNotification({
          uuid: uuid('05a56907-b0c1-4d53-9d54-d5fd65f056d6'),
          title: 'Third',
          date: date('2026-02-03T10:00:00.000Z'),
        })

        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification: third},
          })
        )
        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification: first},
          })
        )
        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification: second},
          })
        )

        const resp = yield* _(
          app.VexlProductNotifications.getVexlProductNotifications({
            headers: commonHeaders,
            urlParams: {newerThan: date('2026-02-01T00:00:00.000Z')},
          }),
          Effect.either
        )

        expect(Either.isRight(resp)).toBe(true)
        if (Either.isLeft(resp)) return

        expect(resp.right.vexlProductNotifications).toHaveLength(3)
        expect(resp.right.vexlProductNotifications[0]?.uuid).toEqual(first.uuid)
        expect(resp.right.vexlProductNotifications[1]?.uuid).toEqual(
          second.uuid
        )
        expect(resp.right.vexlProductNotifications[2]?.uuid).toEqual(third.uuid)
      })
    )
  })

  it('fetches Vexl product notifications using both newerThan and lastVexlProductNotificationUuidFetched', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const first = makeVexlProductNotification({
          uuid: uuid('6c6f21be-3388-43f0-b585-052b204ff224'),
          title: 'Cursor first',
          date: date('2026-03-01T10:00:00.000Z'),
        })
        const second = makeVexlProductNotification({
          uuid: uuid('fbe42ff2-feae-458a-ac47-b2841983ab7a'),
          title: 'Cursor second',
          date: date('2026-03-01T10:00:00.000Z'),
        })
        const third = makeVexlProductNotification({
          uuid: uuid('3b109718-d0aa-4b14-9f60-e48088d735da'),
          title: 'Cursor third',
          date: date('2026-03-02T10:00:00.000Z'),
        })

        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification: first},
          })
        )
        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification: second},
          })
        )
        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification: third},
          })
        )

        const resp = yield* _(
          app.VexlProductNotifications.getVexlProductNotifications({
            headers: commonHeaders,
            urlParams: {
              newerThan: date('2026-03-01T00:00:00.000Z'),
              lastVexlProductNotificationUuidFetched: first.uuid,
            },
          }),
          Effect.either
        )

        expect(Either.isRight(resp)).toBe(true)
        if (Either.isLeft(resp)) return

        expect(resp.right.vexlProductNotifications).toHaveLength(2)
        expect(resp.right.vexlProductNotifications[0]?.uuid).toEqual(
          second.uuid
        )
        expect(resp.right.vexlProductNotifications[1]?.uuid).toEqual(third.uuid)
      })
    )
  })

  it('returns an empty list for an unknown cursor UUID', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const vexlProductNotification = makeVexlProductNotification({
          uuid: uuid('f32a26e7-f82f-4c85-9cd8-cfe989184e15'),
          title: 'Known Vexl product notification',
          date: date('2026-04-01T10:00:00.000Z'),
        })

        yield* _(
          app.VexlProductNotifications.createVexlProductNotification({
            urlParams: {adminToken: ADMIN_TOKEN},
            payload: {vexlProductNotification},
          })
        )

        const resp = yield* _(
          app.VexlProductNotifications.getVexlProductNotifications({
            headers: commonHeaders,
            urlParams: {
              newerThan: date('2026-01-01T00:00:00.000Z'),
              lastVexlProductNotificationUuidFetched: uuid(
                '9cb98d07-fba8-4cae-97b1-ff47936f6a29'
              ),
            },
          }),
          Effect.either
        )

        expect(Either.isRight(resp)).toBe(true)
        if (Either.isLeft(resp)) return

        expect(resp.right.vexlProductNotifications).toHaveLength(0)
      })
    )
  })
})
