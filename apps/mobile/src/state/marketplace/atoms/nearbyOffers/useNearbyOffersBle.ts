import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {
  addNearbyKeysDiscoveredListener,
  requestPermissions,
  setAdvertisedKeys,
  startScanning,
  stopScanning,
} from '../../../../../modules/vexl-nearby-ble'
import {
  nearbyOffersEnabledAtom,
  nearbyOffersReceivingEnabledAtom,
} from '../../../../utils/preferences'
import {handleDiscoveredNearbyKeysActionAtom} from './handleDiscoveredNearbyKeysActionAtom'
import {myAdvertisedNearbyKeysAtom} from './nearbyOffersState'

const NO_KEYS: readonly string[] = []

const logBleError = (e: unknown): void => {
  console.log('Nearby offers Bluetooth error', e)
}

export function useNearbyOffersBle(): void {
  const enabled = useAtomValue(nearbyOffersEnabledAtom)
  const receivingEnabled = useAtomValue(nearbyOffersReceivingEnabledAtom)
  const myAdvertisedKeys = useAtomValue(myAdvertisedNearbyKeysAtom)
  const handleDiscoveredKeys = useSetAtom(handleDiscoveredNearbyKeysActionAtom)

  const advertisedKeys = enabled ? myAdvertisedKeys : NO_KEYS
  const scanning = enabled && receivingEnabled

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const granted =
        (Array.isNonEmptyReadonlyArray(advertisedKeys) || scanning) &&
        (await requestPermissions())
      if (cancelled) return

      await Promise.all([
        setAdvertisedKeys(granted ? [...advertisedKeys] : []).catch(
          logBleError
        ),
        (granted && scanning ? startScanning() : stopScanning()).catch(
          logBleError
        ),
      ])
    })().catch(logBleError)

    return () => {
      cancelled = true
    }
  }, [advertisedKeys, scanning])

  useEffect(() => {
    if (!scanning) return
    const subscription = addNearbyKeysDiscoveredListener(({keys}) => {
      Effect.runFork(handleDiscoveredKeys(keys))
    })
    return () => {
      subscription.remove()
    }
  }, [scanning, handleDiscoveredKeys])

  useEffect(
    () => () => {
      void setAdvertisedKeys([]).catch(logBleError)
      void stopScanning().catch(logBleError)
    },
    []
  )
}
