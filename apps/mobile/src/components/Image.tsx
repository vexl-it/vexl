import {Image as RNImage, type ImageProps as RNImageProps} from 'react-native'
import {SvgXml, type XmlProps} from 'react-native-svg'
import {SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'

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

type Props = RNImageProps | (Omit<XmlProps, 'xml'> & {source: SvgString})

export default function Image({source, ...props}: Props): JSX.Element {
  if (isSvgString(source)) {
    const xmlProps = props as XmlProps
    return <SvgXml {...xmlProps} xml={source.xml} />
  }
  const imageProps = props as RNImageProps
  return <RNImage {...imageProps} source={source} />
}

export type ImageProps = Props
