import {useEffect, useState} from 'react'

/**
 * Input for services currently in 'starting' phase.
 */
export interface StartingService {
  readonly name: string
  readonly startTime: Date
}

/**
 * Hook that tracks elapsed time for services in 'starting' phase.
 * Per RESEARCH.md Pattern 2: Track elapsed time with setInterval and cleanup.
 * Per RESEARCH.md Pitfall 2: Calculate from input array directly (not stale closure).
 * Per RESEARCH.md Pitfall 3: Always return cleanup that calls clearInterval.
 *
 * @param startingServices - Array of services currently starting with their start times
 * @returns Map of service name to elapsed seconds
 */
export const useElapsedTime = (
  startingServices: readonly StartingService[]
): Map<string, number> => {
  const [elapsed, setElapsed] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    // Clear elapsed times when no services are starting
    if (startingServices.length === 0) {
      setElapsed(new Map())
      return
    }

    // Calculate elapsed time from the input array directly
    // Per RESEARCH.md Pitfall 2: Use callback form or calculate from input
    const calculateElapsed = (): void => {
      const now = Date.now()
      const newElapsed = new Map<string, number>()

      for (const svc of startingServices) {
        const seconds = Math.floor((now - svc.startTime.getTime()) / 1000)
        newElapsed.set(svc.name, seconds)
      }

      setElapsed(newElapsed)
    }

    // Calculate immediately on mount/change
    calculateElapsed()

    // Set up interval for 1 second updates
    const intervalId = setInterval(calculateElapsed, 1000)

    // Per RESEARCH.md Pitfall 3: Always return cleanup
    return () => {
      clearInterval(intervalId)
    }
  }, [startingServices])

  return elapsed
}
