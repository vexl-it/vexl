import {CodeInput, Typography, YStack} from '@vexl-next/ui'
import {DateTime} from 'luxon'
import React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import InlineErrorText from '../InlineErrorText'
import {
  LoginFlowLink,
  LoginFlowTitle,
} from '../LoginFlow/components/LoginFlowScreen'
import Countdown from './Countdown'
import {
  VERIFICATION_CODE_LENGTH,
  type VerificationCodeEntry,
} from './useVerificationCodeEntry'

export function VerificationCodeForm({
  entry,
}: {
  readonly entry: VerificationCodeEntry
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <YStack flex={1} justifyContent="center" gap="$10">
      <YStack alignItems="center" gap="$4">
        <LoginFlowTitle>
          {t('loginFlow.v2.verificationCode.title')}
        </LoginFlowTitle>
        <Typography color="$foregroundSecondary" variant="paragraphSmall">
          {t('loginFlow.v2.verificationCode.text')}{' '}
          <Typography
            color="$foregroundSecondary"
            onPress={entry.confirmPhoneNumber}
            pressStyle={{opacity: 0.8}}
            textDecorationLine="underline"
            variant="paragraphSmall"
          >
            {entry.internationalPhoneNumber}
          </Typography>
          .
        </Typography>
      </YStack>
      <CodeInput
        editable={entry.inputEditable}
        inputRef={entry.inputRef}
        maxLength={VERIFICATION_CODE_LENGTH}
        oneTimeCode
        onChangeText={entry.onCodeChange}
        value={entry.code}
      />
      <InlineErrorText>{entry.errorMessage}</InlineErrorText>
    </YStack>
  )
}

export function VerificationCodeResend({
  entry,
}: {
  readonly entry: VerificationCodeEntry
}): React.ReactElement {
  const {t} = useTranslation()

  return entry.canResend ? (
    <LoginFlowLink
      disabled={entry.resendInProgress}
      label={t('loginFlow.v2.verificationCode.retry')}
      onPress={entry.resend}
    />
  ) : (
    <Typography
      color="$foregroundSecondary"
      textAlign="center"
      variant="paragraphSmall"
    >
      {t('loginFlow.v2.verificationCode.retryCountdown')}{' '}
      <Countdown
        color="$foregroundSecondary"
        countUntil={DateTime.fromISO(entry.verification.expirationAt)}
        key={entry.verification.verificationId}
        onFinished={entry.onResendCountdownFinished}
      />
      {t('common.secondsShort')}
    </Typography>
  )
}
