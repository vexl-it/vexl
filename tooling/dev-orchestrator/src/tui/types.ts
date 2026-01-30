/**
 * TUI type definitions for the dev orchestrator interactive terminal UI.
 * These types are shared across all TUI components.
 */

/**
 * Log line for TUI display.
 */
export interface LogLine {
  readonly id: string
  readonly service: string
  readonly message: string
  readonly timestamp: Date
  readonly isError: boolean
}

/**
 * Service status values for health display.
 * Order: pending -> starting -> running (or stopped/error)
 * Note: 'pending' is ONLY for initial startup phase.
 * After startup completes, a stopped service shows 'stopped' (red), not 'pending' (gray).
 */
export type ServiceStatusValue =
  | 'pending'
  | 'starting'
  | 'running'
  | 'stopped'
  | 'error'

/**
 * Service status for health display.
 */
export interface ServiceStatus {
  readonly name: string
  readonly displayName: string
  readonly status: ServiceStatusValue
  readonly port: number
  readonly healthPort: number
}

/**
 * Infrastructure status (Docker containers).
 */
export interface InfraStatus {
  readonly postgres: 'running' | 'stopped'
  readonly redis: 'running' | 'stopped'
}

/**
 * Overall TUI state.
 */
export interface TuiState {
  readonly services: readonly ServiceStatus[]
  readonly infrastructure: InfraStatus
  readonly logs: readonly LogLine[]
  readonly activeFilter: string | null // null = show all
  readonly selectedServiceIndex: number
  readonly isShuttingDown: boolean
}

/**
 * Actions that can be triggered from TUI.
 */
export type TuiAction =
  | {readonly type: 'log'; readonly line: LogLine}
  | {
      readonly type: 'serviceStatus'
      readonly name: string
      readonly status: ServiceStatusValue
    }
  | {readonly type: 'infraStatus'; readonly infra: InfraStatus}
  | {readonly type: 'setFilter'; readonly service: string | null}
  | {readonly type: 'selectService'; readonly index: number}
  | {readonly type: 'restartService'; readonly name: string}
  | {readonly type: 'shutdown'}

/**
 * Current view mode for the TUI.
 * 'main' - Split panel with service list and log viewer
 * 'detail' - Fullscreen log view for a single service
 */
export type ViewMode = 'main' | 'detail'
