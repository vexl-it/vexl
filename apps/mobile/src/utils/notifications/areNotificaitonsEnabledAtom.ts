import notifee, {AuthorizationStatus} from '@notifee/react-native'
import {atom} from 'jotai'

export const areNotificationsEnabledAtom = atom<boolean>(false)

areNotificationsEnabledAtom.onMount = (set) => {
  void notifee.getNotificationSettings().then((settings) => {
    set(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED)
  })
}

export const checkAndSetAreNotificationsEnabledActionAtom = atom(
  null,
  (get, set) => {
    void notifee.getNotificationSettings().then((settings) => {
      set(
        areNotificationsEnabledAtom,
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
      )
    })
  }
)
