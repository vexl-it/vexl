import {SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {
  Image as RNImage,
  type ImageSourcePropType,
  type ImageStyle,
  type ImageProps as RNImageProps,
  type StyleProp,
} from 'react-native'
import {SvgXml, type XmlProps} from 'react-native-svg'

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
    // @ts-expect-error for some reasons onClick is passed and causes crash
    const {onClick, ...xmlProps} = props as XmlProps
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
