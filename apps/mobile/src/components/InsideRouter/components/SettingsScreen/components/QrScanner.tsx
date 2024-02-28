import {Camera, CameraView} from 'expo-camera/next'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {useAtom, useSetAtom} from 'jotai'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import React, {Alert, Dimensions, Linking} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import parse from 'url-parse'
import {handleImportDeepContactActionAtom} from '../../../../../utils/deepLinks'
import {LINK_TYPE_IMPORT_CONTACT} from '../../../../../utils/deepLinks/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {qrScannerDialogVisibleAtom} from '../atoms'
import SettingsScreenDialog from './SettingsScreenDialog'

function parseDeepLink(
  link: string
): parse<Record<string, string | undefined>> | undefined {
  const parsedDeepLink = parse(link, true)
  if (!parsedDeepLink.query.link) return
  return parse(parsedDeepLink.query.link, true)
}

const scannerStyle = {
  // On android camera view will be resized to fit the whole camera preview. That will result in
  // container not being filled all the way and that will result in border radius not visible
  // so we need to scale it up a bit to always fill the whole container.
  transform: [{scale: 1.5}],
  flex: 1,
}

function QrScanner(): JSX.Element {
  const {t} = useTranslation()
  const [isVisible, setVisible] = useAtom(qrScannerDialogVisibleAtom)
  const [error, setError] = useState<string | undefined>(undefined)
  const handleImportContact = useSetAtom(handleImportDeepContactActionAtom)
  const scanned = useRef(false)
  const [hasPermissions, setHasPermissions] = useState(false)

  const requestPermissions = useCallback(async () => {
    if (!(await Camera.requestCameraPermissionsAsync()).canAskAgain) {
      Alert.alert('', t('qrScanner.grantPermissionsInSettings'), [
        {
          text: t('qrScanner.openSettings'),
          onPress: () => {
            void Linking.openSettings()
          },
        },
        {
          text: t('common.cancel'),
        },
      ])
      return
    }
    const {status} = await Camera.requestCameraPermissionsAsync()

    setHasPermissions(status === 'granted')
  }, [t])

  useEffect(() => {
    void (async () => {
      if (isVisible) {
        await requestPermissions()
        scanned.current = false
        setError(undefined)
      }
    })()
  }, [isVisible, requestPermissions])

  const onScanned = useCallback(
    ({data}: {data: string}) => {
      if (!isVisible || scanned.current) return

      const parsed = parseDeepLink(data)
      if (
        !parsed ||
        parsed.query.type !== LINK_TYPE_IMPORT_CONTACT ||
        !parsed.query.data
      ) {
        setError(t('common.errorWhileReadingQrCode'))
        return
      }

      void pipe(
        handleImportContact(parsed.query.data),
        T.map((success) => {
          if (!success) {
            setError(t('common.errorWhileReadingQrCode'))
            return
          }
          setVisible(false)
          scanned.current = true
        })
      )()
    },
    [isVisible, handleImportContact, t, setVisible]
  )

  const onClose = useCallback(() => {
    setVisible(false)
  }, [setVisible])

  const secondaryButton = useMemo(() => {
    return {
      text: t('common.close'),
    }
  }, [t])

  return (
    <SettingsScreenDialog
      onClose={onClose}
      secondaryButton={secondaryButton}
      visible={isVisible}
    >
      <YStack space="$3" height={Dimensions.get('screen').height * 0.7}>
        {error ? (
          <Text
            fontSize={20}
            fontFamily="$body500"
            color="$red"
            textAlign="center"
          >
            {error}
          </Text>
        ) : (
          <Text
            fontSize={20}
            fontFamily="$body500"
            color="$black"
            textAlign="center"
          >
            {t('qrScanner.title')}
          </Text>
        )}
        {/* Unmount barCodeScanner if not visible as advised in official documentation */}
        {!!isVisible && !!hasPermissions && (
          <Stack
            borderRadius="$4"
            flex={1}
            overflow="hidden"
            position="relative"
          >
            <CameraView style={scannerStyle} onBarcodeScanned={onScanned} />
          </Stack>
        )}
        {!hasPermissions && (
          <YStack space="$3" f={1} alignItems="center" justifyContent="center">
            <Text
              fontSize={20}
              fontFamily="$body500"
              color="$black"
              textAlign="center"
            >
              {t('qrScanner.missingCameraPermissions')}
            </Text>
            <Button
              size="small"
              onPress={requestPermissions as () => void}
              variant="primary"
              text={t('qrScanner.grantPermissions')}
            />
          </YStack>
        )}
      </YStack>
    </SettingsScreenDialog>
  )
}

export default QrScanner
