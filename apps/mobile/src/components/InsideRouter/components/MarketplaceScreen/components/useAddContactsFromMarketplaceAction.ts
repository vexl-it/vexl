import {useNavigation} from '@react-navigation/native'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Linking} from 'react-native'
import loadAndNormalizeContactsFromDeviceActionAtom from '../../../../../state/contacts/atom/loadAndNormalizeContactsFromDeviceActionAtom'
import {areContactsPermissionsGranted} from '../../../../../state/contacts/utils'
import wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom from '../../../../../state/lastRouteMmkvAtom'

export default function useAddContactsFromMarketplaceAction(): () => void {
  const navigation = useNavigation()
  const loadAndNormalizeContactsFromDevice = useSetAtom(
    loadAndNormalizeContactsFromDeviceActionAtom
  )
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

      void Effect.runPromise(
        loadAndNormalizeContactsFromDevice().pipe(
          Effect.catchAll(() => Effect.succeed(false))
        )
      ).finally(() => {
        navigation.navigate('ContactPreferences', {filter: 'new'})
      })
    })
  }, [
    loadAndNormalizeContactsFromDevice,
    navigation,
    setWasLastRouteBeforeRedirectOnContactsScreen,
  ])
}
