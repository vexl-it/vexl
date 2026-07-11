import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {registerMmkvKey} from './atomUtils/mmkvMigrationRegistry'
import {storage} from './mmkv/effectMmkv'

const LAST_TIME_APP_WAS_RUNNING_KEY = 'lastTimeAppWasRunning'

registerMmkvKey({
  key: LAST_TIME_APP_WAS_RUNNING_KEY,
  policy: 'deviceLocal',
  nativeType: 'string',
})

export function setLastTimeAppWasRunningToNow(): void {
  const now = unixMillisecondsNow()
  storage.set(LAST_TIME_APP_WAS_RUNNING_KEY)(now.toString())
}

export function getLastTimeAppWasRunning(): UnixMilliseconds {
  return pipe(
    storage.getVerified(LAST_TIME_APP_WAS_RUNNING_KEY, UnixMilliseconds),
    E.getOrElse(() => UnixMilliseconds0)
  )
}
