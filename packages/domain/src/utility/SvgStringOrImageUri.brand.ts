import {Schema} from 'effect'
import {z} from 'zod'
import {SvgString, SvgStringE} from './SvgString.brand'
import {UriString, UriStringE} from './UriString.brand'

export const SvgStringOrImageUri = z.custom<
  | {
      type: 'imageUri'
      imageUri: UriString
    }
  | {
      type: 'svgXml'
      svgXml: SvgString
    }
>((value: any) => {
  if (!value) return
  if (value.type === 'imageUri') {
    return UriString.safeParse(value.imageUri)
  } else if (value.type === 'svgXml') {
    return SvgString.safeParse(value.xvgXml)
  }
  return false
})

export const SvgStringOrImageUriE = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('imageUri'),
    imageUri: UriStringE,
  }),
  Schema.Struct({
    type: Schema.Literal('svgXml'),
    svgXml: SvgStringE,
  })
)
export type SvgStringOrImageUri = typeof SvgStringOrImageUriE.Type

export function fromImageUri(imageUri: UriString): SvgStringOrImageUri {
  return SvgStringOrImageUri.parse({
    type: 'imageUri',
    imageUri,
  })
}

export function fromBase64Uri(base64: string): SvgStringOrImageUri {
  return SvgStringOrImageUri.parse({
    type: 'imageUri',
    imageUri: base64,
  })
}

export function fromSvgString(svgString: SvgString): SvgStringOrImageUri {
  return SvgStringOrImageUri.parse({
    type: 'svgXml',
    svgXml: svgString,
  })
}
