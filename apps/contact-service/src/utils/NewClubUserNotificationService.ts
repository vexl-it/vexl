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
  HashSet,
  Layer,
  MutableHashMap,
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

const toEntries = <K, V>(
  map: MutableHashMap.MutableHashMap<K, V>
): Array<[K, V]> =>
  pipe(
    map,
    MutableHashMap.keys,
    Array.filterMap((k) =>
      MutableHashMap.get(map, k).pipe(Option.map((value) => [k, value]))
    )
  )

const prepareNotificationsFromRedisData = (
  redisData: readonly ClubNotificationRecord[]
): Array<{
  data: Record<string, string>
  tokens: ExpoNotificationToken[]
}> => {
  const keysToClubs = MutableHashMap.empty<
    ExpoNotificationToken,
    HashSet.HashSet<ClubUuid>
  >()

  for (const {token, clubUuid} of redisData) {
    const clubUuidsForToken = pipe(
      MutableHashMap.get(keysToClubs, token),
      Option.getOrElse(() => HashSet.empty()),
      HashSet.add(clubUuid)
    )
    MutableHashMap.set(keysToClubs, token, clubUuidsForToken)
  }

  return pipe(
    keysToClubs,
    toEntries,
    Array.filterMap(([token, clubUuids]) => {
      const clubUuidsArray = Array.fromIterable(HashSet.values(clubUuids))
      if (!Array.isNonEmptyArray(clubUuidsArray)) return Option.none()

      return Option.some({
        tokens: [token],
        data: new NewClubConnectionNotificationData({
          trackingId: Option.none(),
          clubUuids: clubUuidsArray,
        }).toData(),
      })
    })
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
                    message: 'Club not found',
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
              saveIntoRedis(NEW_CLUB_USER_NOTIFICATIONS_KEY, recordsToSave),
              Effect.catchAll(
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    message: 'Error saving club notifications to redis',
                    cause: e,
                  })
              )
            )
          }),
        flushAndSendRegisteredClubNotifications: () =>
          Effect.gen(function* (_) {
            const dataFromRedis = yield* _(
              readAndDeleteList(NEW_CLUB_USER_NOTIFICATIONS_KEY),
              Effect.catchTag('NoSuchElementException', () =>
                Effect.zipRight(
                  Effect.log('No new clubs notifications to report'),
                  Effect.succeed([] as readonly ClubNotificationRecord[])
                )
              ),
              Effect.catchAll(
                (e) =>
                  new UnexpectedServerError({
                    status: 500,
                    message:
                      'Error reading and deleting club notifications from redis',
                    cause: e,
                  })
              )
            )

            const notificationsToSend =
              prepareNotificationsFromRedisData(dataFromRedis)

            yield* _(
              Effect.log(
                `Reporting notification about new users in club to ${notificationsToSend.length} users`
              )
            )

            yield* _(
              Effect.all(
                Array.map(notificationsToSend, (one) =>
                  sendExpoNotificationToAllHandleNonExistingTokens(one)
                ),
                {concurrency: 10}
              ),
              Effect.catchAll(
                (a) =>
                  new UnexpectedServerError({
                    status: 500,
                    message: 'Error sending notifications',
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
