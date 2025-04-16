import {useAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import {preferencesAtom} from '../../../utils/preferences'
import Switch from '../../Switch'

const preferencesToEdit = [
  'disableOfferRerequestLimit',
  'allowSendingImages',
  'enableNewOffersNotificationDevMode',
  'showFriendLevelBanner',
  'offerFeedbackEnabled',
  'showTextDebugButton',
  'isDeveloper',
  'showOfferDetail',
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
