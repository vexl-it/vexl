import {Schema} from 'effect'
import {SvgString} from './SvgString.brand'
import {UriString} from './UriString.brand'

export const SvgStringOrImageUri = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('imageUri'),
    imageUri: UriString,
  }),
  Schema.Struct({
    type: Schema.Literal('svgXml'),
    svgXml: SvgString,
  })
)
export type SvgStringOrImageUri = typeof SvgStringOrImageUri.Type

export function fromImageUri(imageUri: UriString): SvgStringOrImageUri {
  return Schema.decodeSync(SvgStringOrImageUri)({
    type: 'imageUri',
    imageUri,
  })
}

export function fromBase64Uri(base64: string): SvgStringOrImageUri {
  return Schema.decodeSync(SvgStringOrImageUri)({
    type: 'imageUri',
    imageUri: base64,
  })
}

export function fromSvgString(svgString: SvgString): SvgStringOrImageUri {
  return Schema.decodeSync(SvgStringOrImageUri)({
    type: 'svgXml',
    svgXml: svgString,
  })
}
