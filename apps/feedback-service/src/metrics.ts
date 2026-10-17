import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type CommonMetricAttributes} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {type Effect} from 'effect'

const TRADE_FEEDBACK_SUBMITTED = 'TRADE_FEEDBACK_SUBMITTED'

export const reportTradeFeedbackSubmitted = ({
  positive,
  commonMetricAttributes,
}: {
  positive: boolean
  commonMetricAttributes: CommonMetricAttributes
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: TRADE_FEEDBACK_SUBMITTED,
      attributes: {...commonMetricAttributes, positive},
    })
  )
