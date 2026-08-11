import * as Sentry from '@sentry/nextjs'
import {scrubSensitiveDataInPlace} from '@vexl-next/generic-utils/src/scrubSensitiveData'

export async function register() {
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

  const {registerNode} = await import('./instrumentation.node')
  await registerNode()
}

export const onRequestError = Sentry.captureRequestError
