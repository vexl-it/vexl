import {CopyField, Stack, Typography} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {vexlNotificationTokenAtom} from '../../../state/notifications/vexlNotificationTokenAtom'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {copyToClipboardWithToastActionAtom} from '../../../utils/copyToClipboardWithToastActionAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'

function DebugValue({
  label,
  value,
}: {
  readonly label: string
  readonly value: string | null | undefined
}): React.ReactElement {
  const {t} = useTranslation()
  const copyToClipboard = useSetAtom(copyToClipboardWithToastActionAtom)

  return (
    <CopyField
      label={label}
      value={value ?? t('AppLogs.debugInfo.unavailable')}
      copyAccessibilityLabel={`${t('common.copy')} ${label}`}
      disabled={!value}
      onCopy={() => {
        if (!value) return
        copyToClipboard(value)
      }}
    />
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
