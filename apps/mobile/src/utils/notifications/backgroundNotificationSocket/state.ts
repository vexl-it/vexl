import {
  configure,
  getEnabledPreference,
  getState,
  isBatteryExempt,
  isGmsAvailable,
  type BackgroundNotificationSocketState,
} from '@vexl-next/expo-background-notification-socket'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {apiEnv} from '../../../api'
import {versionCode} from '../../environment'
import reportError from '../../reportError'

interface BackgroundNotificationState {
  // null until the user decided whether to use the background socket
  readonly enabled: boolean | null
  readonly batteryExempt: boolean
  readonly gmsAvailable: boolean
  readonly socketState: BackgroundNotificationSocketState
}

// null until read from native
export const backgroundNotificationSocketStateAtom =
  atom<BackgroundNotificationState | null>(null)

const readNativeState = async (): Promise<BackgroundNotificationState> => {
  const [enabled, batteryExempt, gmsAvailable, socketState] = await Promise.all(
    [getEnabledPreference(), isBatteryExempt(), isGmsAvailable(), getState()]
  )

  return {enabled, batteryExempt, gmsAvailable, socketState}
}

export const refreshBackgroundNotificationSocketStateActionAtom = atom(
  null,
  async (_get, set): Promise<void> => {
    if (Platform.OS !== 'android') return
    try {
      set(backgroundNotificationSocketStateAtom, await readNativeState())
    } catch (cause) {
      reportError(
        'warn',
        new Error('Failed to read background notification socket state', {
          cause,
        })
      )
    }
  }
)

export const configureForCurrentSecret = async (
  secret: string
): Promise<void> => {
  await configure({
    apiUrl: apiEnv.notificationMs,
    notificationSecret: secret,
    platform: 'ANDROID',
    version: versionCode,
  })
}

export const backgroundNotificationSocketEnabledReadOnlyAtom = atom(
  (get) => get(backgroundNotificationSocketStateAtom)?.enabled === true
)
