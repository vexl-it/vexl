/**
 * Runs work when the React Native scheduler is idle while a JS timer enforces
 * the maximum wait. React Native 0.86 does not forward the timeout option from
 * `requestIdleCallback` to its native scheduler, so the timer is required for
 * the bound to hold.
 */
export default function runWhenIdleWithTimeout(
  callback: () => void,
  {timeout}: {readonly timeout: number}
): void {
  let hasRun = false

  const runOnce = (): void => {
    if (hasRun) return

    hasRun = true
    callback()
  }

  const idleCallbackHandle = requestIdleCallback(() => {
    clearTimeout(timeoutHandle)
    runOnce()
  })

  const timeoutHandle = setTimeout(() => {
    cancelIdleCallback(idleCallbackHandle)
    runOnce()
  }, timeout)
}
