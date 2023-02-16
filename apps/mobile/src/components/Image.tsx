import {Image as RNImage, type ImageProps as RNImageProps} from 'react-native'
import {SvgXml, type XmlProps} from 'react-native-svg'
import {SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'

// Todo proper branded type

export function isSvgString(something: unknown): something is SvgString {
  return SvgString.safeParse(something).success
}

export function stringToSvgString(s: string): SvgString {
  // todo should I handle errors?
  return SvgString.parse({xml: s})
}

type Props = RNImageProps | (Omit<XmlProps, 'xml'> & {source: SvgString})

export default function Image({source, ...props}: Props): JSX.Element {
  if (isSvgString(source)) {
    const xmlProps = props as XmlProps
    return <SvgXml {...xmlProps} xml={source.xml} />
  }
  const imageProps = props as RNImageProps
  return <RNImage source={source} {...imageProps} />
}

export type ImageProps = Props
