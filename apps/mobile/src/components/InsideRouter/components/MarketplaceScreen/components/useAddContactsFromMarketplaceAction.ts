import {useNavigation} from '@react-navigation/native'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Linking} from 'react-native'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from '../../../../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import {areContactsPermissionsGranted} from '../../../../../state/contacts/utils'
import wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom from '../../../../../state/lastRouteMmkvAtom'

export default function useAddContactsFromMarketplaceAction(): () => void {
  const navigation = useNavigation()
  const loadContactsFromDevice = useSetAtom(loadContactsFromDeviceActionAtom)
  const setLoadingContactsFromDevice = useSetAtom(loadingContactsFromDeviceAtom)
  const setWasLastRouteBeforeRedirectOnContactsScreen = useSetAtom(
    wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom
  )

  return useCallback(() => {
    void Effect.runPromise(
      areContactsPermissionsGranted().pipe(
        Effect.catchAll(() => Effect.succeed(false))
      )
    ).then((permissionsGranted) => {
      if (!permissionsGranted) {
        void Linking.openSettings().then(() => {
          setWasLastRouteBeforeRedirectOnContactsScreen({value: true})
        })
        return
      }

      setLoadingContactsFromDevice(true)
      void Effect.runPromise(
        loadContactsFromDevice().pipe(
          Effect.catchAll(() => Effect.succeed('success'))
        )
      ).finally(() => {
        setLoadingContactsFromDevice(false)
        navigation.navigate('SetContacts', {filter: 'new'})
      })
    })
  }, [
    loadContactsFromDevice,
    navigation,
    setLoadingContactsFromDevice,
    setWasLastRouteBeforeRedirectOnContactsScreen,
  ])
}
