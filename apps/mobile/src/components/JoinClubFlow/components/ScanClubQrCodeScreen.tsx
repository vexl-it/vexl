import {Effect} from 'effect'
import {CameraView} from 'expo-camera'
import {useSetAtom} from 'jotai'
import {useEffect, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {Mask, Rect} from 'react-native-svg'
import {getTokens, Stack, Text, YStack} from 'tamagui'
import {handleCameraPermissionsActionAtom} from '../../../utils/handleCameraPermissions'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import Header from './Header'

const scannerStyle = {
  // On android camera view will be resized to fit the whole camera preview. That will result in
  // container not being filled all the way and that will result in border radius not visible
  // so we need to scale it up a bit to always fill the whole container.
  flex: 1,
}

function ScanClubQrCodeScreen(): JSX.Element {
  const {t} = useTranslation()
  const {top, bottom} = useSafeAreaInsets()
  const {height} = useWindowDimensions()
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const handleCameraPermissions = useSetAtom(handleCameraPermissionsActionAtom)

  useEffect(() => {
    void (async () => {
      await Effect.runPromise(handleCameraPermissions()).then((result) => {
        setPermissionsGranted(result === 'granted')
      })
    })()
  }, [handleCameraPermissions])

  return (
    <Stack f={1}>
      <YStack f={1} pos="relative">
        <Header pos="absolute" t={top} l={10} zIndex="$10" />
        <Text
          pos="absolute"
          top={height * 0.2}
          als="center"
          textAlign="center"
          maw="80%"
          ff="$heading"
          fos={24}
          col="$white"
          zIndex="$10"
        >
          {t('clubs.scanCodeAndJoinVexlClub')}
        </Text>
        <YStack l={10} r={10} pos="absolute" b={bottom} gap="$2" zi="$10">
          <Button
            variant="secondary"
            text={t('clubs.enterClubAccessCode')}
            onPress={() => {}}
          />
          <Button
            variant="primary"
            text={t('clubs.uploadFromDevice')}
            onPress={() => {}}
          />
        </YStack>
        {!!permissionsGranted && (
          <Stack
            flex={1}
            borderRadius="$4"
            overflow="hidden"
            position="relative"
          >
            <CameraView style={scannerStyle} onBarcodeScanned={() => {}} />
          </Stack>
        )}
        <Svg
          width="100%"
          height="100%"
          fill="none"
          style={{
            position: 'absolute',
            paddingHorizontal: getTokens().space[2].val,
            zIndex: getTokens().zIndex[1].val,
          }}
        >
          <Mask id="mask">
            <Rect width="100%" height="100%" fill="white" />
            <Rect
              x="10%"
              y="30%"
              width="80%"
              height="40%"
              rx="30"
              fill="black"
            />
          </Mask>
          <Rect
            width="100%"
            height="100%"
            fill="rgba(16, 16, 16, 0.9)"
            mask="url(#mask)"
          />
          <Rect
            x="10%"
            y="30%"
            width="80%"
            height="40%"
            rx="30"
            stroke="#FCCD6C"
            strokeWidth="4"
            fill="none"
          />
        </Svg>
      </YStack>
    </Stack>
  )
}

export default ScanClubQrCodeScreen
