import {preferencesAtom} from '../../../utils/preferences'
import {useAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import Switch from '../../Switch'
import {keys} from '@vexl-next/resources-utils/dist/utils/keys'

function Preferences(): JSX.Element {
  const [preferences, setPreferences] = useAtom(preferencesAtom)
  const booleanPreferencesKeys = keys(preferences).filter(
    (key) => typeof preferences[key] === 'boolean'
  )

  return (
    <YStack>
      <Text>Preferences</Text>
      {booleanPreferencesKeys.map((key) => (
        <XStack key={key}>
          <Text>{key}</Text>
          <Switch
            value={preferences[key]}
            onValueChange={(newValue) =>
              { setPreferences((old) => ({...old, [key]: newValue})); }
            }
          ></Switch>
        </XStack>
      ))}
    </YStack>
  )
}

export default Preferences
