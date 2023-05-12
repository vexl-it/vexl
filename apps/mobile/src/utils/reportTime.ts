const numberFormatIntl = new Intl.NumberFormat('cs', {})

export function startMeasure(name: string): () => void {
  const start = Date.now()

  return () => {
    const end = Date.now()
    // TODO log to server?
    console.log(
      `⌛️ Measuring: ${name}. Took: ${numberFormatIntl.format(
        (end - start) / 1000
      )}sec`
    )
  }
}
