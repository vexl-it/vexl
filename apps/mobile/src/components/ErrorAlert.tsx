import Clipboard from '@react-native-clipboard/clipboard'
import {createDialogAtom, DialogFromAtom} from '@vexl-next/ui'
import {Effect} from 'effect'
import {getDefaultStore} from 'jotai'
import React from 'react'
import {translationAtom} from '../utils/localization/I18nProvider'
import {toastNotificationAtom} from './ToastNotification/atom'

interface ErrorAlertProps {
  title: string
  description?: string
  error?: unknown
}

const errorDialogAtom = createDialogAtom()

export function showErrorAlert(props: ErrorAlertProps | null): void {
  const store = getDefaultStore()
  if (props == null) {
    store.set(errorDialogAtom, null)
    return
  }

  const {t} = store.get(translationAtom)
  Effect.runFork(
    store
      .set(errorDialogAtom, {
        title: props.title,
        subtitle: props.description,
        positiveButtonText: t('common.copyErrorToClipboard'),
        negativeButtonText: t('common.close'),
      })
      .pipe(
        Effect.tap((copyPressed) => {
          if (!copyPressed) return
          Clipboard.setString(JSON.stringify(props.error, null, 2))
          store.set(toastNotificationAtom, t('common.copied'))
        })
      )
  )
}

function ErrorAlert(): React.ReactElement {
  return <DialogFromAtom dialogAtom={errorDialogAtom} />
}

export default ErrorAlert
