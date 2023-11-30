const numberFormatIntl = new Intl.NumberFormat('cs', {})

export function startMeasure(name: string): (millisec?: boolean) => string {
  const start = Date.now()

  return (millisec) => {
    const end = Date.now()
    // TODO log to server?

    const prettyDuration = numberFormatIntl.format(
      millisec ? end - start : (end - start) / 1000
    )

    console.log(
      `⌛️ Measuring: ${name}. Took: ${prettyDuration} ${
        millisec ? 'milisec' : 'sec'
      }`
    )

    return prettyDuration
  }
}
