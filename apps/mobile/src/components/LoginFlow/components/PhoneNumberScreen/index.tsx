import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect} from 'effect'
import * as O from 'fp-ts/Option'
import {useSetAtom} from 'jotai'
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
import {initPhoneVerificationAtom} from '../../api/initPhoneVerificationAtom'
import PhoneNumberInput from './components/PhoneNumberInput'

type Props = LoginStackScreenProps<'PhoneNumber'>

function PhoneNumberScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [phoneNumber, setPhoneNumber] = useState<O.Option<E164PhoneNumber>>(
    O.none
  )
  const loadingOverlay = useShowLoadingOverlay()
  const initPhoneVerification = useSetAtom(initPhoneVerificationAtom)

  return (
    <Stack flex={1} testID="@phoneNumberScreen">
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
        <Stack testID="@phoneNumberScreen/subtitle" mt="$3">
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
        text={t('common.continue')}
        onPress={() => {
          if (phoneNumber._tag !== 'Some') return

          loadingOverlay.show()
          initPhoneVerification({body: {phoneNumber: phoneNumber.value}}).pipe(
            Effect.match({
              onFailure: Alert.alert,
              onSuccess(value) {
                navigation.navigate('VerificationCode', {
                  phoneNumber: phoneNumber.value,
                  initPhoneVerificationResponse: value,
                })
              },
            }),
            Effect.tap(loadingOverlay.hide)
          )
        }}
      />
    </Stack>
  )
}

export default PhoneNumberScreen
