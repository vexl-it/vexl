import {Button, CameraPermissionPrompt, QrScannerOverlay} from '@vexl-next/ui'
import {Effect} from 'effect'
import {CameraView, type BarcodeScanningResult} from 'expo-camera'
import {StatusBar} from 'expo-status-bar'
import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {handleDeepLinkActionAtom} from '../../../utils/deepLinks'
import {handleCameraPermissionsActionAtom} from '../../../utils/handleCameraPermissions'
import {useTranslation} from '../../../utils/localization/I18nProvider'

type Props = RootStackScreenProps<'ScanClubAdmissionQrCode'>

const scannerStyle = {
  // On android camera view will be resized to fit the whole camera preview. That will result in
  // container not being filled all the way and that will result in border radius not visible
  // so we need to scale it up a bit to always fill the whole container.
  flex: 1,
}

export function ScanClubAdmissionQrCodeScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const scanned = useRef(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const handleCameraPermissions = useSetAtom(handleCameraPermissionsActionAtom)
  const handleDeepLinkAction = useSetAtom(handleDeepLinkActionAtom)

  const requestPermissions = useCallback(() => {
    void Effect.runPromise(handleCameraPermissions()).then((result) => {
      setPermissionsGranted(result === 'granted')
    })
  }, [handleCameraPermissions])

  useEffect(() => {
    requestPermissions()
  }, [requestPermissions])

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onScanned = useCallback(
    ({data: linkdata}: BarcodeScanningResult) => {
      if (scanned.current) return
      scanned.current = true
      setError(undefined)

      handleDeepLinkAction(linkdata, ['request-club-admition']).pipe(
        Effect.tapError(() =>
          Effect.sync(() => {
            scanned.current = false
            setError(t('common.errorWhileReadingQrCode'))
          })
        ),
        Effect.tap((success) =>
          Effect.sync(() => {
            if (success) {
              navigation.goBack()
            } else {
              scanned.current = false
            }
          })
        ),
        Effect.runFork
      )
    },
    [handleDeepLinkAction, navigation, t]
  )

  return (
    <QrScannerOverlay
      title={error ?? t('clubs.admition.scan')}
      closeLabel={t('common.close')}
      onClose={close}
      footer={
        <Button variant="primary" onPress={close}>
          {t('common.close')}
        </Button>
      }
    >
      <StatusBar style="light" />
      {permissionsGranted ? (
        <CameraView
          style={scannerStyle}
          barcodeScannerSettings={{barcodeTypes: ['qr']}}
          onBarcodeScanned={onScanned}
        />
      ) : (
        <CameraPermissionPrompt
          message={t('qrScanner.missingCameraPermissions')}
          buttonLabel={t('qrScanner.grantPermissions')}
          onPress={requestPermissions}
        />
      )}
    </QrScannerOverlay>
  )
}
