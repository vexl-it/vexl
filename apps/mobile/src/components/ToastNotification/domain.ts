import {
  SvgString,
  SvgStringE,
} from '@vexl-next/domain/src/utility/SvgString.brand'
import {Schema} from 'effect'
import {z} from 'zod'

export const ToastNotificationState = z
  .object({
    visible: z.boolean(),
    text: z.string().optional(),
    icon: SvgString.optional(),
    iconFill: z.string().optional(),
    hideAfterMillis: z.number().optional(),
    showCloseButton: z.boolean().optional(),
    position: z.enum(['top', 'bottom']).optional(),
    bottomMargin: z.number().optional(),
    topMargin: z.number().optional(),
  })
  .readonly()

export const ToastNotificationStateE = Schema.Struct({
  visible: Schema.Boolean,
  text: Schema.optional(Schema.String),
  icon: Schema.optional(SvgStringE),
  iconFill: Schema.optional(Schema.String),
  hideAfterMillis: Schema.optional(Schema.Number),
  showCloseButton: Schema.optional(Schema.Boolean),
  position: Schema.optional(Schema.Literal('top', 'bottom')),
  bottomMargin: Schema.optional(Schema.Number),
  topMargin: Schema.optional(Schema.Number),
})

export type ToastNotificationState = Schema.Schema.Type<
  typeof ToastNotificationStateE
>
