import Clipboard from '@react-native-clipboard/clipboard'
import {Copy, NavButton, Typography, XStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../../ToastNotification/atom'

export function InviteCodeRow({
  code,
}: {
  readonly code: string
}): React.JSX.Element {
  const {t} = useTranslation()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      height="$11"
      paddingHorizontal="$5"
      justifyContent="space-between"
    >
      <Typography variant="paragraph" color="$foregroundSecondary">
        {t('clubs.moderator.inviteCodeLabel')}
      </Typography>
      <XStack alignItems="center" gap="$3">
        <XStack gap="$2">
          {code.split('').map((char, index) => (
            <Typography
              key={index}
              variant="paragraphDemibold"
              color="$foregroundPrimary"
            >
              {char}
            </Typography>
          ))}
        </XStack>
        <NavButton
          variant="normal"
          icon={Copy}
          onPress={() => {
            Clipboard.setString(code)
            setToastNotification(t('common.copied'))
          }}
        />
      </XStack>
    </XStack>
  )
}
