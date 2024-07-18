import {Context, Effect, Layer, Option} from 'effect'
import {dashboardNewUserHookConfig} from '../../../configs'

const callWebhookPost = (url: string): Effect.Effect<void, Error> =>
  Effect.tryPromise({
    try: async () => {
      await fetch(url, {
        method: 'POST',
      })
    },
    catch: (e) =>
      new Error(`Error calling dashboard webhook: ${url}`, {cause: e}),
  })

export interface DashboardReportsOperations {
  reportNewUserCreated: () => Effect.Effect<void>
}

export class DashboardReportsService extends Context.Tag(
  'DashboardReportsService'
)<DashboardReportsService, DashboardReportsOperations>() {
  static readonly Live = Layer.effect(
    DashboardReportsService,
    Effect.gen(function* (_) {
      const dashboardNewUserHookOption = yield* _(dashboardNewUserHookConfig)
      if (Option.isNone(dashboardNewUserHookOption)) {
        return {
          reportNewUserCreated: () =>
            Effect.log(`No dashboard hook set in. Not reporting to dashboard`),
        }
      }

      const dashboardNewUserHook = dashboardNewUserHookOption.value

      return {
        reportNewUserCreated: () =>
          callWebhookPost(dashboardNewUserHook).pipe(
            Effect.tapBoth({
              onSuccess: () => Effect.log('Reported new user to dashboard'),
              onFailure: (e) =>
                Effect.logWarning('Error reporting new user to dashboard', e),
            }),
            Effect.withSpan('reportNewUserToDashboard'),
            // Forked to not block the response fiber
            Effect.forkDaemon,
            Effect.ignore
          ),
      }
    })
  )
}
