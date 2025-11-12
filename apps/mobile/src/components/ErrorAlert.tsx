import Clipboard from '@react-native-clipboard/clipboard'
import {atom, getDefaultStore, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Stack, Text, useWindowDimensions} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import Button from './Button'
import {toastNotificationAtom} from './ToastNotification/atom'
import checkIconSvg from './images/checkIconSvg'

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
      <Stack bc="$white" maxWidth={width * 0.8} br="$4" p="$4">
        <Stack gap="$2" bc="$greyAccent4" br="$4" p="$4" mb="$4">
          <Text ff="$heading" col="$black">
            {errorAlert.title}
          </Text>
        </Stack>
        {!!errorAlert.description && (
          <Text fos={16} ff="$body500" col="$greyAccent1">
            {errorAlert.description}
          </Text>
        )}
        <Stack gap="$2" mt="$4">
          <Button
            fullWidth
            size="small"
            text={t('common.copyErrorToClipboard')}
            variant="secondary"
            onPress={() => {
              Clipboard.setString(JSON.stringify(errorAlert.error, null, 2))
              setToastNotification({
                visible: true,
                text: t('common.copied'),
                icon: checkIconSvg,
              })
              showErrorAlert(null)
            }}
          />
          <Button
            fullWidth
            size="small"
            text={t('common.close')}
            variant="secondary"
            onPress={() => {
              showErrorAlert(null)
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ErrorAlert
