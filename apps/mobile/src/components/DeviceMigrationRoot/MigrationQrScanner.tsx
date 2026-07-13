import {
  Button,
  Screen,
  Stack,
  Typography,
  YStack,
  tokens,
  useTheme,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {CameraView, type BarcodeScanningResult} from 'expo-camera'
import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {G, Mask, Rect} from 'react-native-svg'
import {handleCameraPermissionsActionAtom} from '../../utils/handleCameraPermissions'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {getQrScannerLayout} from '../ScanQrCodeScreen/getQrScannerLayout'

const cameraStyle = {flex: 1}

interface MigrationQrScannerProps {
  readonly title: string
  readonly body: string
  readonly onScan: (value: string) => void
  readonly onCancel?: () => void
}

export default function MigrationQrScanner({
  title,
  body,
  onScan,
  onCancel,
}: MigrationQrScannerProps): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const scanned = useRef(false)
  const {top, bottom} = useSafeAreaInsets()
  const {height, width} = useWindowDimensions()
  const [permissionGranted, setPermissionGranted] = useState(false)
  const handleCameraPermissions = useSetAtom(handleCameraPermissionsActionAtom)
  const {scanWindow, titleTop, titleHeight} = useMemo(
    () =>
      getQrScannerLayout({
        width,
        height,
        safeAreaTop: top,
        safeAreaBottom: bottom,
        horizontalPadding: 72,
        sizeHeightRatio: 0.38,
        preferredVerticalPosition: 0.38,
        bottomControlsHeight: tokens.space[13].val,
      }),
    [bottom, height, top, width]
  )

  const requestPermission = useCallback(() => {
    void Effect.runPromise(handleCameraPermissions()).then((result) => {
      setPermissionGranted(result === 'granted')
    })
  }, [handleCameraPermissions])

  useEffect(requestPermission, [requestPermission])

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned.current) return
      scanned.current = true
      onScan(result.data)
    },
    [onScan]
  )

  return (
    <Screen navigationBar={null} safeAreasBackgroundColor="$black100">
      <Stack flex={1} bg="$black100" mx="$-4" my="$-4">
        {permissionGranted ? (
          <CameraView
            style={cameraStyle}
            barcodeScannerSettings={{barcodeTypes: ['qr']}}
            onBarcodeScanned={onBarcodeScanned}
          />
        ) : (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            gap="$4"
            px="$4"
          >
            <Typography
              variant="paragraph"
              color="$white100"
              textAlign="center"
            >
              {t('deviceMigration.camera.denied')}
            </Typography>
            <Button variant="primary" size="medium" onPress={requestPermission}>
              {t('deviceMigration.camera.grant')}
            </Button>
          </YStack>
        )}
        <Svg
          pointerEvents="none"
          width={width}
          height={height}
          style={{position: 'absolute'}}
        >
          <Mask id="migrationQrMask">
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
            mask="url(#migrationQrMask)"
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
        <YStack
          pos="absolute"
          t={titleTop}
          l="$6"
          r="$6"
          h={titleHeight}
          justifyContent="flex-end"
          gap="$2"
          pointerEvents="none"
        >
          <Typography variant="heading3" color="$white100" textAlign="center">
            {title}
          </Typography>
          <Typography
            variant="paragraphSmall"
            color="$white100"
            textAlign="center"
          >
            {body}
          </Typography>
        </YStack>
        {onCancel !== undefined && (
          <Stack pos="absolute" b={bottom + tokens.space[6].val} l="$6" r="$6">
            <Button variant="secondary" size="large" onPress={onCancel}>
              {t('deviceMigration.common.cancel')}
            </Button>
          </Stack>
        )}
      </Stack>
    </Screen>
  )
}
