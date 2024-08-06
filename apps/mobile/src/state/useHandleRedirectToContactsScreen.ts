import {useNavigation, useRoute} from '@react-navigation/native'
import {useAtom} from 'jotai'
import {useCallback} from 'react'
import {useAppState} from '../utils/useAppState'
import wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom from './lastRouteMmkvAtom'

export function useHandleRedirectToContactsScreen(): void {
  const navigation = useNavigation()
  const activeRoute = useRoute()

  const [{value}, setWasLastRouteBeforeRedirectOnContactsScreen] = useAtom(
    wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom
  )

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active' && value && activeRoute.name === 'Marketplace') {
          console.info(
            '👉 Redirect to Contacts screen after contacts permissions change'
          )
          navigation.navigate('SetContacts', {filter: 'new'})
          setWasLastRouteBeforeRedirectOnContactsScreen({value: false})
        }
      },
      [
        activeRoute.name,
        navigation,
        setWasLastRouteBeforeRedirectOnContactsScreen,
        value,
      ]
    )
  )
}
