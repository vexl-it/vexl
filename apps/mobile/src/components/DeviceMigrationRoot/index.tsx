import Clipboard from '@react-native-clipboard/clipboard'
import {type DeviceMigrationErrorCode} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  Button,
  NavigationBar,
  Screen,
  Stack,
  Typography,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Effect, Either} from 'effect'
import {useKeepAwake} from 'expo-keep-awake'
import {addEventListener, getInitialURL} from 'expo-linking'
import React, {useEffect, useState, useSyncExternalStore} from 'react'
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import SvgQRCode from 'react-native-qrcode-svg'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {acquireCaptureProtectionLease} from '../../utils/captureProtectionLease'
import {
  type MigrationControlReadResult,
  needsManualRecovery,
} from '../../utils/deviceMigration/controlStore/domain'
import {
  continueSourceRecovery,
  dispatchRequiredRecovery,
  resolveRequiredRecoveryTransition,
  safeCancelDestination,
  safeCancelSource,
} from '../../utils/deviceMigration/orchestration'
import {useTranslation} from '../../utils/localization/I18nProvider'
import MigrationQrScanner from './MigrationQrScanner'
import {
  acceptEraseCommandUi,
  acceptReceiptUi,
  awaitSourceOutcomeUi,
  cancelDestinationMigrationUi,
  cancelSourceMigrationUi,
  clearMigrationUiError,
  confirmMigrationCode,
  displayEraseCommandUi,
  getMigrationUiState,
  installDestinationUi,
  leaveDestinationMigrationUi,
  openReceiptScannerUi,
  startDestinationMigrationUi,
  subscribeToMigrationUiState,
} from './coordinator'
import {parseEmulatorMigrationDeepLink} from './emulatorDeepLink'

const styles = StyleSheet.create({
  root: {flex: 1},
  emulatorPayload: {width: 300, height: 20},
})

function MigrationCaptureGuard(): null {
  useEffect(() => acquireCaptureProtectionLease(), [])
  return null
}

interface ContentScreenProps {
  readonly title: string
  readonly body: string
  readonly warning?: string
  readonly children?: React.ReactNode
  readonly primary?: {readonly label: string; readonly onPress: () => void}
  readonly secondary?: {readonly label: string; readonly onPress: () => void}
  readonly progress?: boolean
}

function ContentScreen({
  title,
  body,
  warning,
  children,
  primary,
  secondary,
  progress,
}: ContentScreenProps): React.ReactElement {
  const theme = useTheme()
  return (
    <Screen
      scrollable
      navigationBar={<NavigationBar style="back" title={title} />}
    >
      <YStack flex={1} gap="$6" justifyContent="center" py="$6">
        <YStack gap="$3">
          <Typography
            variant="heading2"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {title}
          </Typography>
          <Typography
            variant="paragraph"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {body}
          </Typography>
        </YStack>
        {warning !== undefined && (
          <Stack bg="$redBackground" p="$4" borderRadius="$4">
            <Typography
              variant="paragraph"
              color="$redForeground"
              textAlign="center"
            >
              {warning}
            </Typography>
          </Stack>
        )}
        {progress === true && (
          <ActivityIndicator
            size="large"
            color={theme.accentYellowPrimary.get()}
          />
        )}
        {children}
        <YStack gap="$3" mt="$4">
          {primary !== undefined && (
            <Button size="large" variant="primary" onPress={primary.onPress}>
              {primary.label}
            </Button>
          )}
          {secondary !== undefined && (
            <Button
              size="large"
              variant="secondary"
              onPress={secondary.onPress}
            >
              {secondary.label}
            </Button>
          )}
        </YStack>
      </YStack>
    </Screen>
  )
}

function QrScreen({
  title,
  body,
  value,
  secondary,
}: {
  readonly title: string
  readonly body: string
  readonly value: string
  readonly secondary?: ContentScreenProps['secondary']
}): React.ReactElement {
  return (
    <ContentScreen title={title} body={body} secondary={secondary}>
      <QrVisual value={value} />
    </ContentScreen>
  )
}

