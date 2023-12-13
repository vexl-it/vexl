import {useNavigation} from '@react-navigation/native'
import {type StyleProp, type ViewStyle} from 'react-native'
import {Text} from 'tamagui'
import {version} from '../../../../../utils/environment'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import SecretDoor from '../../../../SecretDoor'

function VersionTextWithSecretDoor({
  style,
}: {
  style?: StyleProp<ViewStyle>
}): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <SecretDoor
      onSecretDoorOpen={() => {
        navigation.navigate('DebugScreen')
      }}
    >
      <Text ta={'center'} fos={14} col={'$greyOnBlack'}>
        {t('settings.version', {version})}
      </Text>
      <Text ta={'center'} fos={12} col={'$greyAccent2'}>
        {t('settings.btcPriceSourceCredit')}
      </Text>
    </SecretDoor>
  )
}

export default VersionTextWithSecretDoor
