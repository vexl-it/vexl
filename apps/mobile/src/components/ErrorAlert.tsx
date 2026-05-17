import Clipboard from '@react-native-clipboard/clipboard'
import {Button, Stack, Typography} from '@vexl-next/ui'
import {atom, getDefaultStore, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {useTranslation} from '../utils/localization/I18nProvider'
import {toastNotificationAtom} from './ToastNotification/atom'

interface ErrorAlertProps {
  title: string
  description?: string
  error?: unknown
}

const errorAlertAtom = atom<ErrorAlertProps | null>(null)

export function showErrorAlert(props: ErrorAlertProps | null): void {
  const store = getDefaultStore()
  store.set(errorAlertAtom, props)
}

function ErrorAlert(): React.ReactElement | null {
  const {t} = useTranslation()
  const {width} = useWindowDimensions()
  const errorAlert = useAtomValue(errorAlertAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  if (!errorAlert) return null

  return (
    <Stack
      pos="absolute"
      ai="center"
      jc="center"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex="$100"
      backgroundColor="rgba(0, 0, 0, 0.4)"
    >
      <Stack bc="$backgroundPrimary" maxWidth={width * 0.8} br="$4" p="$4">
        <Stack gap="$2" bc="$backgroundSecondary" br="$4" p="$4" mb="$4">
          <Typography variant="heading3" color="$foregroundPrimary">
            {errorAlert.title}
          </Typography>
        </Stack>
        {!!errorAlert.description && (
          <Typography variant="paragraphSmall" color="$foregroundSecondary">
            {errorAlert.description}
          </Typography>
        )}
        <Stack gap="$2" mt="$4">
          <Button
            alignSelf="stretch"
            size="small"
            variant="secondary"
            onPress={() => {
              Clipboard.setString(JSON.stringify(errorAlert.error, null, 2))
              setToastNotification(t('common.copied'))
              showErrorAlert(null)
            }}
          >
            {t('common.copyErrorToClipboard')}
          </Button>
          <Button
            alignSelf="stretch"
            size="small"
            variant="secondary"
            onPress={() => {
              showErrorAlert(null)
            }}
          >
            {t('common.close')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ErrorAlert
