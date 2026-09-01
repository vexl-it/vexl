import Clipboard from '@react-native-clipboard/clipboard'
import {Copy, NavButton, Stack, Typography, XStack} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {vexlNotificationTokenAtom} from '../../../state/notifications/vexlNotificationTokenAtom'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../../ToastNotification/atom'

function DebugValue({
  label,
  value,
}: {
  readonly label: string
  readonly value: string | null | undefined
}): React.ReactElement {
  const {t} = useTranslation()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Stack gap="$1">
      <Typography color="$foregroundSecondary" variant="micro">
        {label}
      </Typography>
      <XStack alignItems="center" gap="$3">
        <Typography
          color="$foregroundPrimary"
          flex={1}
          numberOfLines={1}
          variant="paragraphSmall"
        >
          {value ?? t('AppLogs.debugInfo.unavailable')}
        </Typography>
        <NavButton
          aria-label={`${t('common.copy')} ${label}`}
          disabled={!value}
          icon={Copy}
          onPress={() => {
            if (!value) return
            Clipboard.setString(value)
            setToastNotification(t('common.copied'))
          }}
          variant="normal"
        />
      </XStack>
    </Stack>
  )
}

function DebugInfo(): React.ReactElement {
  const {t} = useTranslation()
  const session = useSessionAssumeLoggedIn()
  const {systemVexlToken} = useAtomValue(vexlNotificationTokenAtom)

  return (
    <Stack
      backgroundColor="$backgroundTertiary"
      borderRadius="$5"
      gap="$4"
      padding="$5"
    >
      <Typography color="$foregroundPrimary" variant="paragraphDemibold">
        {t('AppLogs.debugInfo.title')}
      </Typography>
      <DebugValue
        label={t('AppLogs.debugInfo.systemNotificationToken')}
        value={systemVexlToken}
      />
      <DebugValue
        label={t('AppLogs.debugInfo.rootPublicKey')}
        value={session.keyPairV2.publicKey}
      />
      <DebugValue
        label={t('AppLogs.debugInfo.phoneNumberHash')}
        value={session.sessionCredentials.hash}
      />
    </Stack>
  )
}

export default DebugInfo