function QrVisual({value}: {readonly value: string}): React.ReactElement {
  const theme = useTheme()
  const {width} = useWindowDimensions()
  const size = Math.min(width - 96, 360)
  return (
    <YStack alignItems="center" gap="$4">
      <Stack alignSelf="center" bg="$backgroundOnBar" p="$4" borderRadius="$4">
        <SvgQRCode
          value={value}
          size={size}
          color={theme.foregroundPrimary.get()}
          backgroundColor={theme.backgroundOnBar.get()}
        />
      </Stack>
      {__DEV__ ? (
        <>
          <Typography
            aria-label={value}
            testID="emulator-qr-payload"
            variant="paragraphSmall"
            color="$backgroundPrimary"
            style={styles.emulatorPayload}
            numberOfLines={1}
          >
            {value}
          </Typography>
          <Button
            size="small"
            variant="secondary"
            onPress={() => {
              Clipboard.setString(value)
            }}
          >
            Copy emulator QR payload
          </Button>
        </>
      ) : null}
    </YStack>
  )
}

function ExpiryCountdown({
  expiresAt,
}: {
  readonly expiresAt: number
}): React.ReactElement {
  const {t} = useTranslation()
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  )
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [expiresAt])
  const minutesPart = Math.floor(seconds / 60)
  const secondsPart = String(seconds % 60).padStart(2, '0')
  return (
    <Typography
      variant="paragraphSmall"
      color="$foregroundSecondary"
      textAlign="center"
    >
      {t('deviceMigration.pairing.countdown', {
        time: `${minutesPart}:${secondsPart}`,
      })}
    </Typography>
  )
}

function ErrorMessage({
  code,
}: {
  readonly code: DeviceMigrationErrorCode
}): React.ReactElement {
  const {t} = useTranslation()
  switch (code) {
    case 'qrInvalid':
      return <>{t('deviceMigration.errors.qrInvalid')}</>
    case 'qrExpired':
      return <>{t('deviceMigration.errors.qrExpired')}</>
    case 'versionMismatch':
      return <>{t('deviceMigration.errors.versionMismatch')}</>
    case 'limitExceeded':
      return <>{t('deviceMigration.errors.limitExceeded')}</>
    case 'macInvalid':
      return <>{t('deviceMigration.errors.macInvalid')}</>
    case 'digestMismatch':
      return <>{t('deviceMigration.errors.digestMismatch')}</>
    case 'schemaInvalid':
      return <>{t('deviceMigration.errors.schemaInvalid')}</>
    case 'stateInvalid':
      return <>{t('deviceMigration.errors.stateInvalid')}</>
    case 'roleInvalid':
      return <>{t('deviceMigration.errors.roleInvalid')}</>
    case 'nonceReused':
      return <>{t('deviceMigration.errors.nonceReused')}</>
    case 'handshakeFailed':
      return <>{t('deviceMigration.errors.handshakeFailed')}</>
    case 'transportFailed':
      return <>{t('deviceMigration.errors.transportFailed')}</>
    case 'timedOut':
      return <>{t('deviceMigration.errors.timedOut')}</>
    case 'cancelled':
      return <>{t('deviceMigration.errors.cancelled')}</>
    case 'stagingIncomplete':
      return <>{t('deviceMigration.errors.stagingIncomplete')}</>
    case 'pathInvalid':
      return <>{t('deviceMigration.errors.pathInvalid')}</>
    case 'freshInstallRequired':
      return <>{t('deviceMigration.errors.freshInstallRequired')}</>
    case 'insufficientDiskSpace':
      return <>{t('deviceMigration.errors.insufficientDiskSpace')}</>
    case 'cleanupIncomplete':
      return <>{t('deviceMigration.errors.cleanupIncomplete')}</>
    case 'permissionDenied':
      return <>{t('deviceMigration.errors.permissionDenied')}</>
    case 'unknownStorageKey':
      return <>{t('deviceMigration.errors.unknownStorageKey')}</>
    case 'sessionInvalid':
      return <>{t('deviceMigration.errors.sessionInvalid')}</>
    case 'receiptInvalid':
      return <>{t('deviceMigration.errors.receiptInvalid')}</>
  }
}

export interface DeviceMigrationRootProps {
  readonly controlRecord: MigrationControlReadResult
}

