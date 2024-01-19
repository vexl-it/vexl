import {Stack, Text, YStack} from 'tamagui'
import Screen from '../../Screen'
import WhiteContainer from '../../WhiteContainer'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import {Image, Platform} from 'react-native'
import SVGImage from '../../Image'
import bigNameSvg from '../../../images/bigNameSvg'
import openUrl from '../../../utils/openUrl'

const IOS_URL = 'itms-apps://apps.apple.com/tr/app/vexl-next/id6448051657?l=tr'
const ANDROID_URL = 'http://play.google.com/store/apps/details?id=it.vexl.next'

function ForceUpdateScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <Screen>
      <YStack p="$2" f={1} space="$2">
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
            {t('ForceUpdateScreen.title')}
          </Text>
          <Text mt={16} fos={18} col="$greyOnWhite">
            {t('ForceUpdateScreen.text')}
          </Text>
        </WhiteContainer>
        <Button
          onPress={() => {
            openUrl(Platform.OS === 'android' ? ANDROID_URL : IOS_URL)()
          }}
          variant="primary"
          text={t('ForceUpdateScreen.action')}
        ></Button>
      </YStack>
    </Screen>
  )
}

export default ForceUpdateScreen
