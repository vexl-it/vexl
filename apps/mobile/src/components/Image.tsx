import {
  Image as RNImage,
  type ImageProps as RNImageProps,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from 'react-native'
import {SvgXml, type XmlProps} from 'react-native-svg'
import {SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {type SvgStringOrImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'

export function isSvgString(something: unknown): something is SvgString {
  return SvgString.safeParse(something).success
}

export function stringToSvgStringRuntimeError(s: string): SvgString {
  const parse = SvgString.safeParse({xml: s})
  if (parse.success) {
    return parse.data
  }
  throw Error(
    `Trying to convert string to SvgString but string is not valid SvgString. String: ${s}`
  )
}

type Props = (RNImageProps | (Omit<XmlProps, 'xml'> & {source: SvgString})) & {
  grayScale?: boolean
}
export default function Image({source, ...props}: Props): JSX.Element {
  if (isSvgString(source)) {
    const xmlProps = props as XmlProps
    return <SvgXml {...xmlProps} xml={source.xml} />
  }
  const imageProps = props as RNImageProps
  return <RNImage {...imageProps} source={source} />
}

export type ImageUniversalSourcePropType =
  | SvgStringOrImageUri
  | {type: 'requiredImage'; image: ImageSourcePropType}

interface ImageUniversalProps {
  source: ImageUniversalSourcePropType
  width?: number
  height?: number
  style?: StyleProp<ImageStyle>
}

// TODO remove Image and use this one
export function ImageUniversal({
  source,
  ...rest
}: ImageUniversalProps): JSX.Element {
  if (source.type === 'svgXml') {
    return <SvgXml {...rest} xml={source.svgXml.xml} />
  } else if (source.type === 'imageUri') {
    return <RNImage {...rest} source={{uri: source.imageUri}} />
  } else {
    return <RNImage {...rest} source={source.image} />
  }
}

export type ImageProps = Props
