import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'

// The lock is released as soon as the request finishes; the duration only
// caps how long a crashed holder can block the user's next request. It must
// comfortably exceed the slowest guarded request (contact import, createUser
// with a large contact list) — an expired lock lets a concurrent request race
// the still-running transaction, which is how duplicate user rows were born.
export const withUserActionRedisLock = <A, E, R>(
  hash: HashedPhoneNumber
): ReturnType<typeof withRedisLock<A, E, R>> =>
  withRedisLock(`userAction:${hash}`, '30 seconds')
