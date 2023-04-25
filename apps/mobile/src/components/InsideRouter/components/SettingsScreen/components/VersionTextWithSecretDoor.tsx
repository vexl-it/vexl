import {Pressable, type StyleProp, type ViewStyle} from 'react-native'
import {Text} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useRef} from 'react'
import {
  type UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {useNavigation} from '@react-navigation/native'

const TOUCH_DELAY_MS = 500

function VersionTextWithSecretDoor({
  style,
}: {
  style?: StyleProp<ViewStyle>
}): JSX.Element {
  const {t} = useTranslation()
  const pressState = useRef<{
    lastPress: UnixMilliseconds
    counter: number
  }>({lastPress: unixMillisecondsNow(), counter: 0})
  const navigation = useNavigation()

  return (
    <Pressable
      style={style}
      onPress={() => {
        const pressStateCurrent = pressState.current
        const now = unixMillisecondsNow()

        if (now - pressStateCurrent.lastPress > TOUCH_DELAY_MS) {
          pressStateCurrent.lastPress = now
          pressStateCurrent.counter = 0
        } else {
          pressStateCurrent.lastPress = now
          pressStateCurrent.counter += 1
        }

        if (pressStateCurrent.counter > 5) {
          pressStateCurrent.counter = 0
          navigation.navigate('DebugScreen')
        }
      }}
    >
      <Text ta={'center'} fos={14} col={'$greyOnBlack'}>
        {t('settings.version', {version: 'local'})}
      </Text>
    </Pressable>
  )
}

export default VersionTextWithSecretDoor
