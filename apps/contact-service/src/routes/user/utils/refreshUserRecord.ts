import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import dayjs from 'dayjs'
import {Array, type ConfigError, Effect, Option} from 'effect'
import {
  contactActiveWindowDaysConfig,
  contactConsideredAsExpiredForMetricsAfterDaysConfig,
  contactHideUsersWithoutPublicKeyV2Config,
} from '../../../configs'
import {ContactDbService} from '../../../db/ContactDbService'
import {UserDbService} from '../../../db/UserDbService'
import {type UserRecord} from '../../../db/UserDbService/domain'
import {reportUserReactivated} from '../../../metrics'
import {type UserNotificationService} from '../../../services/UserNotificationService'
import {notifyOthersAboutNewUserForked} from '../../contacts/utils/notifyOthersAboutNewUser'

export interface UserSecurity {
  publicKey: PublicKeyPemBase64
  serverHash: ServerHashedNumber
  publicKeyV2: Option.Option<PublicKeyV2>
}

export const findUserOrFail = (
  security: UserSecurity
): Effect.Effect<
  UserRecord,
  UserNotFoundError | UnexpectedServerError,
  UserDbService
> =>
  Effect.flatMap(UserDbService, (userDb) =>
    userDb.findUserByPublicKeyAndHash({
      hash: security.serverHash,
      publicKey: security.publicKey,
    })
  ).pipe(
    Effect.flatten,
    Effect.catchTag('NoSuchElementException', () =>
      Effect.fail(new UserNotFoundError())
    )
  )

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

const becomesVisibleAsContact = ({
  existingUser,
  security,
}: {
  existingUser: UserRecord
  security: UserSecurity
}): Effect.Effect<boolean, ConfigError.ConfigError> =>
  Effect.gen(function* (_) {
    const activeWithinDays = yield* _(contactActiveWindowDaysConfig)
    const hideUsersWithoutPublicKeyV2 = yield* _(
      contactHideUsersWithoutPublicKeyV2Config
    )
    return (
      isHiddenAsContact({
        refreshedAt: existingUser.refreshedAt,
        publicKeyV2: existingUser.publicKeyV2,
        activeWithinDays,
        hideUsersWithoutPublicKeyV2,
      }) &&
      !isHiddenAsContact({
        refreshedAt: new Date(),
        publicKeyV2: security.publicKeyV2,
        activeWithinDays,
        hideUsersWithoutPublicKeyV2,
      })
    )
  })

const reportIfReactivated = ({
  existingUser,
  headers,
}: {
  existingUser: UserRecord
  headers: CommonHeaders
}): Effect.Effect<void, ConfigError.ConfigError, MetricsClientService> =>
  Effect.gen(function* (_) {
    const expiredForMetricsAfterDays = yield* _(
      contactConsideredAsExpiredForMetricsAfterDaysConfig
    )
    const daysInactive = dayjs().diff(existingUser.refreshedAt, 'day')
    const remindersReceived = existingUser.numberOfInactivityNotificationsSent
    // Reminded users count as reactivated even below the metrics
    // window - reminders start earlier and those returns would
    // otherwise be invisible.
    if (remindersReceived === 0 && daysInactive < expiredForMetricsAfterDays)
      return

    yield* _(
      reportUserReactivated({
        commonMetricAttributes: commonMetricAttributesFromHeaders(headers),
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
  })

export interface RefreshedUser {
  importedHashes: readonly ServerHashedNumber[]
  ownerHash: ServerHashedNumber
}

/**
 * Marks the user active. Returns the contacts to notify, non-empty only when
 * the user just became visible to them again. Notify them once the
 * transaction commits, with notifyContactsAboutReturnedUser.
 */
export const refreshUserRecord = ({
  security,
  headers,
  vexlNotificationToken,
  existingUser,
}: {
  security: UserSecurity
  headers: CommonHeaders
  vexlNotificationToken: Option.Option<VexlNotificationToken>
  existingUser: UserRecord
}): Effect.Effect<
  RefreshedUser,
  UnexpectedServerError | ConfigError.ConfigError,
  UserDbService | ContactDbService | MetricsClientService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const becameVisible = yield* _(
      becomesVisibleAsContact({existingUser, security})
    )

    if (Option.isSome(vexlNotificationToken)) {
      yield* _(
        userDb.clearVexlNotificationTokenHeldByOtherUsers({
          publicKey: security.publicKey,
          hash: security.serverHash,
          token: vexlNotificationToken.value,
        })
      )
    }

    yield* _(
      userDb.updateRefreshUser({
        publicKey: security.publicKey,
        hash: security.serverHash,
        clientVersion: headers.clientVersionOrNone,
        countryPrefix: headers.prefixOrNone,
        appSource: headers.appSourceOrNone,
        vexlNotificationToken,
        refreshedAt: new Date(),
        publicKeyV2: security.publicKeyV2,
      })
    )

    yield* _(reportIfReactivated({existingUser, headers}))

    const importedHashes = becameVisible
      ? yield* _(
          ContactDbService,
          Effect.flatMap((contactDb) =>
            contactDb.findContactsByHashFrom(security.serverHash)
          ),
          Effect.map(Array.map((one) => one.hashTo))
        )
      : []

    return {importedHashes, ownerHash: security.serverHash}
  })

export const notifyContactsAboutReturnedUser = ({
  importedHashes,
  ownerHash,
}: RefreshedUser): Effect.Effect<void, never, UserNotificationService> =>
  Array.isEmptyReadonlyArray(importedHashes)
    ? Effect.void
    : notifyOthersAboutNewUserForked({importedHashes, ownerHash})
