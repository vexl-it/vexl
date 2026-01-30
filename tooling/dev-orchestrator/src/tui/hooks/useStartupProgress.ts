import {useCallback, useEffect, useMemo, useState} from 'react'
import {SERVICES} from '../../config/services.js'
import type {
  InfraStartupEvent,
  ServiceStartupEvent,
  ServiceStartupPhase,
} from '../../process/startup-state.js'

/**
 * Startup progress state for TUI consumption.
 */
export interface StartupProgress {
  /** Map of service name to current startup event */
  readonly services: Map<string, ServiceStartupEvent>
  /** Infrastructure phases (docker, postgres, redis) */
  readonly infrastructure: {
    readonly docker: ServiceStartupPhase
    readonly postgres: ServiceStartupPhase
    readonly redis: ServiceStartupPhase
  }
  /** Number of services that have reached 'ready' phase */
  readonly readyCount: number
  /** Total number of services being tracked */
  readonly totalCount: number
  /** Whether all services have reached 'ready' phase */
  readonly isComplete: boolean
  /** Flag that becomes true once isComplete (for notification trigger) */
  readonly allServicesReady: boolean
}

interface UseStartupProgressOptions {
  /** Optional callback subscription for service events */
  onServiceChange?: (handler: (e: ServiceStartupEvent) => void) => () => void
  /** Optional callback subscription for infrastructure events */
  onInfraChange?: (handler: (e: InfraStartupEvent) => void) => () => void
  /** Get all current service states (for late initialization) */
  getAllServiceStates?: () => ServiceStartupEvent[]
  /** Get all current infra states (for late initialization) */
  getAllInfraStates?: () => InfraStartupEvent[]
}

/**
 * Hook that subscribes to StartupState events and maintains React state.
 * Per RESEARCH.md Pattern 3: Subscribe to startup events from Effect orchestrator.
 * Per RESEARCH.md Pitfall 4: Initialize from getAllServiceStates to handle race conditions.
 */
export const useStartupProgress = (
  options: UseStartupProgressOptions = {}
): StartupProgress => {
  const {
    onServiceChange,
    onInfraChange,
    getAllServiceStates,
    getAllInfraStates,
  } = options

  // Initialize all services as 'pending' from SERVICES config
  const [services, setServices] = useState<Map<string, ServiceStartupEvent>>(
    () => {
      const initial = new Map<string, ServiceStartupEvent>()
      for (const svc of SERVICES) {
        initial.set(svc.name, {
          serviceName: svc.name,
          displayName: svc.displayName,
          phase: 'pending',
          timestamp: new Date(),
          port: svc.port,
        })
      }
      return initial
    }
  )

  // Initialize infrastructure state as 'pending'
  const [infra, setInfra] = useState<{
    docker: ServiceStartupPhase
    postgres: ServiceStartupPhase
    redis: ServiceStartupPhase
  }>({
    docker: 'pending',
    postgres: 'pending',
    redis: 'pending',
  })

  // Track if all services have been ready at some point (for notification)
  const [allServicesReady, setAllServicesReady] = useState(false)

  // Handle late initialization from current state
  // Per RESEARCH.md Pitfall 4: Late subscribers need to get current state
  useEffect(() => {
    if (getAllServiceStates !== undefined) {
      const currentStates = getAllServiceStates()
      if (currentStates.length > 0) {
        setServices((prev) => {
          const next = new Map(prev)
          for (const event of currentStates) {
            next.set(event.serviceName, event)
          }
          return next
        })
      }
    }
    if (getAllInfraStates !== undefined) {
      const currentInfraStates = getAllInfraStates()
      if (currentInfraStates.length > 0) {
        setInfra((prev) => {
          const next = {...prev}
          for (const event of currentInfraStates) {
            next[event.name] = event.phase
          }
          return next
        })
      }
    }
  }, [getAllServiceStates, getAllInfraStates])

  // Handle service event
  const handleServiceEvent = useCallback((event: ServiceStartupEvent) => {
    setServices((prev) => {
      const next = new Map(prev)
      next.set(event.serviceName, event)
      return next
    })
  }, [])

  // Handle infrastructure event
  const handleInfraEvent = useCallback((event: InfraStartupEvent) => {
    setInfra((prev) => ({
      ...prev,
      [event.name]: event.phase,
    }))
  }, [])

  // Subscribe to service events
  useEffect(() => {
    if (onServiceChange === undefined) return

    return onServiceChange(handleServiceEvent)
  }, [onServiceChange, handleServiceEvent])

  // Subscribe to infrastructure events
  useEffect(() => {
    if (onInfraChange === undefined) return

    return onInfraChange(handleInfraEvent)
  }, [onInfraChange, handleInfraEvent])

  // Calculate derived state
  const readyCount = useMemo(() => {
    let count = 0
    for (const [, event] of services) {
      if (event.phase === 'ready') {
        count += 1
      }
    }
    return count
  }, [services])

  const totalCount = services.size
  const isComplete = readyCount === totalCount && totalCount > 0

  // Detect transition to all-ready (for notification trigger)
  // Per RESEARCH.md: Use effect to detect transition, not polling comparison
  useEffect(() => {
    if (isComplete && !allServicesReady) {
      setAllServicesReady(true)
    }
  }, [isComplete, allServicesReady])

  return {
    services,
    infrastructure: infra,
    readyCount,
    totalCount,
    isComplete,
    allServicesReady,
  }
}
