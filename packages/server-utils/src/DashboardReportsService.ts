import {
  type Config,
  type ConfigError,
  Context,
  Effect,
  Layer,
  Option,
} from 'effect'

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

export class DashboardReportsService extends Context.Tag(
  'DashboardReportsService'
)<DashboardReportsService, DashboardReportsOperations>() {
  static readonly make = ({
    newUserHookOption,
    contactsImportedHookConfig,
  }: {
    newUserHookOption: Config.Config<Option.Option<string>>
    contactsImportedHookConfig: Config.Config<Option.Option<string>>
  }): Layer.Layer<DashboardReportsService, ConfigError.ConfigError, never> =>
    Layer.effect(
      DashboardReportsService,
      Effect.gen(function* (_) {
        const dashboardNewUserHookOption = yield* _(newUserHookOption)
        const contactsImportedHookOption = yield* _(contactsImportedHookConfig)

        const reportNewUserCreated = Option.match(dashboardNewUserHookOption, {
          onSome: (hookUrl) =>
            callWebhookPost(hookUrl).pipe(
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
          onNone: () =>
            Effect.log('No dashboard hook set in. Not reporting to dashboard'),
        })

        const reportContactsImported = Option.match(
          contactsImportedHookOption,
          {
            onSome: (hookUrl) =>
              callWebhookPost(hookUrl).pipe(
                Effect.tapBoth({
                  onSuccess: () => Effect.log('Reported contacts Imported'),
                  onFailure: (e) =>
                    Effect.logWarning(
                      'Error reporting contacts imported to dashboard',
                      e
                    ),
                }),
                Effect.withSpan('reportContatsImportedToDashboard'),
                // Forked to not block the response fiber
                Effect.forkDaemon,
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
