import {HttpApiBuilder} from '@effect/platform/index'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {LoggedInOnAnotherDeviceError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import dayjs from 'dayjs'
import {Array, Effect, Option} from 'effect'
import {
  contactActiveWindowDaysConfig,
  contactConsideredAsExpiredForMetricsAfterDaysConfig,
  contactHideUsersWithoutPublicKeyV2Config,
} from '../../configs'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {reportUserReactivated, reportUserRefresh} from '../../metrics'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {notifyOthersAboutNewUserForked} from '../contacts/utils/notifyOthersAboutNewUser'
import {
  findUserOrFail,
  refreshUserRecord,
  type UserSecurity,
} from './utils/refreshUserRecord'

const isUserInactive = ({
  refreshedAt,
  activeWithinDays,
}: {
  refreshedAt: Date
  activeWithinDays: number
}): boolean => {
  if (activeWithinDays === -1) return false

  const activeAfter = new Date()
  activeAfter.setHours(0, 0, 0, 0)
  activeAfter.setDate(activeAfter.getDate() - activeWithinDays)

  return refreshedAt < activeAfter
}

const isHiddenAsContact = ({
  refreshedAt,
  publicKeyV2,
  activeWithinDays,
  hideUsersWithoutPublicKeyV2,
}: {
  refreshedAt: Date
  publicKeyV2: Option.Option<PublicKeyV2>
  activeWithinDays: number
  hideUsersWithoutPublicKeyV2: boolean
}): boolean =>
  isUserInactive({refreshedAt, activeWithinDays}) ||
  (hideUsersWithoutPublicKeyV2 && Option.isNone(publicKeyV2))

// Users logged in before login sessions existed adopt the first one they send.
const ensureSameLoginSession = ({
  security,
  stored,
  received,
}: {
  security: UserSecurity
  stored: Option.Option<LoginSessionId>
  received: Option.Option<LoginSessionId>
}): Effect.Effect<
  void,
  LoggedInOnAnotherDeviceError | UnexpectedServerError,
  UserDbService
> => {
  if (Option.isNone(received)) return Effect.void
  if (Option.isSome(stored))
    return stored.value === received.value
      ? Effect.void
      : Effect.fail(new LoggedInOnAnotherDeviceError())

  return Effect.flatMap(UserDbService, (userDb) =>
    userDb.updateLoginSessionId({
      publicKey: security.publicKey,
      hash: security.serverHash,
      loginSessionId: received.value,
    })
  )
}

export const refreshUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'refreshUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          const commonMetricAttributes = commonMetricAttributesFromHeaders(
            req.headers
          )
          yield* _(reportUserRefresh(commonMetricAttributes))
          const contactDb = yield* _(ContactDbService)
          const contactActiveWindowDays = yield* _(
            contactActiveWindowDaysConfig
          )
          const hideUsersWithoutPublicKeyV2 = yield* _(
            contactHideUsersWithoutPublicKeyV2Config
          )

          const existingUser = yield* _(findUserOrFail(security))
          yield* _(
            ensureSameLoginSession({
              security,
              stored: existingUser.loginSessionId,
              received: Option.fromNullable(req.payload.loginSessionId),
            })
          )

          const becameVisibleAsContact =
            isHiddenAsContact({
              refreshedAt: existingUser.refreshedAt,
              publicKeyV2: existingUser.publicKeyV2,
              activeWithinDays: contactActiveWindowDays,
              hideUsersWithoutPublicKeyV2,
            }) &&
            !isHiddenAsContact({
              refreshedAt: new Date(),
              publicKeyV2: security.publicKeyV2,
              activeWithinDays: contactActiveWindowDays,
              hideUsersWithoutPublicKeyV2,
            })

          const expiredForMetricsAfterDays = yield* _(
            contactConsideredAsExpiredForMetricsAfterDaysConfig
          )
          const daysInactive = dayjs().diff(existingUser.refreshedAt, 'day')
          const remindersReceived =
            existingUser.numberOfInactivityNotificationsSent
          // Reminded users count as reactivated even below the metrics
          // window - reminders start earlier and those returns would
          // otherwise be invisible.
          const isReactivatedForMetrics =
            remindersReceived > 0 || daysInactive >= expiredForMetricsAfterDays

          yield* _(
            refreshUserRecord({
              security,
              headers: req.headers,
              vexlNotificationToken: req.payload.vexlNotificationToken,
            })
          )

          if (isReactivatedForMetrics) {
            yield* _(
              reportUserReactivated({
                commonMetricAttributes,
                daysInactive,
                remindersReceived,
                daysSinceLastReminder: Option.match(
                  existingUser.lastInactivityNotificationSentAt,
                  {
                    onNone: () => 'none',
                    onSome: (sentAt) => dayjs().diff(sentAt, 'day'),
                  }
                ),
              })
            )
          }

          const importedHashes = becameVisibleAsContact
            ? yield* _(
                contactDb.findContactsByHashFrom(security.serverHash),
                Effect.map(Array.map((one) => one.hashTo))
              )
            : []

          return {
            importedHashes,
            ownerHash: security.serverHash,
          }
        }).pipe(
          withDbTransaction,
          withUserActionRedisLock(security.hash),
          Effect.tap(({importedHashes, ownerHash}) =>
            Array.isEmptyReadonlyArray(importedHashes)
              ? Effect.void
              : notifyOthersAboutNewUserForked({
                  importedHashes,
                  ownerHash,
                })
          ),
          Effect.as({})
        )
      ),
      makeEndpointEffect
    )
)
