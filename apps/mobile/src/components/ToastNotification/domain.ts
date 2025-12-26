import {SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {Schema} from 'effect'

export const ToastNotificationState = Schema.Struct({
  visible: Schema.Boolean,
  text: Schema.optional(Schema.String),
  icon: Schema.optional(SvgString),
  iconFill: Schema.optional(Schema.String),
  hideAfterMillis: Schema.optional(Schema.Number),
  showCloseButton: Schema.optional(Schema.Boolean),
  position: Schema.optional(Schema.Literal('top', 'bottom')),
  bottomMargin: Schema.optional(Schema.Number),
  topMargin: Schema.optional(Schema.Number),
})

export type ToastNotificationState = typeof ToastNotificationState.Type
