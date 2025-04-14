import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuidE, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NewClubConnectionNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  ExpoNotificationTokenE,
  type ExpoNotificationToken,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {
  Array,
  Context,
  Effect,
  HashMap,
  HashSet,
  Layer,
  Option,
  pipe,
  Schema,
} from 'effect'
import {ClubMembersDbService} from '../db/ClubMemberDbService'
import {ClubsDbService} from '../db/ClubsDbService'
import {type UserDbService} from '../db/UserDbService'
import {sendExpoNotificationToAllHandleNonExistingTokens} from './expoNotifications'
import {type ExpoNotificationsService} from './expoNotifications/ExpoNotificationsService'

export const NEW_CLUB_USER_NOTIFICATIONS_KEY = 'NewClubUserNotifications'
export const ClubNotificationRecord = Schema.Struct({
  clubUuid: ClubUuidE,
  token: ExpoNotificationTokenE,
})
type ClubNotificationRecord = typeof ClubNotificationRecord.Type

const prepareNotificationsFromRedisData = (
  redisData: readonly ClubNotificationRecord[]
): Array<{
  data: Record<string, string>
  tokens: ExpoNotificationToken[]
}> => {
  const keysToClubs = HashMap.empty<
    ExpoNotificationToken,
    HashSet.HashSet<ClubUuid>
  >()

  for (const {token, clubUuid} of redisData) {
    const clubUuids = Option.getOrElse(HashMap.get(keysToClubs, token), () =>
      HashSet.empty()
    )
    HashSet.add(clubUuids, clubUuid)
    HashMap.set(keysToClubs, token, clubUuids)
  }

  return pipe(
    keysToClubs,
    HashMap.toEntries,
    Array.map(([token, clubUuids]) => ({
      tokens: [token],
      data: new NewClubConnectionNotificationData({
        clubUuids: Array.fromIterable(HashSet.values(clubUuids)),
      }).toData(),
    }))
  )
}

export interface NewClubUserNotificationsOperations {
  registerNewClubNotification: (args: {
    clubUuid: ClubUuid
    triggeringUser: PublicKeyPemBase64
  }) => Effect.Effect<void, UnexpectedServerError>
  flushAndSendRegisteredClubNotifications: () => Effect.Effect<
    void,
    UnexpectedServerError,
    ExpoNotificationsService | UserDbService
  >
}

export class NewClubUserNotificationsService extends Context.Tag(
  'NewClubUserNotificationsService'
)<NewClubUserNotificationsService, NewClubUserNotificationsOperations>() {
  static readonly Live = Layer.effect(
    NewClubUserNotificationsService,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const clubMemberDb = yield* _(ClubMembersDbService)
      const clubDb = yield* _(ClubsDbService)

      const saveIntoRedis = redis.insertToSet(ClubNotificationRecord)
      const readAndDeleteList = redis.readAndDeleteSet(ClubNotificationRecord)

      const toReturn: NewClubUserNotificationsOperations = {
        registerNewClubNotification: ({clubUuid, triggeringUser}) =>
          Effect.gen(function* (_) {
            const club = yield* _(
              clubDb.findClubByUuid({uuid: clubUuid}),
              Effect.flatten,
              Effect.catchTag(
                'NoSuchElementException',
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    detail: 'Club not found',
                    cause: e,
                  })
              )
            )

            const members = yield* _(
              clubMemberDb.queryAllClubMembers({id: club.id})
            )

            const recordsToSave = pipe(
              members,
              Array.filter((one) => one.publicKey !== triggeringUser),
              Array.map((one) => one.notificationToken),
              Array.filter((one): one is NonNullable<typeof one> => !!one),
              Array.map((token) => ({clubUuid, token}))
            )

            if (!Array.isNonEmptyArray(recordsToSave)) return

            yield* _(
              saveIntoRedis(NEW_CLUB_USER_NOTIFICATIONS_KEY, ...recordsToSave),
              Effect.catchAll(
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    detail: 'Error saving club notifications to redis',
                    cause: e,
                  })
              )
            )
          }),
        flushAndSendRegisteredClubNotifications: () =>
          Effect.gen(function* (_) {
            const toSend = yield* _(
              readAndDeleteList(NEW_CLUB_USER_NOTIFICATIONS_KEY),
              Effect.catchAll(
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    detail:
                      'Error reading and deleting club notifications from redis',
                    cause: e,
                  })
              )
            )

            const notificationsToSend =
              prepareNotificationsFromRedisData(toSend)

            yield* _(
              Effect.all(
                Array.map(notificationsToSend, (one) =>
                  sendExpoNotificationToAllHandleNonExistingTokens(one)
                )
              ),
              Effect.catchAll(
                (a) =>
                  new UnexpectedServerError({
                    status: 500,
                    detail: 'Error sending notifications',
                    cause: a,
                  })
              )
            )
          }),
      } satisfies NewClubUserNotificationsOperations

      return toReturn
    })
  )
}