function DeviceMigrationContent({
  controlRecord,
}: DeviceMigrationRootProps): React.ReactElement {
  const {t} = useTranslation()
  const ui = useSyncExternalStore(
    subscribeToMigrationUiState,
    getMigrationUiState
  )
  const [sourceEraseScanner, setSourceEraseScanner] = useState(false)
  const recovery = resolveRequiredRecoveryTransition(controlRecord)

  useEffect(() => {
    if (!__DEV__) return

    const handleLink = (link: string): void => {
      const parsed = parseEmulatorMigrationDeepLink(link)
      if (parsed === undefined) return

      if (parsed.action === 'pairing' && ui.phase === 'destinationEntry') {
        startDestinationMigrationUi(parsed.qrString, parsed.endpointHost)
      } else if (
        parsed.action === 'erase' &&
        (ui.phase === 'sourceAwaitingErase' ||
          controlRecord.mode === 'sourceAwaitingEraseCommand')
      ) {
        setSourceEraseScanner(false)
        acceptEraseCommandUi(parsed.qrString)
      } else if (
        parsed.action === 'receipt' &&
        ui.phase === 'destinationReceiptScanner'
      ) {
        acceptReceiptUi(parsed.qrString)
      }
    }

    // This listener is deliberately independent of useHandleUniversalAndAppLinks:
    // that tree is unmounted during migration and it persists initial links.
    void getInitialURL().then((initialLink) => {
      if (initialLink !== null) handleLink(initialLink)
    })
    const subscription = addEventListener('url', ({url}) => {
      handleLink(url)
    })
    return () => {
      subscription.remove()
    }
  }, [controlRecord.mode, ui.phase])

  useEffect(() => {
    if (ui.phase !== 'idle') return
    void Effect.runPromise(
      dispatchRequiredRecovery(controlRecord).pipe(Effect.ignore)
    )
  }, [controlRecord, ui.phase])

  useEffect(() => {
    if (controlRecord.mode !== 'sourceErasedAwaitingDestinationAck') return
    void Effect.runPromise(continueSourceRecovery().pipe(Effect.ignore))
  }, [controlRecord.mode])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') return
      // Emulator QR delivery uses a platform deep-link command, which emits a
      // transient background/inactive state before the URL event. Explicit
      // cancellation remains available in development; production keeps the
      // background-safety behavior below.
      if (__DEV__) return
      if (
        controlRecord.mode === 'sourceQuiescing' ||
        controlRecord.mode === 'sourceServing' ||
        controlRecord.mode === 'sourceSnapshotSent' ||
        controlRecord.mode === 'sourceAwaitingEraseCommand'
      )
        cancelSourceMigrationUi()
      else if (
        controlRecord.mode === 'destinationReceiving' ||
        controlRecord.mode === 'destinationStaged'
      )
        cancelDestinationMigrationUi()
      else if (
        controlRecord.mode === 'normal' &&
        ui.phase === 'destinationEntry'
      )
        leaveDestinationMigrationUi()
    })
    return () => {
      subscription.remove()
    }
  }, [controlRecord.mode, ui.phase])

  if (needsManualRecovery(controlRecord))
    return (
      <ContentScreen
        title={t('deviceMigration.recovery.manualTitle')}
        body={t('deviceMigration.recovery.manualBody')}
      />
    )

  if (ui.errorCode !== undefined) {
    return (
      <ContentScreen
        title={t('deviceMigration.recovery.title')}
        body=""
        primary={{
          label: t('deviceMigration.common.retry'),
          onPress: clearMigrationUiError,
        }}
      >
        <Typography
          variant="paragraph"
          color="$redForeground"
          textAlign="center"
        >
          <ErrorMessage code={ui.errorCode} />
        </Typography>
      </ContentScreen>
    )
  }

  if (sourceEraseScanner)
    return (
      <MigrationQrScanner
        title={t('deviceMigration.eraseScanner.title')}
        body={t('deviceMigration.eraseScanner.body')}
        onScan={(qrString) => {
          setSourceEraseScanner(false)
          acceptEraseCommandUi(qrString)
        }}
        onCancel={() => {
          setSourceEraseScanner(false)
        }}
      />
    )
  if (ui.phase === 'destinationEntry')
    return (
      <MigrationQrScanner
        title={t('deviceMigration.destination.scanTitle')}
        body={t('deviceMigration.destination.scanBody')}
        onScan={startDestinationMigrationUi}
        onCancel={leaveDestinationMigrationUi}
      />
    )
  if (ui.phase === 'destinationReceiptScanner')
    return (
      <MigrationQrScanner
        title={t('deviceMigration.destination.receiptScannerTitle')}
        body={t('deviceMigration.destination.receiptScannerBody')}
        onScan={acceptReceiptUi}
      />
    )

  if (
    ui.phase === 'sourcePairing' &&
    ui.qrString !== undefined &&
    ui.qrExpiresAt !== undefined
  )
    return (
      <ContentScreen
        title={t('deviceMigration.pairing.title')}
        body={`${t('deviceMigration.pairing.body')} ${t('deviceMigration.pairing.expires')}`}
        secondary={{
          label: t('deviceMigration.common.cancel'),
          onPress: cancelSourceMigrationUi,
        }}
      >
        <QrVisual value={ui.qrString} />
        <ExpiryCountdown expiresAt={ui.qrExpiresAt} />
      </ContentScreen>
    )
  if (
    ui.phase === 'sourceCancellationQr' &&
    ui.cancellationQrString !== undefined
  )
    return (
      <QrScreen
        title={t('deviceMigration.cancelFallback.title')}
        body={t('deviceMigration.cancelFallback.body')}
        value={ui.cancellationQrString}
        secondary={{
          label: t('common.finish'),
          onPress: leaveDestinationMigrationUi,
        }}
      />
    )
  if (
    (ui.phase === 'sourceAuthCode' || ui.phase === 'destinationAuthCode') &&
    ui.humanAuthCode !== undefined
  )
    return (
      <ContentScreen
        title={t('deviceMigration.auth.title')}
        body={t('deviceMigration.auth.body')}
        primary={{
          label: t('deviceMigration.auth.match'),
          onPress: () => {
            confirmMigrationCode(true)
          },
        }}
        secondary={{
          label: t('deviceMigration.auth.reject'),
          onPress: () => {
            confirmMigrationCode(false)
          },
        }}
      >
        <Typography
          variant="heading1"
          color="$foregroundPrimary"
          textAlign="center"
          letterSpacing={8}
        >
          {ui.humanAuthCode}
        </Typography>
      </ContentScreen>
    )
  if (ui.phase === 'sourceStarting' || ui.phase === 'sourceTransfer')
    return (
      <ContentScreen
        title={t('deviceMigration.progress.sourceTitle')}
        body={t('deviceMigration.progress.sourceBody')}
        progress
        secondary={{
          label: t('deviceMigration.common.cancel'),
          onPress: cancelSourceMigrationUi,
        }}
      />
    )
  if (
    ui.phase === 'destinationConnecting' ||
    ui.phase === 'destinationReceiving'
  )
    return (
      <ContentScreen
        title={t('deviceMigration.progress.destinationTitle')}
        body={t('deviceMigration.progress.destinationBody')}
        progress
        secondary={{
          label: t('deviceMigration.common.cancel'),
          onPress: cancelDestinationMigrationUi,
        }}
      />
    )
  if (
    ui.phase === 'sourceAwaitingErase' ||
    controlRecord.mode === 'sourceAwaitingEraseCommand'
  )
    return (
      <ContentScreen
        title={t('deviceMigration.awaitErase.title')}
        body={t('deviceMigration.awaitErase.body')}
        warning={t('deviceMigration.awaitErase.warning')}
        primary={{
          label: t('deviceMigration.awaitErase.scan'),
          onPress: () => {
            setSourceEraseScanner(true)
          },
        }}
        secondary={{
          label: t('deviceMigration.common.cancel'),
          onPress: cancelSourceMigrationUi,
        }}
      />
    )
  if (controlRecord.mode === 'sourceErasedAwaitingDestinationAck') {
    const encoded = controlRecord.sourceErasedReceipt.encodeToQrString()
    if (Either.isRight(encoded))
      return (
        <QrScreen
          title={t('deviceMigration.erased.title')}
          body={t('deviceMigration.erased.body')}
          value={encoded.right}
        />
      )
  }
  if (ui.phase === 'sourceRetiring' || recovery === 'sourceResumeRetirement')
    return (
      <ContentScreen
        title={t('deviceMigration.retirement.title')}
        body={t('deviceMigration.retirement.body')}
        progress
      />
    )
  if (
    ui.phase === 'destinationStagedWarning' ||
    controlRecord.mode === 'destinationStaged'
  )
    return (
      <ContentScreen
        title={t('deviceMigration.destination.stagedTitle')}
        body={t('deviceMigration.destination.stagedBody')}
        warning={t('deviceMigration.destination.irreversibleWarning')}
        primary={{
          label: t('deviceMigration.destination.showEraseQr'),
          onPress: displayEraseCommandUi,
        }}
        secondary={
          controlRecord.mode === 'destinationStaged'
            ? {
                label: t('deviceMigration.common.cancel'),
                onPress: cancelDestinationMigrationUi,
              }
            : undefined
        }
      />
    )
  if (ui.phase === 'destinationEraseQr' && ui.qrString !== undefined)
    return (
      <ContentScreen
        title={t('deviceMigration.destination.eraseQrTitle')}
        body={t('deviceMigration.destination.eraseQrBody')}
        primary={{
          label: t('deviceMigration.destination.waitForSource'),
          onPress: awaitSourceOutcomeUi,
        }}
        secondary={{
          label: t('deviceMigration.pairing.regenerate'),
          onPress: displayEraseCommandUi,
        }}
      >
        <QrVisual value={ui.qrString} />
      </ContentScreen>
    )
  if (ui.phase === 'destinationAwaitingOutcome')
    return (
      <ContentScreen
        title={t('deviceMigration.destination.awaitingTitle')}
        body={t('deviceMigration.destination.awaitingBody')}
        progress
        primary={{
          label: t('deviceMigration.destination.scanReceipt'),
          onPress: openReceiptScannerUi,
        }}
      />
    )
  if (controlRecord.mode === 'destinationEraseCommandAvailable')
    return (
      <ContentScreen
        title={t('deviceMigration.destination.awaitingTitle')}
        body={t('deviceMigration.destination.awaitingBody')}
        primary={{
          label: t('deviceMigration.recovery.resume'),
          onPress: displayEraseCommandUi,
        }}
        secondary={{
          label: t('deviceMigration.destination.scanReceipt'),
          onPress: openReceiptScannerUi,
        }}
      />
    )
  if (controlRecord.mode === 'destinationAwaitingSourceOutcome')
    return (
      <ContentScreen
        title={t('deviceMigration.destination.awaitingTitle')}
        body={t('deviceMigration.destination.awaitingBody')}
        primary={{
          label: t('deviceMigration.destination.scanReceipt'),
          onPress: openReceiptScannerUi,
        }}
      />
    )
  if (
    ui.phase === 'destinationInstalling' ||
    recovery === 'destinationResumeInstall' ||
    recovery === 'destinationResumeActivation'
  )
    return (
      <ContentScreen
        title={t('deviceMigration.destination.installingTitle')}
        body={t('deviceMigration.destination.installingBody')}
        progress
        primary={{
          label: t('deviceMigration.common.retry'),
          onPress: installDestinationUi,
        }}
      />
    )
  if (recovery === 'sourceCancellableRecovery')
    return (
      <ContentScreen
        title={t('deviceMigration.recovery.title')}
        body={t('deviceMigration.recovery.sourceBody')}
        secondary={{
          label: t('deviceMigration.recovery.safeCancel'),
          onPress: () => {
            void Effect.runPromise(safeCancelSource().pipe(Effect.ignore))
          },
        }}
      />
    )
  if (
    recovery === 'destinationResumeReceiving' ||
    recovery === 'destinationKeepStagedDormant'
  )
    return (
      <ContentScreen
        title={t('deviceMigration.recovery.title')}
        body={t('deviceMigration.recovery.destinationBody')}
        secondary={
          controlRecord.mode === 'destinationReceiving'
            ? {
                label: t('deviceMigration.recovery.safeCancel'),
                onPress: () => {
                  void Effect.runPromise(
                    safeCancelDestination().pipe(Effect.ignore)
                  )
                },
              }
            : undefined
        }
      />
    )
  return (
    <ContentScreen
      title={t('deviceMigration.common.keepOpen')}
      body={t('deviceMigration.recovery.destinationBody')}
      progress
    />
  )
}

function DeviceMigrationRoot(
  props: DeviceMigrationRootProps
): React.ReactElement {
  useKeepAwake('device-migration')
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <MigrationCaptureGuard />
        <DeviceMigrationContent {...props} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default DeviceMigrationRoot
