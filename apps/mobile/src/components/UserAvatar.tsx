import {type SvgStringOrImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import Image from './Image'
import {
  Canvas,
  Group,
  Image as SkiaImage,
  ImageSVG,
  Skia,
  BackdropFilter,
  ColorMatrix,
  rect,
  rrect,
  useImage,
} from '@shopify/react-native-skia'
import {Grayscale} from 'react-native-color-matrix-image-filters'
import {useMemo} from 'react'

interface Props {
  userImage: SvgStringOrImageUri
  grayScale?: boolean
  width: number
  height: number
}

const BLACK_AND_WHITE = [
  0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0,
]

// TODO move grayScale images to a separate component
function UserAvatar({userImage, grayScale, width, height}: Props): JSX.Element {
  const image = useImage(
    userImage.type === 'imageUri' ? userImage.imageUri : null
  )
  const roundedRect = useMemo(
    () => rrect(rect(0, 0, width, height), 12, 12),
    [height, width]
  )
  if (userImage.type === 'svgXml') {
    if (grayScale) {
      const svg = Skia.SVG.MakeFromString(userImage.svgXml.xml)

      return (
        <Canvas style={{width, height}}>
          {svg && (
            <ImageSVG svg={svg} x={0} y={0} height={height} width={width} />
          )}
          <BackdropFilter filter={<ColorMatrix matrix={BLACK_AND_WHITE} />} />
        </Canvas>
      )
    } else {
      return <Image width={width} height={height} source={userImage.svgXml} />
    }
  } else {
    if (grayScale) {
      return (
        <Grayscale>
          <Canvas style={{width, height}}>
            {image && (
              <SkiaImage
                fit={'cover'}
                x={0}
                y={0}
                width={width}
                height={height}
                image={image}
              />
            )}
          </Canvas>
        </Grayscale>
      )
    } else {
      return (
        <Canvas style={{width, height}}>
          <Group clip={roundedRect}>
            {image && (
              <SkiaImage
                fit={'cover'}
                x={0}
                y={0}
                width={width}
                height={height}
                image={image}
              />
            )}
          </Group>
        </Canvas>
      )
    }
  }
}

export default UserAvatar
