import {Box, Text, useApp, useInput} from 'ink'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import type {
  InfraStartupEvent,
  ServiceStartupEvent,
} from '../process/startup-state.js'
import {FullScreen} from './components/FullScreen.js'
import {LogViewer} from './components/LogViewer.js'
import {ServiceDetailView} from './components/ServiceDetailView.js'
import {ServicePanel} from './components/ServicePanel.js'
import {StartupHeader} from './components/StartupHeader.js'
import {useElapsedTime} from './hooks/useElapsedTime.js'
import {useHealthStatus} from './hooks/useHealthStatus.js'
import {createLogId, useLogBuffer} from './hooks/useLogBuffer.js'
import {
  useServiceControl,
  type RestartCallback,
} from './hooks/useServiceControl.js'
import {useStartupProgress} from './hooks/useStartupProgress.js'
import {
  calculateAvailableLogLines,
  useTerminalDimensions,
} from './hooks/useTerminalDimensions.js'
import type {LogLine, ServiceStatus, TuiState, ViewMode} from './types.js'

interface AppProps {
  initialState: TuiState
  onRestart?: RestartCallback
  onShutdown?: () => void
  onLogSubscribe?: (handler: (log: LogLine) => void) => () => void
  /** Subscribe to service startup progress events */
  onStartupProgress?: (handler: (e: ServiceStartupEvent) => void) => () => void
  /** Subscribe to infrastructure startup progress events */
  onInfraProgress?: (handler: (e: InfraStartupEvent) => void) => () => void
  /** Get all current service states (for late initialization) */
  getAllServiceStates?: () => ServiceStartupEvent[]
  /** Get all current infra states (for late initialization) */
  getAllInfraStates?: () => InfraStartupEvent[]
}

/**
 * Root TUI component for the dev orchestrator.
 * Shows service status panel, log viewer, and handles keyboard input.
 * During startup, shows startup progress from event stream.
 * After startup completes, switches to health polling.
 */
