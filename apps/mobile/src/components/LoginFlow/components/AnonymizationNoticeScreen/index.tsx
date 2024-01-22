import {Stack, Text} from 'tamagui'
import anonymizationNoticeSvg from '../../../../images/anonymizationNoticeSvg'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Image from '../../../Image'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../WhiteContainer'

type Props = LoginStackScreenProps<'AnonymizationNotice'>

function AnonymizationNoticeScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={1} />
      <WhiteContainer>
        <Stack f={1} ai="center" jc="center" mb="$6">
          <Image source={anonymizationNoticeSvg} />
        </Stack>
        <Text
          col="$black"
          ff="$heading"
          mb="$4"
          fos={24}
          adjustsFontSizeToFit
          numberOfLines={2}
        >
          {t('loginFlow.anonymizationNotice.title')}
        </Text>
        <Text col="$greyOnWhite" ff="$body500" fos={16}>
          {t('loginFlow.anonymizationNotice.text')}
        </Text>
      </WhiteContainer>
      <NextButtonProxy
        onPress={() => {
          navigation.navigate('Name')
        }}
        disabled={false}
        text={t('common.continue')}
      />
    </>
  )
}

export default AnonymizationNoticeScreen
