import {SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Option, Schema} from 'effect'
import React from 'react'
import {
  Image as RNImage,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from 'react-native'
import {SvgXml} from 'react-native-svg'

export function stringToSvgStringRuntimeError(s: string): SvgString {
  const parseResult = Schema.decodeUnknownOption(SvgString)({xml: s})
  if (Option.isSome(parseResult)) {
    return parseResult.value
  }
  throw Error(
    `Trying to convert string to SvgString but string is not valid SvgString. String: ${s}`
  )
}

export type ImageUniversalSourcePropType =
  | SvgStringOrImageUri
  | {type: 'requiredImage'; image: ImageSourcePropType}

export interface ImageUniversalProps {
  source: ImageUniversalSourcePropType
  width?: number
  height?: number
  style?: StyleProp<ImageStyle>
}

export function ImageUniversal({
  source,
  ...rest
}: ImageUniversalProps): React.ReactElement {
  if (source.type === 'svgXml') {
    return <SvgXml {...rest} xml={source.svgXml.xml} />
  } else if (source.type === 'imageUri') {
    return <RNImage {...rest} source={{uri: source.imageUri}} />
  } else {
    return <RNImage {...rest} source={source.image} />
  }
}
