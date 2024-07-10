import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import {useState} from 'react'
import {Alert} from 'react-native'
import {Stack, Text} from 'tamagui'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {WhiteContainerWithScroll} from '../../../WhiteContainer'
import {useInitPhoneVerification} from '../../api/initPhoneVerification'
import PhoneNumberInput from './components/PhoneNumberInput'

type Props = LoginStackScreenProps<'PhoneNumber'>

function PhoneNumberScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [phoneNumber, setPhoneNumber] = useState<O.Option<E164PhoneNumber>>(
    O.none
  )
  const loadingOverlay = useShowLoadingOverlay()
  const initPhoneVerification = useInitPhoneVerification()

  return (
    <Stack f={1} testID="phone-number-screen">
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
        <Stack mt="$3" testID="phone-number-screen-subtitle">
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
    </Stack>
  )
}

export default PhoneNumberScreen
