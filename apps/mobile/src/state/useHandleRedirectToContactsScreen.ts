import {useNavigation, useRoute} from '@react-navigation/native'
import {useAtom} from 'jotai'
import {useEffect} from 'react'
import wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom from './lastRouteMmkvAtom'

export function useHandleRedirectToContactsScreen(): void {
  const navigation = useNavigation()
  const activeRoute = useRoute()

  const [{value}, setWasLastRouteBeforeRedirectOnContactsScreen] = useAtom(
    wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom
  )

  useEffect(() => {
    if (value && activeRoute.name === 'Marketplace') {
      console.info(
        '👉 Redirect to Contacts screen after contacts permissions change'
      )
      navigation.navigate('SetContacts', {})
    }
  }, [
    activeRoute.name,
    navigation,
    setWasLastRouteBeforeRedirectOnContactsScreen,
    value,
  ])
}
