import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'

export const withClubJoiningActionRedisLock = <A, E, R>(
  clubUuid: ClubUuid
): ReturnType<typeof withRedisLock<A, E, R>> =>
  withRedisLock(`clubJoin:${clubUuid}`, 500)
