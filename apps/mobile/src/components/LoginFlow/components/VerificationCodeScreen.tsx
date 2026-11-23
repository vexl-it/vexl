import {generateMasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {deriveIdentityPrivateKey} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {type PhoneNumberVerificationId} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  backupFileToRestoreAtom,
  backupKeyPairAtom,
  isBackupForKeyPair,
} from '../../../state/backup/backupToRestore'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useVerificationCodeEntry} from '../../PhoneVerification/useVerificationCodeEntry'
import {
  VerificationCodeForm,
  VerificationCodeResend,
} from '../../PhoneVerification/VerificationCodeForm'
import {getBackupKeyPairAtom} from '../api/getBackupKeyPairAtom'
import {initPhoneVerificationAtom} from '../api/initPhoneVerificationAtom'
import {verifyPhoneNumberAtom} from '../api/verifyPhoneNumberAtom'
import {finishLoginActionAtom} from '../atoms/finishLoginActionAtom'
import LoginFlowScreen from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'VerificationCode'>

interface SubmittedCode {
  readonly code: string
  readonly verificationId: PhoneNumberVerificationId
}

export default function VerificationCodeScreen({
  navigation,
  route: {
    params: {phoneNumber, initPhoneVerificationResponse, restore},
  },
}: Props): React.ReactElement {
  const initPhoneVerification = useSetAtom(initPhoneVerificationAtom)
  const verifyPhoneNumber = useSetAtom(verifyPhoneNumberAtom)
  const finishLogin = useSetAtom(finishLoginActionAtom)
  const getBackupKeyPair = useSetAtom(getBackupKeyPairAtom)
  const backupFileToRestore = useAtomValue(backupFileToRestoreAtom)
  const setBackupKeyPair = useSetAtom(backupKeyPairAtom)
  const {t} = useTranslation()

  const login = useCallback(
    ({code, verificationId}: SubmittedCode): Effect.Effect<void, string> =>
      Effect.gen(function* (_) {
        const masterSeed = generateMasterSeed()
        const privateKey = yield* _(
          deriveIdentityPrivateKey(masterSeed),
          Effect.mapError(() => t('common.cryptoError'))
        )
        const verifyPhoneNumberResponse = yield* _(
          verifyPhoneNumber({
            code,
            id: verificationId,
            userPublicKey: privateKey.publicKeyPemBase64,
          })
        )

        yield* _(Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate))

        yield* _(
          finishLogin({
            verifyPhoneNumberResponse,
            privateKey,
            masterSeed,
            phoneNumber,
          })
        )
      }),
    [finishLogin, phoneNumber, t, verifyPhoneNumber]
  )

  const continueRestore = useCallback(
    ({code, verificationId}: SubmittedCode): Effect.Effect<void, string> =>
      Effect.gen(function* (_) {
        const keyPair = yield* _(getBackupKeyPair({code, id: verificationId}))
        setBackupKeyPair(Option.some(keyPair))

        yield* _(Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate))

        navigation.replace(
          Option.exists(backupFileToRestore, (file) =>
            isBackupForKeyPair(file, keyPair)
          )
            ? 'RestorePin'
            : 'RestoreWrongPhoneNumber'
        )
      }),
    [backupFileToRestore, getBackupKeyPair, navigation, setBackupKeyPair]
  )

  const entry = useVerificationCodeEntry({
    phoneNumber,
    initPhoneVerificationResponse,
    resendCode: initPhoneVerification,
    submitCode: restore ? continueRestore : login,
  })

  return (
    <LoginFlowScreen
      action={{
        disabled: !entry.canSubmit,
        label: t('common.continue'),
        onPress: entry.submit,
      }}
      footer={<VerificationCodeResend entry={entry} />}
      scroll
    >
      <VerificationCodeForm entry={entry} />
    </LoginFlowScreen>
  )
}
