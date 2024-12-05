import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../../api'
import reportError from '../reportError'
import {useOnFocusAndAppState} from '../useFocusAndAppState'
import {versionServiceAtom} from './atoms'

export default function useSetupVersionServiceState(): void {
  const api = useAtomValue(apiAtom)
  const setVersionServiceState = useSetAtom(versionServiceAtom)
  useOnFocusAndAppState(
    useCallback(() => {
      console.log('Fetching version service info')
      void api.user.getVersionServiceInfo().pipe(
        Effect.andThen((info) => {
          setVersionServiceState({
            offerRerequestLimitDays: info.offerRerequestLimitDays,
            requestForceUpdate: info.requestForceUpdate,
            maintenanceUntil: info.maintenanceUntil.pipe(
              Option.getOrElse(() => undefined)
            ),
          })
          console.log('Version service info fetched', JSON.stringify(info))
        }),
        Effect.mapError((e) => {
          console.log('Error while fetching version service info')
          reportError(
            'warn',
            new Error('Error while fetching version service info'),
            {e}
          )
          return Effect.void
        }),
        Effect.runPromise
      )
    }, [api, setVersionServiceState])
  )
}
