import {Image} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import bigNameSvg from '../../../images/bigNameSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SVGImage from '../../Image'
import Screen from '../../Screen'
import WhiteContainer from '../../WhiteContainer'

function MaintenanceScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <Screen>
      <YStack p="$2" f={1} gap="$2">
        <WhiteContainer>
          <Stack f={1} jc="center" ai="center">
            <Image
              resizeMode="contain"
              source={require('../../../images/logo.png')}
            />
            <SVGImage width={211} height={66} source={bigNameSvg} />
          </Stack>
          <Text
            adjustsFontSizeToFit
            numberOfLines={2}
            fos={24}
            ff="$heading"
            mt="$4"
          >
            {t('MaintenanceScreen.title')}
          </Text>
          <Text mt={16} fos={18} col="$greyOnWhite">
            {t('MaintenanceScreen.text')}
          </Text>
        </WhiteContainer>
      </YStack>
    </Screen>
  )
}

export default MaintenanceScreen
