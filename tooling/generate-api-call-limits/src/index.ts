import {HttpApi} from '@effect/platform/index'
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
import {Context, Effect, Option, Schema} from 'effect/index'
import {toEntries} from 'effect/Record'

type Apis = Record<string, HttpApi.HttpApi<any, any, any, any>>
const apis: Apis = {
  btcEchangeRate: BtcExchangeRateApiSpecification,
  contact: ContactApiSpecification,
  content: ContentApiSpecification,
  feedback: FeedbackApiSpecification,
  chat: ChatApiSpecification,
  location: LocationApiSpecification,
  metrics: MetricsApiSpecification,
  notification: NotificationApiSpecification,
  offer: OfferApiSpecification,
  user: UserApiSpecification,
}

const Row = Schema.Struct({
  service: Schema.String,
  method: Schema.String,
  url: Schema.String,
  maxExpectedDailyCount: Schema.Number,
})
type Row = typeof Row.Type

const extractMaxSpecifiedDailyCountsFromApis = Effect.gen(function* (_) {
  const resultsRows: Row[] = []
  const specifiedEndpoints: string[] = []
  const notSpecifiedEndpoints: string[] = []

  const entries = toEntries(apis)
  for (const [serviceName, apiSpecification] of entries) {
    HttpApi.reflect(apiSpecification, {
      onGroup: () => {
        // nothig
      },
      onEndpoint: ({endpoint}) => {
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
      },
    })
  }

  yield* _(
    Effect.logDebug(
      `Got MaxExpectedDailyCounts for ${specifiedEndpoints.length} endpoints`
    )
  )
  yield* _(
    Effect.logDebug(
      `Missing MaxSpecifiedDailyCounts for ${notSpecifiedEndpoints.length} endpoints`
    )
  )

  return {resultsRows, specifiedEndpoints, notSpecifiedEndpoints}
})

export const getResultsJson = extractMaxSpecifiedDailyCountsFromApis.pipe(
  Effect.map(({resultsRows}) => resultsRows),
  Effect.flatMap(Schema.encode(Schema.parseJson(Schema.Array(Row)))),
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
      Effect.gen(function* (_) {
        if (notSpecifiedEndpoints.length === 0) {
          yield* _(
            Effect.log(
              `Specified all ${specifiedEndpoints.length} endpoints. All good!`
            )
          )
          return
        }

        yield* _(
          Effect.logError(
            'The following endpoints are missing MaxExpectedDailyCall annotations:',
            notSpecifiedEndpoints
          )
        )
        yield* _(
          Effect.die(
            'Some endpoints are missing MaxExpectedDailyCall annotations'
          )
        )
      })
    )
  )
