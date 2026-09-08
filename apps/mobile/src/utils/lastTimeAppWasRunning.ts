import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Result} from 'effect'
import {pipe} from 'fp-ts/function'
import {storage} from './mmkv/effectMmkv'

const LAST_TIME_APP_WAS_RUNNING_KEY = 'lastTimeAppWasRunning'

export function setLastTimeAppWasRunningToNow(): void {
  const now = unixMillisecondsNow()
  storage.set(LAST_TIME_APP_WAS_RUNNING_KEY)(now.toString())
}

export function getLastTimeAppWasRunning(): UnixMilliseconds {
  return pipe(
    storage.getVerified(LAST_TIME_APP_WAS_RUNNING_KEY, UnixMilliseconds),
    Result.getOrElse(() => UnixMilliseconds0)
  )
}
