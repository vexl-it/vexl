import {UriString} from './UriString.brand'
import {SvgString} from './SvgString.brand'
import {z} from 'zod'

export const SvgStringOrImageUri = z
  .custom<
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
  .brand<'SvgStringOrImageUri'>()
export type SvgStringOrImageUri = z.TypeOf<typeof SvgStringOrImageUri>

export function fromImageUri(imageUri: UriString): SvgStringOrImageUri {
  return SvgStringOrImageUri.parse({
    type: 'imageUri',
    imageUri,
  })
}

export function fromSvgString(svgString: SvgString): SvgStringOrImageUri {
  return SvgStringOrImageUri.parse({
    type: 'svgXml',
    svgXml: svgString,
  })
}
