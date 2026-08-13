import * as Sentry from '@sentry/nextjs'
import {scrubSensitiveDataInPlace} from '@vexl-next/generic-utils/src/scrubSensitiveData'

export function register(): void {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      release: process.env.SERVICE_VERSION,
      sendDefaultPii: false,
      beforeBreadcrumb: () => null,
      beforeSend: (event) => {
        scrubSensitiveDataInPlace(event)
        return event
      },
    })
  }
}

export const onRequestError = Sentry.captureRequestError
