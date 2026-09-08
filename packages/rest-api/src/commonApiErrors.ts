import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {HttpApiSchema} from 'effect/unstable/httpapi'

export const commonApiErrors = [
  NotFoundError.pipe(HttpApiSchema.status(404)),
  UnexpectedServerError.pipe(HttpApiSchema.status(500)),
]
