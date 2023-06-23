import {useEffect, useState} from 'react'
import remoteConfig from '@react-native-firebase/remote-config'
import {DEFAULT_REMOTE_CONFIG} from './domain'

export default function useSetupRemoteConfig(): boolean {
  const [remoteConfigSetup, setRemoteConfigSetup] = useState(false)

  useEffect(() => {
    void (async () => {
      await remoteConfig().setDefaults({
        next__force_update: DEFAULT_REMOTE_CONFIG.next__force_update,
        next__maintenance: JSON.stringify({
          from: DEFAULT_REMOTE_CONFIG.next__maintenance.from,
          to: DEFAULT_REMOTE_CONFIG.next__maintenance.to,
        }),
        next__offer_rerequest_limit_days:
          DEFAULT_REMOTE_CONFIG.next__offer_rerequest_limit_days,
      })
      await remoteConfig().fetchAndActivate()

      setRemoteConfigSetup(true)
    })()
  }, [setRemoteConfigSetup])

  return remoteConfigSetup
}
