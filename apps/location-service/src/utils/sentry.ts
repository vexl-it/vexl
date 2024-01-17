import * as Sentry from '@sentry/node'
import {ProfilingIntegration} from '@sentry/profiling-node'
import {HTTPException} from 'hono/http-exception'
import {type Hono} from 'hono'
import env from '../environment'

Sentry.init({
  dsn: env.SENTRY_DNS,
  environment: env.ENVIRONMENT,
  integrations: [new ProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})

declare module 'hono' {
  interface ContextVariableMap {
    sentry: Sentry.Scope
  }
}

export function registerSetryMiddleware(app: Hono): void {
  app.use('*', async (c, next) => {
    await Sentry.runWithAsyncContext(async () => {
      const scope = Sentry.getCurrentScope()
      scope.addEventProcessor((event) =>
        Sentry.addRequestDataToEvent(
          event,
          {
            method: c.req.method,
            url: c.req.url,
          },
          {
            include: {
              user: false,
            },
          }
        )
      )
      c.set('sentry', scope)
      await next()
    })
  })

  app.onError((err, c) => {
    console.error('Error', err)
    c.get('sentry').captureException(err)

    if (err instanceof HTTPException) {
      // Get the custom response
      return err.getResponse()
    }
    return c.json({message: 'server error'}, 500)
  })
}
