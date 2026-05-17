import Clipboard from '@react-native-clipboard/clipboard'
import {Copy, Stack, Typography, XStack, useTheme} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../../ToastNotification/atom'

function ContactUsDialogContent(): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const supportEmail = t('settings.items.supportEmail')

  const handleCopyPress = useCallback(() => {
    Clipboard.setString(supportEmail)
    setToastNotification(t('common.copied'))
  }, [setToastNotification, supportEmail, t])

  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundPrimary"
      borderRadius="$4"
      gap="$3"
      height="$12"
      justifyContent="space-between"
      paddingLeft="$4"
      paddingRight="$2"
    >
      <Typography
        color="$foregroundPrimary"
        flex={1}
        numberOfLines={1}
        variant="paragraphSmall"
      >
        {supportEmail}
      </Typography>
      <Stack
        alignItems="center"
        backgroundColor="$backgroundTertiary"
        borderRadius="$3"
        height="$9"
        justifyContent="center"
        onPress={handleCopyPress}
        role="button"
        width="$9"
      >
        <Copy color={theme.foregroundPrimary.get()} size={20} />
      </Stack>
    </XStack>
  )
}

export default ContactUsDialogContent
