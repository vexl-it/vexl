import {Camera, CameraView} from 'expo-camera/next'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef, useState} from 'react'
import React, {Alert, Dimensions, Linking} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import parse from 'url-parse'
import {handleImportDeepContactActionAtom} from '../../../../../utils/deepLinks'
import {
  LINK_TYPE_ENCRYPTED_URL,
  LINK_TYPE_IMPORT_CONTACT,
} from '../../../../../utils/deepLinks/domain'
import {processEncryptedUrlActionAtom} from '../../../../../utils/deepLinks/encryptedUrl'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {forceHideAskAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import Button from '../../../../Button'

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
  flex: 1,
}

function QrScanner(): JSX.Element {
  const {t} = useTranslation()
  const [error, setError] = useState<string | undefined>(undefined)
  const handleImportContact = useSetAtom(handleImportDeepContactActionAtom)
  const processEncryptedUrl = useSetAtom(processEncryptedUrlActionAtom)
  const scanned = useRef(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  const forceHideAskAreYouSureDialog = useSetAtom(
    forceHideAskAreYouSureActionAtom
  )

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
      await requestPermissions()
      scanned.current = false
      setError(undefined)
    })()
  }, [requestPermissions])

  const onScanned = useCallback(
    ({data: linkdata}: {data: string}) => {
      if (scanned.current) return

      const parsed = parseDeepLink(linkdata)
      if (!parsed) {
        setError(t('common.errorWhileReadingQrCode'))
        return
      }
      const {type, data} = parsed.query

      if (!type || !data) {
        setError(t('common.errorWhileReadingQrCode'))
        return
      }

      if (type === LINK_TYPE_IMPORT_CONTACT) {
        void pipe(
          handleImportContact(data),
          T.map((success) => {
            if (!success) {
              setError(t('common.errorWhileReadingQrCode'))
              return
            }
            forceHideAskAreYouSureDialog()
            scanned.current = true
          })
        )()
      } else if (type === LINK_TYPE_ENCRYPTED_URL) {
        forceHideAskAreYouSureDialog() // // error hanled in processEncryptedUrl
        scanned.current = true
        void processEncryptedUrl(data)()
      } else {
        setError(t('common.errorWhileReadingQrCode'))
      }
    },
    [t, handleImportContact, forceHideAskAreYouSureDialog, processEncryptedUrl]
  )

  return (
    <Stack>
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
        {!!hasPermissions && (
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
    </Stack>
  )
}

export default QrScanner
