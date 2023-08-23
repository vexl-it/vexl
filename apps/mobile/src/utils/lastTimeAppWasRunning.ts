import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {storage} from './fpMmkv'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import {safeParse} from './fpUtils'

const LAST_TIME_APP_WAS_RUNNING_KEY = 'lastTimeAppWasRunning'

export function setLastTimeAppWasRunningToNow(): void {
  const now = unixMillisecondsNow()
  storage.set(LAST_TIME_APP_WAS_RUNNING_KEY)(now.toString())
}

export function getLastTimeAppWasRunning(): UnixMilliseconds {
  return pipe(
    localStorage.get(LAST_TIME_APP_WAS_RUNNING_KEY),
    E.chain(safeParse(UnixMilliseconds)),
    E.getOrElse(() => UnixMilliseconds0)
  )
}
