import {SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {z} from 'zod'

export const ToastNotificationState = z.object({
  text: z.string(),
  icon: SvgString.optional(),
  iconFill: z.string().optional(),
  hideAfterMillis: z.number().optional(),
  showCloseButton: z.boolean().optional(),
})

export type ToastNotificationState = z.TypeOf<typeof ToastNotificationState>
