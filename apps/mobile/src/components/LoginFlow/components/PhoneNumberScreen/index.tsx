import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, Option} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
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

function PhoneNumberScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [phoneNumber, setPhoneNumber] = useState<
    Option.Option<E164PhoneNumber>
  >(Option.none())
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
        disabled={Option.isNone(phoneNumber)}
        text={t('common.continue')}
        onPress={() => {
          if (Option.isNone(phoneNumber)) return

          loadingOverlay.show()
          void Effect.runPromise(initPhoneVerification(phoneNumber.value))
            .then((result) => {
              if (Option.isSome(result))
                navigation.navigate('VerificationCode', {
                  phoneNumber: phoneNumber.value,
                  initPhoneVerificationResponse: result.value,
                })
            })
            .finally(loadingOverlay.hide)
        }}
      />
    </Stack>
  )
}

export default PhoneNumberScreen
