/**
 * Local Expo module that exchanges nearby offer keys over Bluetooth LE. See
 * docs/nearby_offers.md for the wire format.
 *
 * Every function is a no-op where the native module is unavailable (web,
 * tests, builds without the module), so importing never throws.
 */
import {requireOptionalNativeModule} from 'expo'

export interface NearbyKeysDiscoveredEvent {
  keys: string[]
}

export interface NearbyBleSubscription {
  remove: () => void
}

interface VexlNearbyBleNativeModule {
  setAdvertisedKeys: (keysBase64: string[]) => Promise<void>
  startScanning: () => Promise<void>
  stopScanning: () => Promise<void>
  requestPermissions: () => Promise<boolean>
  addListener: (
    eventName: 'onNearbyKeysDiscovered',
    listener: (event: NearbyKeysDiscoveredEvent) => void
  ) => NearbyBleSubscription
}

const nativeModule =
  requireOptionalNativeModule<VexlNearbyBleNativeModule>('VexlNearbyBle')

/** Advertises the given raw 32-byte keys (base64). `[]` stops advertising. */
export async function setAdvertisedKeys(keysBase64: string[]): Promise<void> {
  await nativeModule?.setAdvertisedKeys(keysBase64)
}

export async function startScanning(): Promise<void> {
  await nativeModule?.startScanning()
}

export async function stopScanning(): Promise<void> {
  await nativeModule?.stopScanning()
}

export async function requestPermissions(): Promise<boolean> {
  return (await nativeModule?.requestPermissions()) ?? false
}

export function addNearbyKeysDiscoveredListener(
  listener: (event: NearbyKeysDiscoveredEvent) => void
): NearbyBleSubscription {
  return (
    nativeModule?.addListener('onNearbyKeysDiscovered', listener) ?? {
      remove: () => {},
    }
  )
}
