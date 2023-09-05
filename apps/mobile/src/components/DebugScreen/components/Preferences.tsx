import {preferencesAtom} from '../../../utils/preferences'
import {useAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import Switch from '../../Switch'

const preferencesToEdit = [
  'showDebugNotifications',
  'disableOfferRerequestLimit',
  'allowSendingImages',
  'enableNewOffersNotificationDevMode',
] as const

function Preferences(): JSX.Element {
  const [preferences, setPreferences] = useAtom(preferencesAtom)

  return (
    <YStack>
      <Text>Preferences</Text>
      {preferencesToEdit.map((key) => (
        <XStack key={key}>
          <Text>{key}</Text>
          <Switch
            value={preferences[key]}
            onValueChange={(newValue) => {
              setPreferences((old) => ({...old, [key]: newValue}))
            }}
          ></Switch>
        </XStack>
      ))}
    </YStack>
  )
}

export default Preferences
