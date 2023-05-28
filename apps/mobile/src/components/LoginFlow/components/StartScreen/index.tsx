import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Switch from '../../../Switch'
import WhiteContainer from '../../../WhiteContainer'
import bigNameSvg from '../../../../images/bigNameSvg'
import notepadSvg from './images/notepadSvg'
import {useState} from 'react'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import Button from '../../../Button'
import SVGImage from '../../../Image'
import {Image} from 'react-native'
import {Stack, Text} from 'tamagui'

type Props = LoginStackScreenProps<'Start'>

function StartScreen({navigation}: Props): JSX.Element {
  const [touAgree, setTOUAgree] = useState(false)

  const {t} = useTranslation()

  return (
    <Stack f={1} bg="$darkColorText">
      <HeaderProxy showBackButton={true} progressNumber={undefined} />
      <WhiteContainer>
        <Stack f={1} ai="center">
          <Stack f={1}>
            <Image
              style={{flex: 1}}
              resizeMode={'contain'}
              source={require('../../../../images/logo.png')}
            />
          </Stack>
          <Stack mb="$5">
            <SVGImage width={211} height={66} source={bigNameSvg} />
          </Stack>
          <Text fos={18} ff="$body500" col="$greyOnBlack">
            {t('loginFlow.start.subtitle')}
          </Text>
        </Stack>
      </WhiteContainer>
      <Stack
        fd="row"
        ai="center"
        jc="space-between"
        py="$4"
        px="$5"
        br="$5"
        my="$3"
        bg="$backgroundBlack"
      >
        <Stack fd="row" ai="center">
          <SVGImage source={notepadSvg} />
          <Stack w="$2" />
          <Text fos={18} ff="$body500" col="$greyOnBlack">
            {t('loginFlow.start.touLabel')}{' '}
          </Text>
          <Button
            fontSize={18}
            variant="link"
            onPress={() => {
              navigation.navigate('TermsAndConditions')
            }}
            text={t('loginFlow.start.termsOfUse')}
          />
        </Stack>
        <Switch value={touAgree} onValueChange={setTOUAgree} />
      </Stack>
      <NextButtonProxy
        disabled={!touAgree}
        onPress={() => {
          navigation.navigate('AnonymizationNotice')
        }}
        text={t('common.continue')}
      />
    </Stack>
  )
}

export default StartScreen
