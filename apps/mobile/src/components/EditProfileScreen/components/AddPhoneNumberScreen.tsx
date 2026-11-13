import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type InitPhoneVerificationResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {
  Button,
  ChevronLeft,
  InfoBox,
  NavigationBar,
  Screen,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {type EditProfileStackScreenProps} from '../../../navigationTypes'
import {regionCodeAtom} from '../../../state/session/userDataAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {LoginFlowText} from '../../LoginFlow/components/LoginFlowScreen'
import PhoneNumberInput from '../../PhoneVerification/PhoneNumberInput'
import {selectedCountryCodeAtom} from '../../PhoneVerification/selectedCountryCodeAtom'
import {usePhoneNumberEntry} from '../../PhoneVerification/usePhoneNumberEntry'
import {sendCodeToPhoneNumberToAddActionAtom} from '../phoneNumbersUiActionAtoms'

function AddPhoneNumberScreen({
  navigation,
}: EditProfileStackScreenProps<'AddPhoneNumber'>): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const sendCode = useSetAtom(sendCodeToPhoneNumberToAddActionAtom)
  const regionCode = useAtomValue(regionCodeAtom)
  const setSelectedCountryCode = useSetAtom(selectedCountryCodeAtom)

  // Most people add a number from the same country as their main one
  useEffect(() => {
    setSelectedCountryCode(regionCode)
  }, [regionCode, setSelectedCountryCode])

  const {canSubmit, submit, inputProps} = usePhoneNumberEntry({
    sendCode,
    onCodeSent: useCallback(
      (
        phoneNumber: E164PhoneNumber,
        initPhoneVerificationResponse: InitPhoneVerificationResponse
      ) => {
        navigation.navigate('AddPhoneNumberVerificationCode', {
          phoneNumber,
          initPhoneVerificationResponse,
        })
      },
      [navigation]
    ),
    openCountryPicker: useCallback(() => {
      navigation.navigate('AddPhoneNumberCountryPicker')
    }, [navigation]),
  })

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.phoneNumbers.add')}
          leftAction={{icon: ChevronLeft, onPress: goBack}}
        />
      }
      footer={
        <YStack gap="$4">
          <LoginFlowText>{t('loginFlow.v2.phoneNumber.caption')}</LoginFlowText>
          <Button
            variant="primary"
            size="large"
            disabled={!canSubmit}
            onPress={submit}
          >
            {t('common.continue')}
          </Button>
        </YStack>
      }
    >
      <YStack gap="$10" paddingTop="$11">
        <PhoneNumberInput {...inputProps} />
        <YStack gap="$3">
          <InfoBox>
            {t('editProfileScreen.addPhoneNumber.linkedNumbers')}
          </InfoBox>
          <InfoBox>
            {t('editProfileScreen.addPhoneNumber.contactsImport')}
          </InfoBox>
        </YStack>
      </YStack>
    </Screen>
  )
}

export default AddPhoneNumberScreen
