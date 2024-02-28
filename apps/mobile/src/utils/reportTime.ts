import {startInactiveSpan} from '@sentry/react-native'

const numberFormatIntl = new Intl.NumberFormat('cs', {})

export function startMeasure(
  name: string
): (millisec?: boolean, text?: string) => string {
  const start = Date.now()
  // TODO #728 use active spans to track errors in spans
  // https://docs.sentry.io/platforms/react-native/performance/instrumentation/custom-instrumentation/?original_referrer=https%3A%2F%2Fwww.google.com%2F#adding-span-operations
  const span = startInactiveSpan({name})

  return (millisec, text) => {
    const end = Date.now()
    span?.finish(end)

    const prettyDuration = numberFormatIntl.format(
      millisec ? end - start : (end - start) / 1000
    )

    console.log(
      `⌛️ Measuring: ${name}. ${
        text ? `${text} - ` : ''
      }Took: ${prettyDuration} ${millisec ? 'milisec' : 'sec'}`
    )

    return prettyDuration
  }
}
