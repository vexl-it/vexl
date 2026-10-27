import {type SqlClient} from '@effect/sql/SqlClient'
import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type UserInactivityNotificationVariant} from '@vexl-next/domain/src/general/notifications'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
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
    token: VexlNotificationToken
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
            const firstLevelTokens = yield* _(
              userDbService.findVexlNotificationTokensOfUsersWhoDirectlyImportedHash(
                {
                  importedHashes,
                  userHash: ownerHash,
                }
              )
            )

            const secondLevelTokens = yield* _(
              userDbService.findVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContact(
                {
                  importedHashes,
                  ownerHash,
                  publicImportCountThreshold,
                }
              )
            )

            yield* _(
              firstLevelTokens,
              Array.appendAll(secondLevelTokens),
              Array.map((entry) => entry.vexlNotificationToken),
              Array.dedupe,
              Array.map((token) =>
                pipe(
                  enqueueUserNotification(
                    new NewUserNotificationMqEntry({token}),
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
                  one.publicKey !== triggeringUser &&
                  one.publicKeyV2 !== triggeringUser
              ),
              Array.filterMap((one) =>
                Option.fromNullable(one.vexlNotificationToken)
              ),
              Array.map(
                (token) => new NewClubUserNotificationMqEntry({token, clubUuid})
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

            if (member.vexlNotificationToken === null) {
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

            // Record the sends before enqueueing: a failed enqueue only
            // delays that user's reminder until the next cadence step,
            // while enqueueing first and failing to record would re-send
            // to everyone on every run.
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

            const toMqEntry =
              (variant: UserInactivityNotificationVariant) =>
              (user: UserToNotifyAboutInactivity) =>
                new UserInactivityNotificationMqEntry({
                  token: user.vexlNotificationToken,
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
                flow(
                  Array.filterMap((one) =>
                    Option.fromNullable(one.vexlNotificationToken)
                  ),
                  Array.map(
                    (token) =>
                      new ClubFlaggedNotificationMqEntry({token, clubUuid})
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
                  Array.filterMap((one) =>
                    Option.fromNullable(one.vexlNotificationToken)
                  ),
                  Array.map(
                    (token) =>
                      new ClubExpiredNotificationMqEntry({token, clubUuid})
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
        notifyUserAboutLoginOnDifferentDevice: (token: VexlNotificationToken) =>
          enqueueUserNotification(
            new UserLoginOnDifferentDeviceNotificationMqEntry({token}),
            {delay: 0}
          ).pipe(
            Effect.catchAll((e) =>
              Effect.logWarning(
                'Failed to enqueue login on different device notification',
                e
              )
            )
          ),
        notifyUsersAboutNewContent: () =>
          Effect.gen(function* (_) {
            const notifyBeforeDate = dayjs()
              .subtract(yield* _(newContentNotificationAfterConfig), 'day')
              .toDate()

            const tokensToNofify = yield* _(
              userDbService.findVexlNotificationTokensForNewContentNotification(
                notifyBeforeDate
              )
            )

            yield* _(
              tokensToNofify,
              Array.map((entry) =>
                pipe(
                  enqueueUserNotification(
                    new NewContentNotificationMqEntry({
                      token: entry.vexlNotificationToken,
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
