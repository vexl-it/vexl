const numberFormatIntl = new Intl.NumberFormat('cs', {})

export function startMeasure(name: string): () => string {
  const start = Date.now()

  return () => {
    const end = Date.now()
    // TODO log to server?

    const prettyDuration = numberFormatIntl.format((end - start) / 1000)

    console.log(`⌛️ Measuring: ${name}. Took: ${prettyDuration}sec`)

    return prettyDuration
  }
}
