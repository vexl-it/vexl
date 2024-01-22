import remoteConfig from '@react-native-firebase/remote-config'
import {useAtomValue} from 'jotai'
import {Alert} from 'react-native'
import {Stack, Text} from 'tamagui'
import {remoteConfigAtom} from '../../../utils/remoteConfig/atoms'
import Button from '../../Button'

function RemoteConfigView(): JSX.Element {
  const remoteConfigValue = useAtomValue(remoteConfigAtom)
  return (
    <Stack>
      <Text color="$black">
        Remote config: {JSON.stringify(remoteConfigValue, null, 2)}
      </Text>
      <Button
        variant="secondary"
        size="small"
        text="Reset config"
        onPress={() => {
          void remoteConfig()
            .fetchAndActivate()
            .then(() => {
              Alert.alert('done')
            })
        }}
      />
    </Stack>
  )
}

export default RemoteConfigView
