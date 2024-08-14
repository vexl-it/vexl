import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'

export const withUserActionRedisLock = <A, E, R>(
  hash: HashedPhoneNumber
): ReturnType<typeof withRedisLock<A, E, R>> =>
  withRedisLock(`userAction:${hash}`, 500)
