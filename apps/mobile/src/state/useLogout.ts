import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import * as O from 'fp-ts/Option'
import messaging from '@react-native-firebase/messaging'
import {sessionAtom} from './session'
import {deleteOffersActionAtom} from './marketplace'
import {myOffersAtom} from './marketplace/atom'
import notEmpty from '../utils/notEmpty'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {privateApiAtom} from '../api'
import deleteAllInboxesActionAtom from './chat/atoms/deleteAllInboxesActionAtom'
import reportError from '../utils/reportError'

async function failSilently<T>(promise: Promise<T>): Promise<
  | {success: true; result: T}
  | {
      success: false
      error: unknown
    }
> {
  return await promise
    .then((result) => ({success: true as const, result}))
    .catch((e) => ({success: false as const, error: e as unknown}))
}

export function useLogout(): () => Promise<void> {
  const setSession = useSetAtom(sessionAtom)
  const deleteMyOffers = useSetAtom(deleteOffersActionAtom)
  const deleteAllInboxes = useSetAtom(deleteAllInboxesActionAtom)
  const store = useStore()

  return useCallback(async () => {
    try {
      // offer service
      await failSilently(
        deleteMyOffers({
          adminIds: store
            .get(myOffersAtom)
            .map((offer) => offer.ownershipInfo?.adminId)
            .filter(notEmpty),
        })()
      )

      // chat service
      await failSilently(deleteAllInboxes()())

      // contact service
      await failSilently(store.get(privateApiAtom).contact.deleteUser()())

      // User service
      await failSilently(store.get(privateApiAtom).user.deleteUser()())

      // session
      setSession(O.none)

      // Local storage
      clearMmkvStorageAndEmptyAtoms()

      // firebase token
      await failSilently(messaging().deleteToken())
    } catch (e) {
      reportError('error', 'Critical error while logging out', e)

      setSession(O.none)
      clearMmkvStorageAndEmptyAtoms()
      await failSilently(messaging().deleteToken())
    }
  }, [deleteAllInboxes, deleteMyOffers, setSession, store])
}
