import {
  BackdropFilter,
  Canvas,
  ColorMatrix,
  Group,
  ImageSVG,
  Skia,
  Image as SkiaImage,
  rect,
  rrect,
  useImage,
} from '@shopify/react-native-skia'
import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {useMemo} from 'react'
import resolveLocalUri from '../utils/resolveLocalUri'
import Image from './Image'

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
    userImage.type === 'imageUri' ? resolveLocalUri(userImage.imageUri) : null
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
    return (
      <Canvas style={{width, height}}>
        <Group clip={roundedRect}>
          {image && (
            <SkiaImage
              fit="cover"
              x={0}
              y={0}
              width={width}
              height={height}
              image={image}
            />
          )}
        </Group>
        {grayScale && (
          <BackdropFilter filter={<ColorMatrix matrix={BLACK_AND_WHITE} />} />
        )}
      </Canvas>
    )
  }
}

export default UserAvatar
