import {
  requestBatteryExemption,
  setEnabled,
} from '@vexl-next/expo-background-notification-socket'
import {Effect} from 'effect/index'
import {atom, type SetStateAction} from 'jotai'
import {Platform} from 'react-native'
import {syncVexlNotificationTokensActionAtom} from '../../../state/notifications/actions/syncVexlNotificationTokensActionAtom'
import {vexlNotificationTokenAtom} from '../../../state/notifications/vexlNotificationTokenAtom'
import getValueFromSetStateActionOfAtom from '../../atomUtils/getValueFromSetStateActionOfAtom'
import reportError from '../../reportError'
import {requestPermissions} from '../checkAndAskForPermissionsActionAtom'
import {
  backgroundNotificationSocketStateAtom,
  configureForCurrentSecret,
  refreshBackgroundNotificationSocketStateActionAtom,
} from './state'

export const setBackgroundNotificationSocketEnabledActionAtom = atom(
  null,
  async (get, set, enabled: boolean): Promise<void> => {
    if (Platform.OS !== 'android') return
    try {
      const secret = get(vexlNotificationTokenAtom).secret
      if (enabled && secret) {
        await configureForCurrentSecret(secret)
      }
      await setEnabled(enabled)
      if (enabled) {
        await Effect.runPromise(requestPermissions.pipe(Effect.ignore))
        await requestBatteryExemption()
      }
    } catch (cause) {
      reportError(
        'warn',
        new Error('Failed to update background notification socket', {cause})
      )
    }
    await set(refreshBackgroundNotificationSocketStateActionAtom)
    await Effect.runPromise(
      set(syncVexlNotificationTokensActionAtom, {
        expoNotificationToken: 'getFromExpo',
      })
    )
  }
)

export const backgroundNotificationSocketEnabledAtom = atom(
  (get) => get(backgroundNotificationSocketStateAtom)?.enabled === true,
  (get, set, update: SetStateAction<boolean>): void => {
    const enabled = getValueFromSetStateActionOfAtom(update)(
      () => get(backgroundNotificationSocketStateAtom)?.enabled === true
    )
    void set(setBackgroundNotificationSocketEnabledActionAtom, enabled)
  }
)
