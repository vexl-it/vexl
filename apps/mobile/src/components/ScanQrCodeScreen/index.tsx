import {
  Button,
  NavButton,
  Stack,
  Typography,
  XmarkCancelClose,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {CameraView, type BarcodeScanningResult} from 'expo-camera'
import {StatusBar} from 'expo-status-bar'
import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {G, Mask, Rect} from 'react-native-svg'
import {type RootStackScreenProps} from '../../navigationTypes'
import {handleDeepLinkActionAtom} from '../../utils/deepLinks'
import {handleCameraPermissionsActionAtom} from '../../utils/handleCameraPermissions'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {forceHideAskAreYouSureActionAtom} from '../GlobalDialog'

type Props = RootStackScreenProps<'ScanQrCode'>

const scannerStyle = {
  // On android camera view will be resized to fit the whole camera preview. That will result in
  // container not being filled all the way and that will result in border radius not visible
  // so we need to scale it up a bit to always fill the whole container.
  flex: 1,
}

function ScanQrCodeScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const scanned = useRef(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const {top, bottom} = useSafeAreaInsets()
  const {width, height} = useWindowDimensions()
  const handleCameraPermissions = useSetAtom(handleCameraPermissionsActionAtom)
  const handleDeepLinkAction = useSetAtom(handleDeepLinkActionAtom)
  const forceHideAskGlobalDialog = useSetAtom(forceHideAskAreYouSureActionAtom)

  const scanWindow = useMemo(() => {
    const size = Math.min(width - 48, height * 0.4)
    return {
      size,
      x: (width - size) / 2,
      y: height * 0.3,
    }
  }, [height, width])

  useEffect(() => {
    void Effect.runPromise(handleCameraPermissions()).then((result) => {
      setPermissionsGranted(result === 'granted')
    })
  }, [handleCameraPermissions])

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onScanned = useCallback(
    ({data: linkdata}: BarcodeScanningResult) => {
      if (scanned.current) return
      scanned.current = true
      setError(undefined)

      handleDeepLinkAction(linkdata).pipe(
        Effect.tapError(() =>
          Effect.sync(() => {
            scanned.current = false
            setError(t('common.errorWhileReadingQrCode'))
          })
        ),
        Effect.tap((success) =>
          Effect.sync(() => {
            if (success) {
              forceHideAskGlobalDialog()
              navigation.goBack()
            } else {
              scanned.current = false
            }
          })
        ),
        Effect.runFork
      )
    },
    [forceHideAskGlobalDialog, handleDeepLinkAction, navigation, t]
  )

  return (
    <Stack f={1} bc="$black">
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
          <Button
            size="medium"
            variant="primary"
            onPress={() => {
              void Effect.runPromise(handleCameraPermissions()).then(
                (result) => {
                  setPermissionsGranted(result === 'granted')
                }
              )
            }}
          >
            {t('qrScanner.grantPermissions')}
          </Button>
        </YStack>
      )}

      <Svg
        width={width}
        height={height}
        fill="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Mask id="qrScannerMask">
          <Rect width={width} height={height} fill="white" />
          <G transform={`translate(${scanWindow.x} ${scanWindow.y})`}>
            <Rect
              width={scanWindow.size}
              height={scanWindow.size}
              rx={24}
              fill="black"
            />
          </G>
        </Mask>
        <Rect
          width={width}
          height={height}
          fill="rgba(16, 16, 16, 0.82)"
          mask="url(#qrScannerMask)"
        />
        <G transform={`translate(${scanWindow.x} ${scanWindow.y})`}>
          <Rect
            width={scanWindow.size}
            height={scanWindow.size}
            rx={24}
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

      <Typography
        variant="heading2"
        color="$white100"
        pos="absolute"
        top={Math.max(top + 64, scanWindow.y - 100)}
        als="center"
        textAlign="center"
      >
        {error ?? t('qrScanner.title')}
      </Typography>

      <YStack pos="absolute" l={0} r={0} px="$5" b={bottom + 12}>
        <Button variant="primary" onPress={close}>
          {t('common.close')}
        </Button>
      </YStack>
    </Stack>
  )
}

export default ScanQrCodeScreen
