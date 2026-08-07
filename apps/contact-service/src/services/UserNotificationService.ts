import {type SqlClient} from '@effect/sql/SqlClient'
import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type UserInactivityNotificationVariant} from '@vexl-next/domain/src/general/notifications'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {
  ClubExpiredNotificationMqEntry,
  ClubFlaggedNotificationMqEntry,
  EnqueueUserNotification,
  NewClubUserNotificationMqEntry,
  NewContentNotificationMqEntry,
  NewUserNotificationMqEntry,
  ScheduleUserNotificationProducerLayer,
  UserAdmittedToClubNotificationMqEntry,
  UserInactivityNotificationMqEntry,
  UserLoginOnDifferentDeviceNotificationMqEntry,
} from '@vexl-next/server-utils/src/UserNotificationMq'
import dayjs from 'dayjs'
import {
  Array,
  Context,
  Effect,
  flow,
  Layer,
  Option,
  pipe,
  Record,
} from 'effect/index'
import {
  contactPublicImportCountThresholdConfig,
  inactivityNotificationAfterDaysConfig,
  inactivityNotificationFollowUpAfterDaysConfig,
  inactivityNotificationRecurringIntervalDaysConfig,
  newContentNotificationAfterConfig,
} from '../configs'
import {ClubMembersDbService} from '../db/ClubMemberDbService'
import {ClubsDbService} from '../db/ClubsDbService'
import {type ClubRecordId} from '../db/ClubsDbService/domain'
import {UserDbService} from '../db/UserDbService'
import {NotificationsTokensEquivalence} from '../db/UserDbService/domain'
import {type UserToNotifyAboutInactivity} from '../db/UserDbService/queries/createFindUsersToNotifyAboutInactivity'
import {
  queryAndReportInactiveUsersByRemindersSent,
  queryAndReportNumberOfInactiveUsers,
  reportInactivityNotificationsSent,
} from '../metrics'
import {type ServerHashedNumber} from '../utils/serverHashContact'

