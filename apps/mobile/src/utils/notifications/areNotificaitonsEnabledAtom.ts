import {getPermissionsAsync} from 'expo-notifications'
import {atom} from 'jotai'

export const areNotificationsEnabledAtom = atom<boolean>(false)

areNotificationsEnabledAtom.onMount = (set) => {
  void getPermissionsAsync().then((settings) => {
    set(settings.granted)
  })
}

export const checkAndSetAreNotificationsEnabledActionAtom = atom(
  null,
  (get, set) => {
    void getPermissionsAsync().then((settings) => {
      set(areNotificationsEnabledAtom, settings.granted)
    })
  }
)
