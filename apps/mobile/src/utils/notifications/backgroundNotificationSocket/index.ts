import {
  clearCredentials,
  configure,
  getEnabledPreference,
  getState,
  isBatteryExempt,
  isGmsAvailable,
  requestBatteryExemption,
  type BackgroundNotificationSocketState,
} from '@vexl-next/expo-background-notification-socket'
import {Array, Effect, pipe} from 'effect'
import {atom, useAtomValue, useSetAtom, type SetStateAction} from 'jotai'
import {useCallback, useEffect} from 'react'
import {Platform} from 'react-native'
import {apiEnv} from '../../../api'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {vexlNotificationTokenAtom} from '../../../state/notifications/vexlNotificationTokenAtom'
import {postLoginFlowCompletedScreensAtom} from '../../../state/postLoginOnboarding'
import getValueFromSetStateActionOfAtom from '../../atomUtils/getValueFromSetStateActionOfAtom'
import {versionCode} from '../../environment'
import {translationAtom} from '../../localization/I18nProvider'
import reportError from '../../reportError'
import {useAppState} from '../../useAppState'
import {setBackgroundNotificationSocketEnabledActionAtom} from './setBackgroundNotificationSocketEnabledActionAtom'

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

export const clearBackgroundNotificationSocketActionAtom = atom(
  null,
  async (_get, set): Promise<void> => {
    if (Platform.OS !== 'android') return
    try {
      await clearCredentials()
    } catch (cause) {
      reportError(
        'warn',
        new Error('Failed to clear background notification socket', {cause})
      )
    }
    set(backgroundNotificationSocketStateAtom, null)
  }
)

/**
 * On devices without Google services, explain the background socket once and
 * enable it when the user agrees. No-op once the user decided.
 */
export const offerBackgroundNotificationSocketActionAtom = atom(
  null,
  async (get, set): Promise<void> => {
    if (Platform.OS !== 'android') return
    await set(refreshBackgroundNotificationSocketStateActionAtom)
    const state = get(backgroundNotificationSocketStateAtom)
    if (!state || state.enabled !== null || state.gmsAvailable) return

    const {t} = get(translationAtom)
    const confirmed = await Effect.runPromise(
      set(globalDialogAtom, {
        title: t('notifications.backgroundSocket.explanationTitle'),
        subtitle: t('notifications.backgroundSocket.explanationBody'),
        positiveButtonText: t('common.continue'),
        negativeButtonText: t('common.notNow'),
      })
    )
    await set(setBackgroundNotificationSocketEnabledActionAtom, confirmed)
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

export const requestBackgroundNotificationBatteryExemptionActionAtom = atom(
  null,
  async (_get, set): Promise<void> => {
    try {
      await requestBatteryExemption()
    } catch (cause) {
      reportError(
        'warn',
        new Error('Failed to open battery optimisation settings', {cause})
      )
    }
    await set(refreshBackgroundNotificationSocketStateActionAtom)
  }
)

export function useBackgroundNotificationSocket(): void {
  const refresh = useSetAtom(refreshBackgroundNotificationSocketStateActionAtom)
  const offer = useSetAtom(offerBackgroundNotificationSocketActionAtom)
  const {secret} = useAtomValue(vexlNotificationTokenAtom)
  const completedPostLoginScreens = useAtomValue(
    postLoginFlowCompletedScreensAtom
  )
  const notificationSetupCompleted = pipe(
    completedPostLoginScreens,
    Array.some((screen) => screen === 'notificationSetup')
  )

  useAppState(
    useCallback(() => {
      if (Platform.OS === 'android') void refresh()
    }, [refresh])
  )

  // Users who finished onboarding before this feature existed get the same
  // one-time offer as the notification setup screen gives new users.
  useEffect(() => {
    if (notificationSetupCompleted) void offer()
  }, [notificationSetupCompleted, offer])

  // Refresh the natively stored config (secret or app version changed). The
  // enabled preference is read from native, not from the state atom, so a
  // failed state read cannot block the socket from being (re)configured.
  useEffect(() => {
    if (Platform.OS !== 'android' || !secret) return

    getEnabledPreference()
      .then(async (enabled) => {
        if (enabled !== true) return
        await configureForCurrentSecret(secret)
        await refresh()
      })
      .catch((cause) => {
        reportError(
          'warn',
          new Error('Failed to configure background notification socket', {
            cause,
          })
        )
      })
  }, [refresh, secret])
}
