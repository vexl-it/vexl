import {type SqlClient} from '@effect/sql/SqlClient'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
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
import {Array, Context, Effect, flow, Layer, Option, pipe} from 'effect/index'
import {
  inactivityNotificationAfterDaysConfig,
  newContentNotificationAfterConfig,
} from '../configs'
import {ClubMembersDbService} from '../db/ClubMemberDbService'
import {ClubsDbService} from '../db/ClubsDbService'
import {type ClubRecordId} from '../db/ClubsDbService/domain'
import {UserDbService} from '../db/UserDbService'
import {NotificationsTokensEquivalence} from '../db/UserDbService/domain'
import {queryAndReportNumberOfInnactiveUsers} from '../metrics'
import {type ServerHashedNumber} from '../utils/serverHashContact'

export interface UserNotificationServiceOperations {
  notifyOthersAboutNewUser: (
    importedHashes: readonly ServerHashedNumber[],
    ownerHash: ServerHashedNumber
  ) => Effect.Effect<void>
  notifyOthersAboutNewClubUser: (
    clubUuid: ClubUuid,
    triggeringUser: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>
  notifyUserAboutClubAddmission: (
    publicKey: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>
  notifyUsersAboutInactivity: () => Effect.Effect<
    void,
    UnexpectedServerError,
    SqlClient
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
          triggeringUser: PublicKeyPemBase64
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
              Array.filter((one) => one.publicKey !== triggeringUser),
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

            const notifyBeforeDate = dayjs()
              .subtract(inactivityNotificationAfterDays, 'day')
              .toDate()

            // todo #2142 - remove after moving to vexlNotificationToken
            const inactivityNotifications = yield* _(
              userDbService.findFirebaseTokensOfInactiveUsers(notifyBeforeDate),
              Effect.map(
                flow(
                  Array.map(
                    (one) =>
                      new UserInactivityNotificationMqEntry({
                        token: Option.getOrNull(one.vexlNotificationToken),
                        notificationToken: Option.getOrNull(one.expoToken),
                      })
                  )
                )
              )
            )

            // todo #2142 - uncomment and use this after moving to vexlNotificationToken
            /**
             const inactivityNotifications = yield* _(
              userDbService.findVexlNotificationTokensOfInactiveUsers(
                notifyBeforeDate
              ),
              Effect.map(
                flow(
                  Array.filterMap((r) =>
                    Option.fromNullable(r.vexlNotificationToken)
                  ),
                  Array.map(
                    (token) => new UserInactivityNotificationMqEntry({token})
                  )
                )
              )
            )
             */

            if (Array.isEmptyReadonlyArray(inactivityNotifications)) {
              yield* _(Effect.log('No inactive users to notify'))
            }

            yield* _(
              Effect.log('Notifying inactive users', {
                count: inactivityNotifications.length,
              })
            )

            yield* _(
              inactivityNotifications,
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
                  attributes: {count: inactivityNotifications.length},
                }
              )
            )

            yield* _(Effect.logInfo('Reporting number of inactive users'))
            yield* _(queryAndReportNumberOfInnactiveUsers)
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
