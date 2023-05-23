import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import * as O from 'fp-ts/Option'
import messaging from '@react-native-firebase/messaging'
import {sessionAtom} from './session'
import {deleteOffersAtom} from './marketplace'
import {myOffersAtom} from './marketplace/atom'
import notEmpty from '../utils/notEmpty'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'

export function useLogout(): () => void {
  const setSession = useSetAtom(sessionAtom)
  const deleteMyOffers = useSetAtom(deleteOffersAtom)
  const store = useStore()

  return useCallback(() => {
    deleteMyOffers({
      adminIds: store
        .get(myOffersAtom)
        .map((offer) => offer.ownershipInfo?.adminId)
        .filter(notEmpty),
    })
    setSession(O.none)
    clearMmkvStorageAndEmptyAtoms()
    void messaging().deleteToken()
  }, [deleteMyOffers, setSession, store])
}
