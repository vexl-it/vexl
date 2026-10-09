import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {DashboardInternalApiSpecification} from '@vexl-next/rest-api/src/services/dashboard/internalSpecification'
import {Context, Effect, Layer, Option, type ConfigError} from 'effect'
import {dashboardUpdatesUrlConfig} from './commonConfigs'

export interface DashboardReportsOperations {
  reportNewUserCreated: () => Effect.Effect<void>
  reportContactsImported: () => Effect.Effect<void>
}

const reportInBackground = (
  report: Effect.Effect<unknown, unknown>,
  name: string
): Effect.Effect<void> =>
  report.pipe(
    Effect.tapBoth({
      onSuccess: () => Effect.log(`Reported ${name} to dashboard`),
      onFailure: (e) =>
        Effect.logWarning(`Error reporting ${name} to dashboard`, e),
    }),
    Effect.withSpan(`reportToDashboard ${name}`),
    // Forked to not block the response fiber
    Effect.forkDaemon,
    Effect.ignore
  )

export class DashboardReportsService extends Context.Tag(
  'DashboardReportsService'
)<DashboardReportsService, DashboardReportsOperations>() {
  static readonly Live: Layer.Layer<
    DashboardReportsService,
    ConfigError.ConfigError
  > = Layer.effect(
    DashboardReportsService,
    Effect.gen(function* (_) {
      const dashboardUrl = yield* _(dashboardUpdatesUrlConfig)

      if (Option.isNone(dashboardUrl)) {
        const notReporting = Effect.log(
          'No dashboard url set. Not reporting to dashboard'
        )
        return {
          reportNewUserCreated: () => notReporting,
          reportContactsImported: () => notReporting,
        }
      }

      const client = yield* _(
        HttpApiClient.make(DashboardInternalApiSpecification, {
          baseUrl: dashboardUrl.value,
        }),
        Effect.provide(FetchHttpClient.layer)
      )

      return {
        reportNewUserCreated: () =>
          reportInBackground(client.Updates.reportNewUser(), 'new user'),
        reportContactsImported: () =>
          reportInBackground(
            client.Updates.reportNewConnections(),
            'contacts imported'
          ),
      }
    })
  )
}
