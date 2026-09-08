import {Context, Effect, flow, Layer, Option, type Config} from 'effect'

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
  reportContactsImported: () => Effect.Effect<void>
}

export class DashboardReportsService extends Context.Service<
  DashboardReportsService,
  DashboardReportsOperations
>()('DashboardReportsService') {
  static readonly make = ({
    newUserHookOption,
    contactsImportedHookConfig,
  }: {
    newUserHookOption: Config.Config<Option.Option<string>>
    contactsImportedHookConfig: Config.Config<Option.Option<string>>
  }): Layer.Layer<DashboardReportsService, Config.ConfigError, never> =>
    Layer.effect(
      DashboardReportsService,
      Effect.gen(function* () {
        const dashboardNewUserHookOption = yield* newUserHookOption
        const contactsImportedHookOption = yield* contactsImportedHookConfig

        const reportNewUserCreated = Option.match(dashboardNewUserHookOption, {
          onSome: (hookUrl) =>
            callWebhookPost(hookUrl).pipe(
              flow(
                Effect.tapError((e) =>
                  Effect.logWarning('Error reporting new user to dashboard', e)
                ),
                Effect.tap(() => Effect.log('Reported new user to dashboard'))
              ),
              Effect.withSpan('reportNewUserToDashboard'),
              // Forked to not block the response fiber
              Effect.forkDetach,
              Effect.ignore
            ),
          onNone: () =>
            Effect.log('No dashboard hook set in. Not reporting to dashboard'),
        })

        const reportContactsImported = Option.match(
          contactsImportedHookOption,
          {
            onSome: (hookUrl) =>
              callWebhookPost(hookUrl).pipe(
                flow(
                  Effect.tapError((e) =>
                    Effect.logWarning(
                      'Error reporting contacts imported to dashboard',
                      e
                    )
                  ),
                  Effect.tap(() => Effect.log('Reported contacts Imported'))
                ),
                Effect.withSpan('reportContatsImportedToDashboard'),
                // Forked to not block the response fiber
                Effect.forkDetach,
                Effect.ignore
              ),
            onNone: () =>
              Effect.log(
                'No dashboard hook set in. Not reporting to dashboard'
              ),
          }
        )

        return {
          reportNewUserCreated: () => reportNewUserCreated,
          reportContactsImported: () => reportContactsImported,
        }
      })
    )
}
