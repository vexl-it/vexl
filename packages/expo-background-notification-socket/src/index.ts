import {Schema} from 'effect'
import {requireNativeModule} from 'expo-modules-core'

export const BackgroundNotificationSocketState = Schema.Literal(
  'disabled',
  'waiting_for_configuration',
  'connecting',
  'connected',
  'reconnecting'
)
export type BackgroundNotificationSocketState =
  typeof BackgroundNotificationSocketState.Type

export interface BackgroundNotificationSocketConfiguration {
  readonly apiUrl: string
  readonly notificationSecret: string
  readonly platform: 'ANDROID'
  readonly version: number
}

interface BackgroundNotificationSocketNativeModule {
  readonly configure: (
    apiUrl: string,
    notificationSecret: string,
    platform: string,
    version: number
  ) => Promise<void>
  readonly clearCredentials: () => Promise<void>
  readonly setEnabled: (enabled: boolean) => Promise<void>
  readonly getEnabledPreference: () => Promise<boolean | null>
  readonly requestBatteryExemption: () => Promise<void>
  readonly isBatteryExempt: () => Promise<boolean>
  readonly isGmsAvailable: () => Promise<boolean>
  readonly getState: () => Promise<string>
  readonly setForegroundStreamConnected: (connected: boolean) => Promise<void>
}

const nativeModule =
  requireNativeModule<BackgroundNotificationSocketNativeModule>(
    'ExpoBackgroundNotificationSocket'
  )

export const configure = async (
  configuration: BackgroundNotificationSocketConfiguration
): Promise<void> => {
  await nativeModule.configure(
    configuration.apiUrl,
    configuration.notificationSecret,
    configuration.platform,
    configuration.version
  )
}

/** Logout: wipe the stored credentials and stop the socket service. */
export const clearCredentials = async (): Promise<void> => {
  await nativeModule.clearCredentials()
}

export const setEnabled = async (enabled: boolean): Promise<void> => {
  await nativeModule.setEnabled(enabled)
}

/** `null` until the user decided whether to use the background socket. */
export const getEnabledPreference = async (): Promise<boolean | null> =>
  await nativeModule.getEnabledPreference()

export const requestBatteryExemption = async (): Promise<void> => {
  await nativeModule.requestBatteryExemption()
}

export const isBatteryExempt = async (): Promise<boolean> =>
  await nativeModule.isBatteryExempt()

export const isGmsAvailable = async (): Promise<boolean> =>
  await nativeModule.isGmsAvailable()

/**
 * Tell the native service whether the JS foreground socket is currently
 * consuming the notification stream, so it knows when messages can be
 * dropped as already-delivered.
 */
export const setForegroundStreamConnected = async (
  connected: boolean
): Promise<void> => {
  await nativeModule.setForegroundStreamConnected(connected)
}

export const getState = async (): Promise<BackgroundNotificationSocketState> =>
  await Schema.decodeUnknownPromise(BackgroundNotificationSocketState)(
    await nativeModule.getState()
  )

export const BACKGROUND_NOTIFICATION_HEADLESS_TASK =
  'VexlBackgroundNotification'
