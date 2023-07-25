import {z} from 'zod'

export const Width = z.number().brand('WidthDimension')
export type Width = z.TypeOf<typeof Width>

export const Height = z.number().brand('HeightDimension')
export type Height = z.TypeOf<typeof Height>

export const Dimensions = z.object({
  width: Width,
  height: Height,
})
export type Dimensions = z.TypeOf<typeof Dimensions>
