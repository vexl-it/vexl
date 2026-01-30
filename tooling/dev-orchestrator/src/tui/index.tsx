import {render} from 'ink'
import {SERVICES} from '../config/services.js'
import type {
  InfraStartupEvent,
  ServiceStartupEvent,
} from '../process/startup-state.js'
import {App} from './App.js'
import type {InfraStatus, LogLine, ServiceStatus, TuiState} from './types.js'

/**
 * Check if TUI mode is supported in current environment.
 * Per RESEARCH.md: Requires TTY for raw mode keyboard input.
 */
export const isTuiSupported = (): boolean => {
  return Boolean(process.stdout.isTTY && process.stdin.isTTY)
}

/**
 * Create initial TUI state from service configs.
 */
const createInitialState = (): TuiState => {
  const services: ServiceStatus[] = SERVICES.map((s) => ({
    name: s.name,
    displayName: s.displayName,
    status: 'stopped' as const,
    port: s.port,
    healthPort: s.healthPort,
  }))

  const infrastructure: InfraStatus = {
    postgres: 'stopped',
    redis: 'stopped',
  }

  return {
    services,
    infrastructure,
    logs: [],
    activeFilter: null,
    selectedServiceIndex: 0,
    isShuttingDown: false,
  }
}

/**
 * Options for rendering the TUI
 */
interface RenderTuiOptions {
  onRestart?: (serviceName: string) => Promise<void>
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
 * Render the TUI and return cleanup function.
 * Call this from index.ts when TUI mode is enabled.
 */
export const renderTui = (
  options: RenderTuiOptions = {}
): {
  unmount: () => void
  waitUntilExit: () => Promise<void>
} => {
  const initialState = createInitialState()

  const instance = render(
    <App
      initialState={initialState}
      onRestart={options.onRestart}
      onShutdown={options.onShutdown}
      onLogSubscribe={options.onLogSubscribe}
      onStartupProgress={options.onStartupProgress}
      onInfraProgress={options.onInfraProgress}
      getAllServiceStates={options.getAllServiceStates}
      getAllInfraStates={options.getAllInfraStates}
    />
  )

  return {
    unmount: () => {
      instance.unmount()
    },
    waitUntilExit: () => instance.waitUntilExit(),
  }
}

/**
 * Re-export types for consumers
 */
export type {
  InfraStatus,
  LogLine,
  ServiceStatus,
  TuiAction,
  TuiState,
} from './types.js'

export type {RestartCallback} from './hooks/useServiceControl.js'
