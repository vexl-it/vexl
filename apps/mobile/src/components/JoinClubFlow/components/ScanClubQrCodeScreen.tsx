import {
  Button,
  NavButton,
  Stack,
  Typography,
  XmarkCancelClose,
  YStack,
  tokens,
  useTheme,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {CameraView, type BarcodeScanningResult} from 'expo-camera'
import {StatusBar} from 'expo-status-bar'
import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {G, Mask, Rect} from 'react-native-svg'
import {type JoinClubFlowStackScreenProps} from '../../../navigationTypes'
import {enableHiddenFeatures} from '../../../utils/environment'
import {handleCameraPermissionsActionAtom} from '../../../utils/handleCameraPermissions'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {getQrScannerLayout} from '../../ScanQrCodeScreen/getQrScannerLayout'
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
  const theme = useTheme()
  const scanned = useRef(false)
  const {top, bottom} = useSafeAreaInsets()
  const {height, width} = useWindowDimensions()
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

  const {scanWindow, titleTop, titleHeight} = useMemo(
    () =>
      getQrScannerLayout({
        width,
        height,
        safeAreaTop: top,
        safeAreaBottom: bottom,
        horizontalPadding: 96,
        sizeHeightRatio: 0.38,
        preferredVerticalPosition: 0.33,
        bottomControlsHeight: tokens.space[13].val * 2 + tokens.space[3].val,
      }),
    [bottom, height, top, width]
  )

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  useEffect(() => {
    void Effect.runPromise(handleCameraPermissions()).then((result) => {
      setPermissionsGranted(result === 'granted')
    })
  }, [handleCameraPermissions])

  const requestPermissions = useCallback(() => {
    void Effect.runPromise(handleCameraPermissions()).then((result) => {
      setPermissionsGranted(result === 'granted')
    })
  }, [handleCameraPermissions])

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
    <Stack f={1} bc="$black100">
      <StatusBar style="light" />
      {!!permissionsGranted && (
        <CameraView
          style={scannerStyle}
          barcodeScannerSettings={{barcodeTypes: ['qr']}}
          onBarcodeScanned={onScanned}
        />
      )}

      {!permissionsGranted && (
        <YStack f={1} ai="center" jc="center" gap="$4" px="$4">
          <Typography
            variant="paragraph"
            color="$white100"
            textAlign="center"
            maw="80%"
          >
            {t('qrScanner.missingCameraPermissions')}
          </Typography>
          <Button size="medium" variant="primary" onPress={requestPermissions}>
            {t('qrScanner.grantPermissions')}
          </Button>
        </YStack>
      )}

      <Svg
        pointerEvents="none"
        width={width}
        height={height}
        fill="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Mask id="clubQrScannerMask">
          <Rect
            width={width}
            height={height}
            fill={tokens.color.white100.val}
          />
          <G transform={`translate(${scanWindow.x} ${scanWindow.y})`}>
            <Rect
              width={scanWindow.size}
              height={scanWindow.size}
              rx={32}
              fill={tokens.color.black100.val}
            />
          </G>
        </Mask>
        <Rect
          width={width}
          height={height}
          fill={tokens.color.black100.val}
          fillOpacity={0.82}
          mask="url(#clubQrScannerMask)"
        />
        <G transform={`translate(${scanWindow.x} ${scanWindow.y})`}>
          <Rect
            width={scanWindow.size}
            height={scanWindow.size}
            rx={32}
            stroke={theme.accentYellowPrimary.get()}
            strokeWidth={4}
            fill="none"
          />
        </G>
      </Svg>

      <Stack pos="absolute" t={top} r={16}>
        <NavButton
          variant="normal"
          icon={XmarkCancelClose}
          aria-label={t('common.close')}
          onPress={close}
        />
      </Stack>

      <YStack
        pos="absolute"
        t={titleTop}
        l={24}
        r={24}
        h={titleHeight}
        jc="flex-end"
        pointerEvents="none"
      >
        <Typography
          variant="heading3"
          color="$white100"
          textAlign="center"
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {t('clubs.scanCodeAndJoinVexlClub')}
        </Typography>
      </YStack>

      <YStack pos="absolute" l={0} r={0} px="$5" b={bottom + 12} gap="$3">
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
      </YStack>
    </Stack>
  )
}

export default ScanClubQrCodeScreen
