import {useCallback, useState} from 'react'

interface UseServiceControlOptions {
  onRestart?: (serviceName: string) => void
}

interface ServiceControl {
  readonly restartingServices: readonly string[]
  isRestarting: (serviceName: string) => boolean
  requestRestart: (serviceName: string) => void
  markRestartComplete: (serviceName: string) => void
}

/**
 * Hook for managing service restart requests.
 * Actual restart is handled by the orchestrator - this tracks UI state.
 */
export const useServiceControl = (
  options: UseServiceControlOptions = {}
): ServiceControl => {
  const {onRestart} = options
  const [restartingServices, setRestartingServices] = useState<string[]>([])

  const isRestarting = useCallback(
    (serviceName: string) => restartingServices.includes(serviceName),
    [restartingServices]
  )

  const requestRestart = useCallback(
    (serviceName: string) => {
      // Don't restart if already restarting
      if (restartingServices.includes(serviceName)) {
        return
      }

      setRestartingServices((prev) => [...prev, serviceName])

      // Notify parent (orchestrator will handle actual restart)
      onRestart?.(serviceName)
    },
    [restartingServices, onRestart]
  )

  const markRestartComplete = useCallback((serviceName: string) => {
    setRestartingServices((prev) => prev.filter((s) => s !== serviceName))
  }, [])

  return {
    restartingServices,
    isRestarting,
    requestRestart,
    markRestartComplete,
  }
}

/**
 * Type for restart callback passed from orchestrator
 */
export type RestartCallback = (serviceName: string) => Promise<void>
