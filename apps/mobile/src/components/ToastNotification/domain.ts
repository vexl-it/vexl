import {Schema} from '@effect/schema'
import {
  SvgString,
  SvgStringE,
} from '@vexl-next/domain/src/utility/SvgString.brand'
import {z} from 'zod'

export const ToastNotificationState = z
  .object({
    text: z.string(),
    icon: SvgString.optional(),
    iconFill: z.string().optional(),
    hideAfterMillis: z.number().optional(),
    showCloseButton: z.boolean().optional(),
    position: z.enum(['top', 'bottom']).optional(),
  })
  .readonly()

export const ToastNotificationStateE = Schema.Struct({
  text: Schema.String,
  icon: Schema.optional(SvgStringE),
  iconFill: Schema.optional(Schema.String),
  hideAfterMillis: Schema.optional(Schema.Number),
  showCloseButton: Schema.optional(Schema.Boolean),
  position: Schema.optional(Schema.Literal('top', 'bottom')),
})

export type ToastNotificationState = Schema.Schema.Type<
  typeof ToastNotificationStateE
>
