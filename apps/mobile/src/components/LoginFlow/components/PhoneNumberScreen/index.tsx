import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {WhiteContainerWithScroll} from '../../../WhiteContainer'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import PhoneNumberInput from './components/PhoneNumberInput'
import * as O from 'fp-ts/Option'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import * as E from 'fp-ts/Either'
import {Alert} from 'react-native'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import {useInitPhoneVerification} from '../../api/initPhoneVerification'
import {useState} from 'react'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {Stack, Text} from 'tamagui'

type Props = LoginStackScreenProps<'PhoneNumber'>

function PhoneNumberScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [phoneNumber, setPhoneNumber] = useState<O.Option<E164PhoneNumber>>(
    O.none
  )
  const loadingOverlay = useShowLoadingOverlay()
  const initPhoneVerification = useInitPhoneVerification()

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={2} />
      <WhiteContainerWithScroll>
        <Text
          col="$black"
          numberOfLines={2}
          adjustsFontSizeToFit
          fos={24}
          ff="$heading"
        >
          {t('loginFlow.phoneNumber.title')}
        </Text>
        <Stack mt="$3">
          <Text fos={14} col="$greyOnWhite">
            {t('loginFlow.phoneNumber.text')}
          </Text>
        </Stack>
        <Stack my="$4">
          <PhoneNumberInput onChange={setPhoneNumber} />
        </Stack>
        <AnonymizationCaption />
      </WhiteContainerWithScroll>
      <NextButtonProxy
        disabled={phoneNumber._tag === 'None'}
        onPress={() => {
          if (phoneNumber._tag !== 'Some') return

          loadingOverlay.show()
          void initPhoneVerification({phoneNumber: phoneNumber.value})()
            .then(
              E.match(Alert.alert, (result) => {
                navigation.navigate('VerificationCode', {
                  phoneNumber: phoneNumber.value,
                  initPhoneVerificationResponse: result,
                })
              })
            )
            .finally(loadingOverlay.hide)
        }}
        text={t('common.continue')}
      />
    </>
  )
}

export default PhoneNumberScreen
