import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import dayjs from 'dayjs'
import {Array, Effect, Option, pipe} from 'effect'
import {
  contactActiveWindowDaysConfig,
  contactConsideredAsExpiredForMetricsAfterDaysConfig,
} from '../../configs'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {reportUserReactivated, reportUserRefresh} from '../../metrics'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {notifyOthersAboutNewUserForked} from '../contacts/utils/notifyOthersAboutNewUser'

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

export const refreshUser = makeHttpApiHandler(
  ContactApiSpecification,
  'User',
  'refreshUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* () {
          const commonMetricAttributes = commonMetricAttributesFromHeaders(
            req.headers
          )
          yield* reportUserRefresh(commonMetricAttributes)
          const userDb = yield* UserDbService
          const contactDb = yield* ContactDbService
          const contactActiveWindowDays = yield* contactActiveWindowDaysConfig

          const existingUser = yield* pipe(
            userDb.findUserByPublicKeyAndHash({
              hash: security.serverHash,
              publicKey: security.publicKey,
            }),
            Effect.flatMap(Effect.fromOption),
            Effect.catchTag('NoSuchElementError', () =>
              Effect.fail(new UserNotFoundError())
            )
          )

          const wasInactiveBeforeRefresh = isUserInactive({
            refreshedAt: existingUser.refreshedAt,
            activeWithinDays: contactActiveWindowDays,
          })

          const expiredForMetricsAfterDays =
            yield* contactConsideredAsExpiredForMetricsAfterDaysConfig
          const daysInactive = dayjs().diff(existingUser.refreshedAt, 'day')
          const remindersReceived =
            existingUser.numberOfInactivityNotificationsSent
          // Reminded users count as reactivated even below the metrics
          // window - reminders start earlier and those returns would
          // otherwise be invisible.
          const isReactivatedForMetrics =
            remindersReceived > 0 || daysInactive >= expiredForMetricsAfterDays

          if (Option.isSome(req.payload.vexlNotificationToken)) {
            yield* userDb.clearVexlNotificationTokenHeldByOtherUsers({
              publicKey: security.publicKey,
              hash: security.serverHash,
              token: req.payload.vexlNotificationToken.value,
            })
          }

          yield* userDb.updateRefreshUser({
            publicKey: security.publicKey,
            hash: security.serverHash,
            clientVersion: req.headers.clientVersionOrNone,
            countryPrefix: req.headers.prefixOrNone,
            appSource: req.headers.appSourceOrNone,
            vexlNotificationToken: req.payload.vexlNotificationToken,
            refreshedAt: new Date(),
            publicKeyV2: security.publicKeyV2,
          })

          if (isReactivatedForMetrics) {
            yield* reportUserReactivated({
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
          }

          const importedHashes = wasInactiveBeforeRefresh
            ? yield* pipe(
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
            Array.isReadonlyArrayEmpty(importedHashes)
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
