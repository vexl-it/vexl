import {type PhoneNumberVerificationId} from '@vexl-next/rest-api/src/services/user/contracts'
import {Button, ChevronLeft, NavigationBar, Screen, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type EditProfileStackScreenProps} from '../../../navigationTypes'
import {type VerifiedPhoneNumber} from '../../../state/phoneNumbers/addPhoneNumberActionAtoms'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {useVerificationCodeEntry} from '../../PhoneVerification/useVerificationCodeEntry'
import {
  VerificationCodeForm,
  VerificationCodeResend,
} from '../../PhoneVerification/VerificationCodeForm'
import {
  addVerifiedPhoneNumberWithUiFeedbackActionAtom,
  sendCodeToPhoneNumberToAddActionAtom,
  verifyPhoneNumberToAddWithMessagesActionAtom,
} from '../phoneNumbersUiActionAtoms'

function AddPhoneNumberVerificationCodeScreen({
  navigation,
  route: {
    params: {phoneNumber, initPhoneVerificationResponse},
  },
}: EditProfileStackScreenProps<'AddPhoneNumberVerificationCode'>): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const sendCode = useSetAtom(sendCodeToPhoneNumberToAddActionAtom)
  const verifyPhoneNumber = useSetAtom(
    verifyPhoneNumberToAddWithMessagesActionAtom
  )
  const addVerifiedPhoneNumber = useSetAtom(
    addVerifiedPhoneNumberWithUiFeedbackActionAtom
  )

  const entry = useVerificationCodeEntry({
    phoneNumber,
    initPhoneVerificationResponse,
    resendCode: sendCode,
    submitCode: useCallback(
      ({
        code,
        verificationId,
      }: {
        readonly code: string
        readonly verificationId: PhoneNumberVerificationId
      }) =>
        verifyPhoneNumber({phoneNumber, verificationId, code}).pipe(
          Effect.tap(() =>
            Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate)
          )
        ),
      [phoneNumber, verifyPhoneNumber]
    ),
    onCodeAccepted: useCallback(
      (verified: VerifiedPhoneNumber) => {
        void Effect.runPromise(addVerifiedPhoneNumber(verified)).then(() => {
          navigation.popTo('EditProfilePhoneNumbers')
        })
      },
      [addVerifiedPhoneNumber, navigation]
    ),
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
          <VerificationCodeResend entry={entry} />
          <Button
            variant="primary"
            size="large"
            disabled={!entry.canSubmit}
            onPress={entry.submit}
          >
            {t('common.continue')}
          </Button>
        </YStack>
      }
    >
      <VerificationCodeForm entry={entry} />
    </Screen>
  )
}

export default AddPhoneNumberVerificationCodeScreen
