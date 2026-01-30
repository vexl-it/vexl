import {EventEmitter} from 'events'

/**
 * Startup state bridge for communicating service lifecycle events from
 * the Effect orchestrator to the React TUI during startup.
 * Uses EventEmitter pattern parallel to LogBridge.
 */

/**
 * Phase of service startup lifecycle.
 * - pending: Service not yet started (gray indicator)
 * - starting: Service process spawned, waiting for health (yellow indicator)
 * - ready: Health check passed (green indicator)
 * - error: Startup failed (red indicator)
 */
export type ServiceStartupPhase = 'pending' | 'starting' | 'ready' | 'error'

/**
 * Event emitted when a service transitions between startup phases.
 */
export interface ServiceStartupEvent {
  readonly serviceName: string
  readonly displayName: string
  readonly phase: ServiceStartupPhase
  readonly timestamp: Date
  readonly port?: number
  readonly errorMessage?: string
}

/**
 * Event emitted when infrastructure (Docker containers) transitions phases.
 */
export interface InfraStartupEvent {
  readonly name: 'postgres' | 'redis' | 'docker'
  readonly phase: 'pending' | 'starting' | 'ready' | 'error'
  readonly timestamp: Date
}

/**
 * Startup state EventEmitter for tracking service lifecycle during startup.
 * Stores current states so late subscribers can get current state.
 */
export class StartupState extends EventEmitter {
  private readonly serviceStates = new Map<string, ServiceStartupEvent>()
  private readonly infraStates = new Map<string, InfraStartupEvent>()

  /**
   * Emit a service phase transition event and store the state.
   */
  emitServicePhase(event: ServiceStartupEvent): void {
    this.serviceStates.set(event.serviceName, event)
    this.emit('service', event)
  }

  /**
   * Emit an infrastructure phase transition event.
   */
  emitInfraPhase(event: InfraStartupEvent): void {
    this.infraStates.set(event.name, event)
    this.emit('infra', event)
  }

  /**
   * Get all current service states (for late initialization).
   */
  getAllServiceStates(): ServiceStartupEvent[] {
    return Array.from(this.serviceStates.values())
  }

  /**
   * Get all current infrastructure states (for late initialization).
   */
  getAllInfraStates(): InfraStartupEvent[] {
    return Array.from(this.infraStates.values())
  }

  /**
   * Subscribe to service phase change events.
   * @returns Unsubscribe function
   */
  onServiceChange(handler: (event: ServiceStartupEvent) => void): () => void {
    this.on('service', handler)
    return () => this.off('service', handler)
  }

  /**
   * Subscribe to infrastructure phase change events.
   * @returns Unsubscribe function
   */
  onInfraChange(handler: (event: InfraStartupEvent) => void): () => void {
    this.on('infra', handler)
    return () => this.off('infra', handler)
  }

  /**
   * Clear state and prepare for reuse.
   */
  reset(): void {
    this.serviceStates.clear()
    this.infraStates.clear()
    this.removeAllListeners()
  }
}

/**
 * Global startup state instance for the orchestrator.
 * Created when TUI mode is active during startup.
 */
let globalStartupState: StartupState | null = null

/**
 * Create the global startup state (call once at orchestrator startup in TUI mode).
 * Returns existing instance if already created.
 */
export const createStartupState = (): StartupState => {
  if (globalStartupState === null) {
    globalStartupState = new StartupState()
  }
  return globalStartupState
}

/**
 * Get the global startup state (returns null if not created).
 */
export const getStartupState = (): StartupState | null => globalStartupState

/**
 * Clear the global startup state (for cleanup).
 */
export const clearStartupState = (): void => {
  if (globalStartupState !== null) {
    globalStartupState.reset()
    globalStartupState = null
  }
}
