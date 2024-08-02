import {z} from 'zod'

export const SvgString = z
  .object({
    xml: z.string().min(1),
  })
  .brand<'SvgString'>()
  .readonly()

export type SvgString = z.TypeOf<typeof SvgString>
