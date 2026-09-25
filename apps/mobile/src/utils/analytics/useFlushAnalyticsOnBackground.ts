import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useAppState} from '../useAppState'
import {flushAnalyticsActionAtom} from './flush'

export function useFlushAnalyticsOnBackground(): void {
  const flush = useSetAtom(flushAnalyticsActionAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'background') return
        Effect.runFork(flush().pipe(Effect.timeout('5 seconds'), Effect.ignore))
      },
      [flush]
    )
  )
}
