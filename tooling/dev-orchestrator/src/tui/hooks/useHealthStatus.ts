import {Effect} from 'effect'
import {useEffect, useRef, useState} from 'react'
import {SERVICES} from '../../config/services.js'
import {checkAllServicesHealth} from '../../health/status-checker.js'
import type {InfraStatus, ServiceStatus, ServiceStatusValue} from '../types.js'

interface UseHealthStatusOptions {
  pollIntervalMs?: number
  enabled?: boolean
}

interface HealthState {
  services: ServiceStatus[]
  infrastructure: InfraStatus
  isLoading: boolean
  lastUpdate: Date | null
}

/**
 * Hook that polls health status at regular intervals.
 * Per RESEARCH.md: Bridge Effect to React state via useEffect.
 */
export const useHealthStatus = (
  options: UseHealthStatusOptions = {}
): HealthState => {
  const {pollIntervalMs = 2000, enabled = true} = options

  const [state, setState] = useState<HealthState>(() => ({
    services: SERVICES.map((s) => ({
      name: s.name,
      displayName: s.displayName,
      status: 'stopped' as ServiceStatusValue,
      port: s.port,
      healthPort: s.healthPort,
    })),
    infrastructure: {postgres: 'stopped', redis: 'stopped'},
    isLoading: true,
    lastUpdate: null,
  }))

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    if (!enabled) {
      return
    }

    const pollHealth = async (): Promise<void> => {
      try {
        const report = await Effect.runPromise(checkAllServicesHealth())

        if (!isMountedRef.current) return

        // Map HealthReport to our ServiceStatus type
        const services: ServiceStatus[] = report.services.map((s) => ({
          name: s.name,
          displayName: s.displayName,
          status: s.status === 'running' ? 'running' : 'stopped',
          port: s.mainPort,
          healthPort: s.healthPort,
        }))

        setState({
          services,
          infrastructure: report.infrastructure,
          isLoading: false,
          lastUpdate: report.timestamp,
        })
      } catch {
        // On error, keep previous state but mark as loaded
        if (isMountedRef.current) {
          setState((prev) => ({...prev, isLoading: false}))
        }
      }
    }

    // Initial poll
    void pollHealth()

    // Set up interval for subsequent polls
    const intervalId = setInterval(() => {
      void pollHealth()
    }, pollIntervalMs)

    return () => {
      isMountedRef.current = false
      clearInterval(intervalId)
    }
  }, [pollIntervalMs, enabled])

  return state
}
