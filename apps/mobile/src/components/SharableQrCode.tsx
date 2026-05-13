import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {File, Paths} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'
import React, {useCallback, useImperativeHandle, useRef} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import SvgQRCode from 'react-native-qrcode-svg'
import {Stack} from 'tamagui'

export interface SharableQrCodeHandle {
  readonly generateBase64File: () => void
}

interface SvgQRCodeRef {
  readonly toDataURL: (callback: (url: string) => void) => void
}

const saveAndShareBase64Strig = async (base64String: string): Promise<void> => {
  const cacheDirectory = Paths.cache
  if (!cacheDirectory) return

  const file = new File(cacheDirectory, `${generateUuid()}.png`)
  file.write(base64String, {encoding: 'base64'})
  await shareAsync(file.uri)
}

function SharableQrCodeComponent(
  props: Omit<React.ComponentProps<typeof SvgQRCode>, 'getRef'>,
  ref: React.ForwardedRef<SharableQrCodeHandle>
): React.ReactElement {
  const svgRef = useRef<SvgQRCodeRef | null>(null)

  // This really does not matter if it fails. It's a nice feature to have
  // but not really worth the edgecase refining
  const generateBase64File = useCallback(() => {
    if (!svgRef.current) return // If it fails it fails IDK...
    try {
      svgRef.current.toDataURL((url: string) => {
        try {
          const base64Image = url.replace(/(\r\n|\n|\r)/gm, '')
          void saveAndShareBase64Strig(base64Image).catch(() => {
            //  🤷‍♂️
          })
        } catch (e) {
          //  🤷‍♂️
        }
      })
    } catch (e) {
      //  🤷‍♂️
    }
  }, [])

  useImperativeHandle(ref, () => ({generateBase64File}), [generateBase64File])

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        generateBase64File()
      }}
    >
      <Stack>
        <SvgQRCode {...props} getRef={(c) => (svgRef.current = c)} />
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export const SharableQrCode = React.forwardRef(SharableQrCodeComponent)
