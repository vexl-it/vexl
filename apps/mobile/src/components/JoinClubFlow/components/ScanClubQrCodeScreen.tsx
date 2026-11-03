import {Button, CameraPermissionPrompt, QrScannerOverlay} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {CameraView, type BarcodeScanningResult} from 'expo-camera'
import {StatusBar} from 'expo-status-bar'
import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {type JoinClubFlowStackScreenProps} from '../../../navigationTypes'
import {enableHiddenFeatures} from '../../../utils/environment'
import {handleCameraPermissionsActionAtom} from '../../../utils/handleCameraPermissions'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {accessCodeMolecule} from '../atoms'
import {showClubAccessDialogActionAtom} from '../utils/showClubAccessDialogActionAtom'

type Props = JoinClubFlowStackScreenProps<'ScanClubQrCodeScreen'>

const scannerStyle = {
  // On android camera view will be resized to fit the whole camera preview. That will result in
  // container not being filled all the way and that will result in border radius not visible
  // so we need to scale it up a bit to always fill the whole container.
  flex: 1,
}

function ScanClubQrCodeScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const scanned = useRef(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const {getClubQrCodeFromDeviceImageLibraryActionAtom} =
    useMolecule(accessCodeMolecule)

  const {handleCodeScannedActionAtom} = useMolecule(accessCodeMolecule)
  const handleCameraPermissions = useSetAtom(handleCameraPermissionsActionAtom)
  const handleCodeScanned = useSetAtom(handleCodeScannedActionAtom)
  const showClubAccessDialog = useSetAtom(showClubAccessDialogActionAtom)
  const getClubQrCodeFromDeviceImageLibrary = useSetAtom(
    getClubQrCodeFromDeviceImageLibraryActionAtom
  )

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const requestPermissions = useCallback(() => {
    void Effect.runPromise(handleCameraPermissions()).then((result) => {
      setPermissionsGranted(result === 'granted')
    })
  }, [handleCameraPermissions])

  useEffect(() => {
    requestPermissions()
  }, [requestPermissions])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      scanned.current = false
    })

    return unsubscribe
  }, [navigation])

  const onScanned = useCallback(
    (data: BarcodeScanningResult) => {
      if (scanned.current) return
      scanned.current = true

      void Effect.runPromise(handleCodeScanned(data)).then((success) => {
        if (typeof success === 'string') {
          navigation.navigate('FillClubAccessCodeScreen', {
            autoSubmit: true,
            code: success,
          })
        } else {
          scanned.current = false
        }
      })
    },
    [handleCodeScanned, navigation]
  )

  const uploadFromDevice = useCallback(() => {
    void Effect.runPromise(getClubQrCodeFromDeviceImageLibrary()).then(
      (success) => {
        if (typeof success === 'string') {
          navigation.navigate('FillClubAccessCodeScreen', {
            autoSubmit: true,
            code: success,
          })
        }
      }
    )
  }, [getClubQrCodeFromDeviceImageLibrary, navigation])

  return (
    <QrScannerOverlay
      title={t('clubs.scanCodeAndJoinVexlClub')}
      closeLabel={t('common.close')}
      onClose={close}
      footer={
        <>
          <Button
            variant="primary"
            onPress={() => {
              navigation.navigate('FillClubAccessCodeScreen')
            }}
          >
            {t('clubs.enterClubAccessCode')}
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              Effect.runFork(showClubAccessDialog())
              navigation.goBack()
            }}
          >
            {t('clubs.askForAccess')}
          </Button>
          {!!enableHiddenFeatures && (
            <Button variant="secondary" onPress={uploadFromDevice}>
              {t('clubs.uploadFromDevice')}
            </Button>
          )}
        </>
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

export default ScanClubQrCodeScreen
