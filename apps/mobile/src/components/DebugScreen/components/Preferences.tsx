import {preferencesAtom} from '../../../utils/preferences'
import {useAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import Switch from '../../Switch'

const preferencesToEdit = [
  'showDebugNotifications',
  'disableOfferRerequestLimit',
  'allowSendingImages',
  'enableNewOffersNotificationDevMode',
  'showFriendLevelBanner',
  'tradeChecklistEnabled',
  'offerFeedbackEnabled',
] as const

function Preferences(): JSX.Element {
  const [preferences, setPreferences] = useAtom(preferencesAtom)

  return (
    <YStack>
      <Text color="$black">Preferences</Text>
      {preferencesToEdit.map((key) => (
        <XStack key={key}>
          <Text color="$black">{key}</Text>
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
