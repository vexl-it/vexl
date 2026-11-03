import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Stack, type QrCodeSvgRef} from '@vexl-next/ui'
import {File, Paths} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'
import React, {useCallback, useRef} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import SvgQRCode from 'react-native-qrcode-svg'

const saveAndShareBase64Strig = async (base64String: string): Promise<void> => {
  const cacheDirectory = Paths.cache
  if (!cacheDirectory) return

  const file = new File(cacheDirectory, `${generateUuid()}.png`)
  file.write(base64String, {encoding: 'base64'})
  await shareAsync(file.uri)
}

export function useQrCodeSharing(): {
  readonly getRef: (ref: QrCodeSvgRef | null) => void
  readonly share: () => void
} {
  const svgRef = useRef<QrCodeSvgRef | null>(null)

  const getRef = useCallback((ref: QrCodeSvgRef | null) => {
    svgRef.current = ref
  }, [])

  // This really does not matter if it fails. It's a nice feature to have
  // but not really worth the edgecase refining
  const share = useCallback(() => {
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

  return {getRef, share}
}

export function SharableQrCode(
  props: Omit<React.ComponentProps<typeof SvgQRCode>, 'getRef'>
): React.ReactElement {
  const {getRef, share} = useQrCodeSharing()

  return (
    <TouchableWithoutFeedback onPress={share}>
      <Stack>
        <SvgQRCode {...props} getRef={getRef} />
      </Stack>
    </TouchableWithoutFeedback>
  )
}
