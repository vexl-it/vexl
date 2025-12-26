import {Schema} from 'effect/index'

export const Width = Schema.Number.pipe(Schema.brand('WidthDimension'))
export type Width = typeof Width.Type

export const Height = Schema.Number.pipe(Schema.brand('HeightDimension'))
export type Height = typeof Height.Type

export const Dimensions = Schema.Struct({
  width: Width,
  height: Height,
})
export type Dimensions = typeof Dimensions.Type
