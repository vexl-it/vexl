import {requireNativeModule, type EventSubscription} from 'expo-modules-core'

export type VexlLocalTransportEventName =
  | 'onConnectionAccepted'
  | 'onData'
  | 'onConnectionClosed'
  | 'onListenerFailed'

/**
 * Raw native module surface. Everything coming back from the bridge is typed
 * `unknown` on purpose — the wrapper decodes every value with
 * `Schema.decodeUnknown` before it reaches application code.
 */
export interface VexlLocalTransportNativeModule {
  startListener: () => Promise<unknown>
  getLocalEndpointCandidates: () => Promise<unknown>
  stopListener: () => Promise<unknown>
  connect: (host: string, port: number, timeoutMs: number) => Promise<unknown>
  send: (connectionId: string, dataBase64: string) => Promise<unknown>
  closeConnection: (connectionId: string) => Promise<unknown>
  addListener: (
    eventName: VexlLocalTransportEventName,
    listener: (payload: unknown) => void
  ) => EventSubscription
}

let cachedNativeModule: VexlLocalTransportNativeModule | undefined

/**
 * Lazily resolves the native module so importing the wrapper stays side
 * effect free (and trivially mockable in tests).
 */
export function getVexlLocalTransportNativeModule(): VexlLocalTransportNativeModule {
  if (cachedNativeModule === undefined) {
    cachedNativeModule =
      requireNativeModule<VexlLocalTransportNativeModule>('VexlLocalTransport')
  }
  return cachedNativeModule
}