export interface UserNotificationServiceOperations {
  notifyOthersAboutNewUser: (
    importedHashes: readonly ServerHashedNumber[],
    ownerHash: ServerHashedNumber
  ) => Effect.Effect<void>
  notifyOthersAboutNewClubUser: (
    clubUuid: ClubUuid,
    triggeringUser: PublicKeyPemBase64 | PublicKeyV2
  ) => Effect.Effect<void, UnexpectedServerError>
  notifyUserAboutClubAddmission: (
    publicKey: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>
  notifyUsersAboutInactivity: () => Effect.Effect<
    void,
    UnexpectedServerError,
    SqlClient | MetricsClientService
  >
  notifyUsersAboutFlaggedClub: (
    id: ClubRecordId,
    clubUuid: ClubUuid
  ) => Effect.Effect<void, UnexpectedServerError>
  notifyUsersAboutExpiredClub: (
    id: ClubRecordId,
    clubUuid: ClubUuid
  ) => Effect.Effect<void, UnexpectedServerError>
  notifyUserAboutLoginOnDifferentDevice: (
    token: VexlNotificationToken | null,
    notificationToken: ExpoNotificationToken | null
  ) => Effect.Effect<void>
  notifyUsersAboutNewContent: () => Effect.Effect<void, UnexpectedServerError>
}

export class UserNotificationService extends Context.Tag(
  'UserNotificationService'
)<UserNotificationService, UserNotificationServiceOperations>() {
  static Layer = Layer.effect(
    UserNotificationService,
    Effect.gen(function* (_) {
      const userDbService = yield* _(UserDbService)
      const enqueueUserNotification = yield* _(EnqueueUserNotification)
      const clubMemberDb = yield* _(ClubMembersDbService)
      const clubsDb = yield* _(ClubsDbService)

      return {
        notifyOthersAboutNewUser: (
          importedHashes: readonly ServerHashedNumber[],
          ownerHash: ServerHashedNumber
        ) =>
          Effect.gen(function* (_) {
            const publicImportCountThreshold = yield* _(
              contactPublicImportCountThresholdConfig
            )
            // todo #2142 - remove after moving to vexlNotificationToken
            const firstLevelTokens = yield* _(
              userDbService.findFirebaseTokensOfUsersWhoDirectlyImportedHash({
                importedHashes,
                userHash: ownerHash,
              })
            )

            // todo #2142 - uncomment and use this after moving to vexlNotificationToken
            /**
              const firstLevelTokens = yield* _(
              userDbService.findVexlNotificationTokensOfUsersWhoDirectlyImportedHash(
                {
                  importedHashes,
                  userHash: ownerHash,
                }
              ),
              Effect.map(
                Array.filterMap((r) =>
                  Option.fromNullable(r.vexlNotificationToken)
                )
              )
            )
             */

            // todo #2142 - remove after moving to vexlNotificationToken
            const secondLevelTokens = yield* _(
              userDbService.findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact(
                {
                  importedHashes,
                  ownerHash,
                  publicImportCountThreshold,
                }
              )
            )

            // todo #2142 - uncomment and use this after moving to vexlNotificationToken
            /**
            const secondLevelTokens = yield* _(
              userDbService.findVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContact(
                {
                  importedHashes,
                  ownerHash,
                  publicImportCountThreshold,
                }
              ),
              Effect.map(
                Array.filterMap((r) =>
                  Option.fromNullable(r.vexlNotificationToken)
                )
              )
            )
             */

            const allTokens = pipe(
              firstLevelTokens,
              Array.appendAll(secondLevelTokens),
              Array.dedupeWith(NotificationsTokensEquivalence)
            )

            yield* _(
              allTokens,
              Array.filter(
                (entry) =>
                  Option.isSome(entry.vexlNotificationToken) ||
                  Option.isSome(entry.expoToken)
              ),
              Array.map((entry) =>
                pipe(
                  enqueueUserNotification(
                    new NewUserNotificationMqEntry({
                      token: Option.getOrNull(entry.vexlNotificationToken),
                      notificationToken: Option.getOrNull(entry.expoToken),
                    }),
                    {delay: 0}
                  ),
                  Effect.catchAll((e) =>
                    Effect.logWarning(
                      'Failed to enqueue new user notification',
                      e
                    )
                  )
                )
              ),
              Effect.allWith({concurrency: 'unbounded'}),
              Effect.withSpan(
                'Enqueue new user notifications via VexlNotificationToken'
              )
            )
          }).pipe(
            Effect.tapError((e) =>
              Effect.logError('Error notifying others about new user', e)
            ),
            Effect.catchAll(() => Effect.void),
            Effect.withSpan('Notify others about new user', {
              attributes: {
                hashesLength: Array.length(importedHashes),
                userHash: ownerHash,
              },
            })
          ),
        notifyOthersAboutNewClubUser: (
          clubUuid: ClubUuid,
          triggeringUser: PublicKeyPemBase64 | PublicKeyV2
        ) =>
          Effect.gen(function* (_) {
            const club = yield* _(
              clubsDb.findClubByUuid({uuid: clubUuid}),
              Effect.flatten,
              Effect.catchTag(
                'NoSuchElementException',
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    message: 'Club not found',
                    cause: e,
                  })
              )
            )

            const members = yield* _(
              clubMemberDb.queryAllClubMembers({
                id: club.id,
              })
            )

            const notificationsRecords = pipe(
              members,
              Array.filter(
                (one) =>
                  one.notificationToken !== null ||
                  one.vexlNotificationToken !== null
              ),
              Array.filter(
                (one) =>
                  one.publicKey !== triggeringUser &&
                  one.publicKeyV2 !== triggeringUser
              ),
              Array.map(
                (entry) =>
                  new NewClubUserNotificationMqEntry({
                    token: entry.vexlNotificationToken,
                    notificationToken: entry.notificationToken,
                    clubUuid,
                  })
              )
            )

            if (!Array.isNonEmptyArray(notificationsRecords)) return

            yield* _(
              notificationsRecords,
              Array.map((record) =>
                pipe(
                  enqueueUserNotification(record, {delay: 0}),
                  Effect.catchAll((e) =>
                    Effect.logWarning(
                      'Failed to enqueue new club user notification',
                      e
                    )
                  )
                )
              ),
              Effect.all,
              Effect.withSpan(
                'Enqueue new club user notifications via VexlNotificationToken'
              )
            )
          }),
        notifyUserAboutClubAddmission: (publicKey: PublicKeyPemBase64) =>
          Effect.gen(function* (_) {
            const member = yield* _(
              clubMemberDb.findClubMemberByPublicKey({publicKey}),
              Effect.flatten,
              Effect.catchTag(
                'NoSuchElementException',
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    message: 'Club member not found',
                    cause: e,
                  })
              )
            )

            if (
              member.notificationToken === null &&
              member.vexlNotificationToken === null
            ) {
              yield* _(
                Effect.logWarning(
                  'No notification token found for user admitted to club, skipping notification',
                  {publicKey}
                )
              )
              return
            }

            yield* _(
              enqueueUserNotification(
                new UserAdmittedToClubNotificationMqEntry({
                  token: member.vexlNotificationToken,
                  notificationToken: member.notificationToken,
                  publicKey,
                }),
                {delay: 0}
              ),
              Effect.catchAll((e) =>
                Effect.logWarning(
                  'Failed to enqueue new club user notification',
                  e
                )
              )
            )
          }),
        notifyUsersAboutInactivity: () =>
          Effect.gen(function* (_) {
            const inactivityNotificationAfterDays = yield* _(
              inactivityNotificationAfterDaysConfig
            )
            const followUpAfterDays = yield* _(
              inactivityNotificationFollowUpAfterDaysConfig
            )
            const recurringIntervalDays = yield* _(
              inactivityNotificationRecurringIntervalDaysConfig
            )

            const now = dayjs()
            const usersToNotify = yield* _(
              userDbService.findUsersToNotifyAboutInactivity({
                firstNotificationBefore: now
                  .subtract(inactivityNotificationAfterDays, 'day')
                  .toDate(),
                followUpDueBefore: now
                  .subtract(followUpAfterDays, 'day')
                  .toDate(),
                recurringDueBefore: now
                  .subtract(recurringIntervalDays, 'day')
                  .toDate(),
              })
            )

            // Users inactive for longer than the first-notification window
            // get the follow-up wording right away - their offers are no
            // longer active, so the first wording would be wrong.
            const firstWordingCutoff = now.subtract(
              inactivityNotificationAfterDays + followUpAfterDays,
              'day'
            )
            const [followUpUsers, firstTimeUsers] = pipe(
              usersToNotify,
              Array.partition(
                (user) =>
                  user.numberOfInactivityNotificationsSent === 0 &&
                  dayjs(user.refreshedAt).isAfter(firstWordingCutoff)
              )
            )

            if (Array.isEmptyReadonlyArray(usersToNotify)) {
              yield* _(Effect.log('No inactive users to notify'))
            }

            yield* _(
              Effect.log('Notifying inactive users', {
                firstNotificationCount: firstTimeUsers.length,
                followUpNotificationCount: followUpUsers.length,
              })
            )

            const toMqEntry =
              (variant: UserInactivityNotificationVariant) =>
              (user: UserToNotifyAboutInactivity) =>
                new UserInactivityNotificationMqEntry({
                  token: Option.getOrNull(user.vexlNotificationToken),
                  notificationToken: Option.getOrNull(user.expoToken),
                  variant,
                })

            yield* _(
              pipe(
                Array.map(firstTimeUsers, toMqEntry('FIRST')),
                Array.appendAll(
                  Array.map(followUpUsers, toMqEntry('OFFERS_DEACTIVATED'))
                )
              ),
              Array.map((one) =>
                pipe(
                  enqueueUserNotification(one, {delay: 0}),
                  Effect.catchAll((e) =>
                    Effect.logWarning(
                      'Failed to enqueue inactivity notification',
                      e
                    )
                  )
                )
              ),
              Effect.all,
              Effect.withSpan(
                'Enqueue inactivity notifications via VexlNotificationToken',
                {
                  attributes: {count: usersToNotify.length},
                }
              )
            )

            if (Array.isNonEmptyReadonlyArray(firstTimeUsers)) {
              yield* _(
                userDbService.updateInactivityNotificationSent({
                  ids: Array.map(firstTimeUsers, (user) => user.id),
                  sentAt: now.toDate(),
                  variant: 'FIRST',
                })
              )
            }
            if (Array.isNonEmptyReadonlyArray(followUpUsers)) {
              yield* _(
                userDbService.updateInactivityNotificationSent({
                  ids: Array.map(followUpUsers, (user) => user.id),
                  sentAt: now.toDate(),
                  variant: 'OFFERS_DEACTIVATED',
                })
              )
            }

            if (Array.isNonEmptyReadonlyArray(firstTimeUsers)) {
              yield* _(
                reportInactivityNotificationsSent({
                  count: firstTimeUsers.length,
                  variant: 'FIRST',
                  notificationOrdinal: 1,
                })
              )
            }
            yield* _(
              followUpUsers,
              Array.groupBy((user) =>
                String(
                  Math.max(user.numberOfInactivityNotificationsSent + 1, 2)
                )
              ),
              Record.toEntries,
              Array.map(([ordinal, users]) =>
                reportInactivityNotificationsSent({
                  count: users.length,
                  variant: 'OFFERS_DEACTIVATED',
                  notificationOrdinal: Number(ordinal),
                })
              ),
              Effect.all
            )

            yield* _(Effect.logInfo('Reporting number of inactive users'))
            yield* _(queryAndReportNumberOfInactiveUsers)
            yield* _(queryAndReportInactiveUsersByRemindersSent)
          }).pipe(
            Effect.tapError((e) =>
              Effect.logError('Error processing user inactivity', e)
            ),
            Effect.catchTags({
              'ConfigError': (e) =>
                new UnexpectedServerError({
                  status: 500,
                  cause: e,
                  message:
                    'Config error while processing user inactivity. Make sure inactivityNotificationAfterDays is set in the config',
                }),
            }),
            Effect.withSpan('ProcessUserInactivity')
          ),
        notifyUsersAboutFlaggedClub: (id: ClubRecordId, clubUuid: ClubUuid) =>
          Effect.gen(function* (_) {
            const flaggedClubNotifications = yield* _(
              clubMemberDb.queryAllClubMembers({id}),
              Effect.map(
                Array.filter(
                  (one) =>
                    one.notificationToken !== null ||
                    one.vexlNotificationToken !== null
                )
              ),
              Effect.map(
                flow(
                  Array.map(
                    (entry) =>
                      new ClubFlaggedNotificationMqEntry({
                        notificationToken: entry.notificationToken,
                        token: entry.vexlNotificationToken,
                        clubUuid,
                      })
                  )
                )
              )
            )

            yield* _(
              flaggedClubNotifications,
              Array.map((one) =>
                pipe(
                  enqueueUserNotification(one, {delay: 0}),
                  Effect.catchAll((e) =>
                    Effect.logWarning(
                      'Failed to enqueue flagged club notification',
                      e
                    )
                  )
                )
              ),
              Effect.all,
              Effect.withSpan(
                'Enqueue flagged club notifications via VexlNotificationToken',
                {
                  attributes: {count: flaggedClubNotifications.length},
                }
              )
            )
          }),
        notifyUsersAboutExpiredClub: (id: ClubRecordId, clubUuid: ClubUuid) =>
          Effect.gen(function* (_) {
            const expiredClubNotifications = yield* _(
              clubMemberDb.queryAllClubMembers({id}),
              Effect.map(
                flow(
                  Array.filter(
                    (one) =>
                      one.vexlNotificationToken !== null ||
                      one.notificationToken !== null
                  ),
                  Array.map(
                    (entry) =>
                      new ClubExpiredNotificationMqEntry({
                        notificationToken: entry.notificationToken,
                        token: entry.vexlNotificationToken,
                        clubUuid,
                      })
                  )
                )
              )
            )

            yield* _(
              expiredClubNotifications,
              Array.map((one) =>
                pipe(
                  enqueueUserNotification(one, {delay: 0}),
                  Effect.catchAll((e) =>
                    Effect.logWarning(
                      'Failed to enqueue expired club notification',
                      e
                    )
                  )
                )
              ),
              Effect.all,
              Effect.withSpan(
                'Enqueue expired club notifications via VexlNotificationToken',
                {
                  attributes: {count: expiredClubNotifications.length},
                }
              )
            )
          }),
        notifyUserAboutLoginOnDifferentDevice: (
          token: VexlNotificationToken | null,
          notificationToken: ExpoNotificationToken | null
        ) =>
          Effect.gen(function* (_) {
            if (token === null && notificationToken === null) {
              yield* _(
                Effect.logWarning(
                  'No notification token found for user login on different device, skipping notification'
                )
              )
              return
            }

            yield* _(
              enqueueUserNotification(
                new UserLoginOnDifferentDeviceNotificationMqEntry({
                  token,
                  notificationToken,
                }),
                {delay: 0}
              ),
              Effect.catchAll((e) =>
                Effect.logWarning(
                  'Failed to enqueue login on different device notification',
                  e
                )
              )
            )
          }),
        notifyUsersAboutNewContent: () =>
          Effect.gen(function* (_) {
            const notifyBeforeDate = dayjs()
              .subtract(yield* _(newContentNotificationAfterConfig), 'day')
              .toDate()

            // todo #2142 - remove after moving to vexlNotificationToken
            const tokensToNofify = yield* _(
              userDbService.findFirebaseTokensForNewContentNotification(
                notifyBeforeDate
              )
            )

            // todo #2142 - use this after moving to vexlNotificationToken
            /**
            const tokensToNofify = yield* _(
              userDbService.findVexlNotificationTokensForNewContentNotification(
                notifyBeforeDate
              )
            )
             */

            yield* _(
              tokensToNofify,
              Array.filter(
                (entry) =>
                  Option.isSome(entry.expoToken) ||
                  Option.isSome(entry.vexlNotificationToken)
              ),
              Array.map((entry) =>
                pipe(
                  enqueueUserNotification(
                    new NewContentNotificationMqEntry({
                      token: Option.getOrNull(entry.vexlNotificationToken),
                      notificationToken: Option.getOrNull(entry.expoToken),
                    }),
                    {delay: 0}
                  ),
                  Effect.catchAll((e) =>
                    Effect.logWarning(
                      'Failed to enqueue new content notification',
                      e
                    )
                  )
                )
              ),
              Effect.all,
              Effect.withSpan(
                'Enqueue new content notifications via VexlNotificationToken'
              )
            )

            yield* _(
              Effect.log('Sent new content notification', {
                VexlNotificationToken: tokensToNofify.length,
                total: tokensToNofify.length,
              })
            )
          }).pipe(
            Effect.tapError((e) =>
              Effect.logError('Error processing new content notification', e)
            ),
            Effect.catchTags({
              'ConfigError': (e) =>
                new UnexpectedServerError({
                  status: 500,
                  cause: e,
                  message:
                    'Config error while processing new content notification. Make sure newContentNotificationAfterConfig is set in the config',
                }),
            }),
            Effect.withSpan('processNewContentNotification')
          ),
      }
    })
  )

  static Live = UserNotificationService.Layer.pipe(
    Layer.provide(ScheduleUserNotificationProducerLayer)
  )
}
