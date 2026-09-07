import {MaxExpectedDailyCall} from '@vexl-next/rest-api/src/MaxExpectedDailyCountAnnotation'
import {BtcExchangeRateApiSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {FeedbackApiSpecification} from '@vexl-next/rest-api/src/services/feedback/specification'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {Context, Effect, Option, Schema} from 'effect'
import {toEntries} from 'effect/Record'
import {
  HttpApi,
  type HttpApiEndpoint,
  type HttpApiGroup,
} from 'effect/unstable/httpapi'

const getEndpoints = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  api: HttpApi.HttpApi<Id, Groups>
): HttpApiEndpoint.Top[] => {
  const endpoints: HttpApiEndpoint.Top[] = []
  HttpApi.reflect(api, {
    onGroup: () => {},
    onEndpoint: ({endpoint}) => {
      endpoints.push(endpoint)
    },
  })
  return endpoints
}

const apis = {
  btcEchangeRate: getEndpoints(BtcExchangeRateApiSpecification),
  contact: getEndpoints(ContactApiSpecification),
  content: getEndpoints(ContentApiSpecification),
  feedback: getEndpoints(FeedbackApiSpecification),
  chat: getEndpoints(ChatApiSpecification),
  location: getEndpoints(LocationApiSpecification),
  metrics: getEndpoints(MetricsApiSpecification),
  notification: getEndpoints(NotificationApiSpecification),
  offer: getEndpoints(OfferApiSpecification),
  user: getEndpoints(UserApiSpecification),
}

const Row = Schema.Struct({
  service: Schema.String,
  method: Schema.String,
  url: Schema.String,
  maxExpectedDailyCount: Schema.Number,
})
type Row = typeof Row.Type

const extractMaxSpecifiedDailyCountsFromApis = Effect.gen(function* () {
  const resultsRows: Row[] = []
  const specifiedEndpoints: string[] = []
  const notSpecifiedEndpoints: string[] = []

  const entries = toEntries(apis)
  for (const [serviceName, endpoints] of entries) {
    for (const endpoint of endpoints) {
      const url = endpoint.path
      const method = endpoint.method
      const maxExpectedDailyCount = Context.getOption(
        endpoint.annotations,
        MaxExpectedDailyCall
      )

      if (Option.isSome(maxExpectedDailyCount)) {
        resultsRows.push({
          service: serviceName,
          method,
          url,
          maxExpectedDailyCount: maxExpectedDailyCount.value,
        })
        specifiedEndpoints.push(`${serviceName} ${method} ${url}`)
      } else {
        notSpecifiedEndpoints.push(`${serviceName} ${method} ${url}`)
      }
    }
  }

  yield* Effect.logDebug(
    `Got MaxExpectedDailyCounts for ${specifiedEndpoints.length} endpoints`
  )
  yield* Effect.logDebug(
    `Missing MaxSpecifiedDailyCounts for ${notSpecifiedEndpoints.length} endpoints`
  )

  return {resultsRows, specifiedEndpoints, notSpecifiedEndpoints}
})

export const getResultsJson = extractMaxSpecifiedDailyCountsFromApis.pipe(
  Effect.map(({resultsRows}) => resultsRows),
  Effect.flatMap(Schema.encodeEffect(Schema.fromJsonString(Schema.Array(Row)))),
  Effect.flatMap(Effect.log)
)

export const getResultsCsv = extractMaxSpecifiedDailyCountsFromApis.pipe(
  Effect.map(({resultsRows}) => resultsRows),
  Effect.map((rows) => {
    const header = 'service,method,url,maxExpectedDailyCount'
    const csvLines = rows.map(
      (row) =>
        `${row.service},${row.method},${row.url},${row.maxExpectedDailyCount}`
    )
    return [header, ...csvLines].join('\n')
  }),
  Effect.flatMap((a) => Effect.log(a))
)

export const checkForMissingAnnotations =
  extractMaxSpecifiedDailyCountsFromApis.pipe(
    Effect.flatMap(({notSpecifiedEndpoints, specifiedEndpoints}) =>
      Effect.gen(function* () {
        if (notSpecifiedEndpoints.length === 0) {
          yield* Effect.log(
            `Specified all ${specifiedEndpoints.length} endpoints. All good!`
          )
          return
        }

        yield* Effect.logError(
          'The following endpoints are missing MaxExpectedDailyCall annotations:',
          notSpecifiedEndpoints
        )
        yield* Effect.die(
          'Some endpoints are missing MaxExpectedDailyCall annotations'
        )
      })
    )
  )
