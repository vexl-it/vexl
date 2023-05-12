import {useAppState} from '../../utils/useAppState'
import {useCallback} from 'react'
import {useSetAtom} from 'jotai'
import {syncConnectionsActionAtom} from './atom/connectionStateAtom'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {updateAllOffersConnectionsActionAtom} from './atom/offerToConnectionsAtom'

export function useSyncConnections(): void {
  const syncConnections = useSetAtom(syncConnectionsActionAtom)
  const updateOffers = useSetAtom(updateAllOffersConnectionsActionAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        void pipe(syncConnections(), T.chain(updateOffers))()
      },
      [syncConnections, updateOffers]
    )
  )
}
