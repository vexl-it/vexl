import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type InitPhoneVerificationResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {YStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import PhoneNumberInput from '../../PhoneVerification/PhoneNumberInput'
import {usePhoneNumberEntry} from '../../PhoneVerification/usePhoneNumberEntry'
import {initPhoneVerificationAtom} from '../api/initPhoneVerificationAtom'
import LoginFlowScreen, {LoginFlowText, LoginFlowTitle} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'PhoneNumber'>

export default function PhoneNumberScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const restore = route.params?.restore === true
  const initPhoneVerification = useSetAtom(initPhoneVerificationAtom)

  const {canSubmit, submit, inputProps} = usePhoneNumberEntry({
    sendCode: initPhoneVerification,
    onCodeSent: useCallback(
      (
        phoneNumber: E164PhoneNumber,
        initPhoneVerificationResponse: InitPhoneVerificationResponse
      ) => {
        navigation.navigate('VerificationCode', {
          phoneNumber,
          initPhoneVerificationResponse,
          restore,
        })
      },
      [navigation, restore]
    ),
    openCountryPicker: useCallback(() => {
      navigation.navigate('CountryPicker')
    }, [navigation]),
  })

  return (
    <LoginFlowScreen
      footer={
        <LoginFlowText>{t('loginFlow.v2.phoneNumber.caption')}</LoginFlowText>
      }
      action={{
        disabled: !canSubmit,
        label: t('common.continue'),
        onPress: submit,
      }}
      scroll
    >
      <YStack flex={1} gap="$10" justifyContent="flex-start" paddingTop="$11">
        <YStack gap="$4" width="100%">
          <LoginFlowTitle>
            {restore
              ? t('loginFlow.restoreFromBackup.phoneNumber.title')
              : t('loginFlow.v2.phoneNumber.title')}
          </LoginFlowTitle>
          <LoginFlowText>
            {restore
              ? t('loginFlow.restoreFromBackup.phoneNumber.text')
              : t('loginFlow.v2.phoneNumber.text')}
          </LoginFlowText>
        </YStack>
        <PhoneNumberInput {...inputProps} />
      </YStack>
    </LoginFlowScreen>
  )
}
