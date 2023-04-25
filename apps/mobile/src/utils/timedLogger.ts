export default function timedLogger(tag: string): (s: string) => void {
  const now = Date.now()
  let latest = now
  console.log(`Starting: ${tag}`)

  return (message: string = '') => {
    const totalDelta = Date.now() - now
    const latestDelta = Date.now() - latest
    latest = Date.now()
    console.log(
      `running: ${tag} - ${message} - total time: ${
        totalDelta / 1000
      }ms. From last checkpoint: ${latestDelta / 1000}ms`
    )
  }
}
