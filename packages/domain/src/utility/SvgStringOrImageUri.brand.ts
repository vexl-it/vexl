import {z} from 'zod'
import {SvgString} from './SvgString.brand'
import {UriString} from './UriString.brand'

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
export type SvgStringOrImageUri = z.TypeOf<typeof SvgStringOrImageUri>

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
