import {type SvgStringOrImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import Image from './Image'
import {
  Canvas,
  ImageSVG,
  Skia,
  BackdropFilter,
  ColorMatrix,
} from '@shopify/react-native-skia'
import {Grayscale} from 'react-native-color-matrix-image-filters'

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
          <Image style={{width, height}} source={{uri: userImage.imageUri}} />
        </Grayscale>
      )
    } else {
      return (
        <Image style={{width, height}} source={{uri: userImage.imageUri}} />
      )
    }
  }
}

export default UserAvatar