export const App: React.FC<AppProps> = ({
  initialState,
  onRestart,
  onShutdown,
  onLogSubscribe,
  onStartupProgress,
  onInfraProgress,
  getAllServiceStates,
  getAllInfraStates,
}) => {
  const {exit} = useApp()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isShuttingDown, setIsShuttingDown] = useState(false)
  const [scrollFocus, setScrollFocus] = useState<'services' | 'logs'>(
    'services'
  )
  const [viewMode, setViewMode] = useState<ViewMode>('main')

  // Get terminal dimensions for dynamic log height
  const terminalDimensions = useTerminalDimensions()
  const availableLogLines = calculateAvailableLogLines(terminalDimensions.rows)

  // Track startup progress from event stream
  const startupProgress = useStartupProgress({
    onServiceChange: onStartupProgress,
    onInfraChange: onInfraProgress,
    getAllServiceStates,
    getAllInfraStates,
  })

  // Derive starting services for elapsed time tracking
  const startingServices = useMemo(() => {
    const result: Array<{name: string; startTime: Date}> = []
    for (const [, event] of startupProgress.services) {
      if (event.phase === 'starting') {
        result.push({name: event.serviceName, startTime: event.timestamp})
      }
    }
    return result
  }, [startupProgress.services])

  // Track elapsed time for services in 'starting' phase
  const elapsedTimes = useElapsedTime(startingServices)

  // Notification fade state (per RESEARCH.md Pattern 6)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationShown, setNotificationShown] = useState(false)

  useEffect(() => {
    if (startupProgress.allServicesReady && !notificationShown) {
      setShowNotification(true)
      setNotificationShown(true)
      const timeout = setTimeout(() => {
        setShowNotification(false)
      }, 2500)
      return () => {
        clearTimeout(timeout)
      }
    }
    return undefined
  }, [startupProgress.allServicesReady, notificationShown])

  // Poll health status in real-time (used after startup completes)
  const healthState = useHealthStatus({pollIntervalMs: 2000})

  // Manage log buffer with dynamic visible lines based on terminal height
  const logBuffer = useLogBuffer({
    maxLines: 1000,
    visibleLines: availableLogLines,
  })

  // Service control (restart)
  const serviceControl = useServiceControl({
    onRestart: (serviceName) => {
      logBuffer.addLog({
        id: createLogId(),
        service: 'orchestrator',
        message: `Restarting ${serviceName}...`,
        timestamp: new Date(),
        isError: false,
      })

      if (onRestart) {
        onRestart(serviceName)
          .then(() => {
            serviceControl.markRestartComplete(serviceName)
            logBuffer.addLog({
              id: createLogId(),
              service: 'orchestrator',
              message: `${serviceName} restarted successfully`,
              timestamp: new Date(),
              isError: false,
            })
          })
          .catch((error: unknown) => {
            serviceControl.markRestartComplete(serviceName)
            logBuffer.addLog({
              id: createLogId(),
              service: 'orchestrator',
              message: `Failed to restart ${serviceName}: ${String(error)}`,
              timestamp: new Date(),
              isError: true,
            })
          })
      }
    },
  })

  // Add startup log
  useEffect(() => {
    logBuffer.addLog({
      id: createLogId(),
      service: 'orchestrator',
      message: 'TUI started - watching services...',
      timestamp: new Date(),
      isError: false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount
  }, [])

  // Subscribe to log stream from services
  useEffect(() => {
    if (onLogSubscribe) {
      const unsubscribe = onLogSubscribe((log) => {
        logBuffer.addLog(log)
      })
      return unsubscribe
    }
    return undefined
  }, [onLogSubscribe, logBuffer])

  // Handle shutdown
  const handleShutdown = useCallback(() => {
    if (isShuttingDown) return
    setIsShuttingDown(true)
    logBuffer.addLog({
      id: createLogId(),
      service: 'orchestrator',
      message: 'Shutting down...',
      timestamp: new Date(),
      isError: false,
    })
    onShutdown?.()
    exit()
  }, [isShuttingDown, logBuffer, onShutdown, exit])

  // Build service status from startup progress or health state
  // Per RESEARCH.md: During startup use event-driven updates, after use health polling
  const services: readonly ServiceStatus[] = useMemo(() => {
    if (!startupProgress.isComplete) {
      // During startup: build from startupProgress.services
      const result: ServiceStatus[] = []
      for (const [, event] of startupProgress.services) {
        result.push({
          name: event.serviceName,
          displayName: event.displayName,
          status:
            event.phase === 'ready'
              ? 'running'
              : event.phase === 'error'
                ? 'error'
                : event.phase === 'starting'
                  ? 'starting'
                  : 'pending',
          port: event.port ?? 0,
          healthPort: 0, // Not needed for display
        })
      }
      return result
    }
    // After startup: use health state (with restart state overlay)
    return healthState.services.map((s) => ({
      ...s,
      status: serviceControl.isRestarting(s.name) ? 'starting' : s.status,
    }))
  }, [
    startupProgress.isComplete,
    startupProgress.services,
    healthState.services,
    serviceControl,
  ])

  // Build infrastructure status from startup progress or health state
  const infrastructure = useMemo(() => {
    if (!startupProgress.isComplete) {
      // During startup: convert startup phases to health status
      return {
        postgres:
          startupProgress.infrastructure.postgres === 'ready'
            ? ('running' as const)
            : ('stopped' as const),
        redis:
          startupProgress.infrastructure.redis === 'ready'
            ? ('running' as const)
            : ('stopped' as const),
      }
    }
    // After startup: use health state
    return healthState.infrastructure
  }, [
    startupProgress.isComplete,
    startupProgress.infrastructure,
    healthState.infrastructure,
  ])

  // Get selected service for detail view
  const selectedService = services[selectedIndex]

  // Handle entering detail view
  const handleEnterDetailView = useCallback(() => {
    if (selectedService) {
      logBuffer.setFilter(selectedService.name)
      logBuffer.scrollToBottom()
      setViewMode('detail')
    }
  }, [selectedService, logBuffer])

  // Handle exiting detail view
  const handleExitDetailView = useCallback(() => {
    logBuffer.setFilter(null)
    setViewMode('main')
  }, [logBuffer])

  // Keyboard navigation (view-aware)
  useInput((input, key) => {
    // Quit - works in all views
    if (input === 'q') {
      handleShutdown()
      return
    }

    // Clear logs (Ctrl+L pattern) - works in all views
    if (key.ctrl && input === 'l') {
      logBuffer.clear()
      return
    }

    // View-specific keyboard handling
    if (viewMode === 'main') {
      // Enter key: open detail view for selected service
      if (key.return && selectedService) {
        handleEnterDetailView()
        return
      }

      // Toggle scroll focus (plain 'l', not Ctrl+L)
      if (input === 'l' && !key.ctrl) {
        setScrollFocus((prev) => (prev === 'services' ? 'logs' : 'services'))
        return
      }

      // Navigate services OR scroll logs based on focus
      if (key.upArrow) {
        if (scrollFocus === 'services') {
          setSelectedIndex((i) => Math.max(0, i - 1))
        } else {
          logBuffer.scrollUp()
        }
        return
      }
      if (key.downArrow) {
        if (scrollFocus === 'services') {
          setSelectedIndex((i) => Math.min(services.length - 1, i + 1))
        } else {
          logBuffer.scrollDown()
        }
        return
      }

      // Page Up/Down for faster scrolling in logs mode
      if (key.pageUp && scrollFocus === 'logs') {
        for (let i = 0; i < 10; i++) logBuffer.scrollUp()
        return
      }
      if (key.pageDown && scrollFocus === 'logs') {
        for (let i = 0; i < 10; i++) logBuffer.scrollDown()
        return
      }

      // Restart selected service (only after startup completes)
      if (input === 'r' && startupProgress.isComplete) {
        if (
          selectedService &&
          !serviceControl.isRestarting(selectedService.name)
        ) {
          serviceControl.requestRestart(selectedService.name)
        }
      }
    } else {
      // Detail view keyboard handling

      // Escape key: return to main view
      if (key.escape) {
        handleExitDetailView()
        return
      }

      // Scroll logs with arrow keys
      if (key.upArrow) {
        logBuffer.scrollUp()
        return
      }
      if (key.downArrow) {
        logBuffer.scrollDown()
        return
      }

      // Page Up/Down for faster scrolling
      if (key.pageUp) {
        for (let i = 0; i < 10; i++) logBuffer.scrollUp()
        return
      }
      if (key.pageDown) {
        for (let i = 0; i < 10; i++) logBuffer.scrollDown()
        return
      }

      // Restart selected service (only after startup completes)
      if (input === 'r' && startupProgress.isComplete) {
        if (
          selectedService &&
          !serviceControl.isRestarting(selectedService.name)
        ) {
          serviceControl.requestRestart(selectedService.name)
        }
      }
    }
  })

  // Prevent unused variable warning - initialState will be used later
  void initialState

  // Single FullScreen wrapper with conditional content
  return (
    <FullScreen>
      {viewMode === 'detail' && selectedService ? (
        <ServiceDetailView
          service={selectedService}
          logBuffer={logBuffer}
          onExit={handleExitDetailView}
        />
      ) : (
        <Box flexDirection="column" padding={1} height="100%">
          {/* Header */}
          <Box marginBottom={1}>
            <Text bold color="cyan">
              Vexl Dev Orchestrator
            </Text>
            <Text> - </Text>
            <StartupHeader
              readyCount={startupProgress.readyCount}
              totalCount={startupProgress.totalCount}
              isComplete={startupProgress.isComplete}
              showNotification={showNotification}
            />
            {!!isShuttingDown && (
              <Text color="yellow"> (shutting down...)</Text>
            )}
          </Box>

          {/* Main content: service panel + log viewer */}
          <Box flexDirection="row" flexGrow={1}>
            {/* Service panel (left side) */}
            <Box
              borderStyle="single"
              borderColor={scrollFocus === 'services' ? 'cyan' : undefined}
              flexDirection="column"
              padding={1}
              width={40}
            >
              <ServicePanel
                services={services}
                infrastructure={infrastructure}
                selectedIndex={selectedIndex}
                elapsedTimes={elapsedTimes}
              />
            </Box>

            {/* Log viewer (right side, takes remaining space) */}
            <Box
              borderStyle="single"
              borderColor={scrollFocus === 'logs' ? 'cyan' : undefined}
              flexDirection="column"
              padding={1}
              flexGrow={1}
              marginLeft={1}
            >
              <Text bold>Logs</Text>
              <LogViewer
                logs={logBuffer.visibleLogs}
                maxHeight={availableLogLines}
                scrollOffset={logBuffer.scrollOffset}
                isFocused={scrollFocus === 'logs'}
                totalLogs={logBuffer.filteredLogs.length}
              />
            </Box>
          </Box>

          {/* Help bar */}
          <Box marginTop={1}>
            <Text dimColor>
              <Text bold>q</Text> quit |<Text bold> Enter</Text> details |
              <Text bold> {'\u2191\u2193'}</Text>{' '}
              {scrollFocus === 'services' ? 'navigate' : 'scroll logs'} |
              <Text bold> l</Text>{' '}
              {scrollFocus === 'services' ? 'focus logs' : 'focus services'} |
              <Text bold> r</Text> restart |<Text bold> Ctrl+L</Text> clear logs
            </Text>
          </Box>
        </Box>
      )}
    </FullScreen>
  )
}

export type {AppProps}
