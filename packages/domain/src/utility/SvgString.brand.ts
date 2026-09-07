import {Schema} from 'effect'

export const SvgString = Schema.Struct({
  xml: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
}).pipe(Schema.brand('SvgString'))

export type SvgString = typeof SvgString.Type
