import {EventEmitter} from 'events'
import type {LogLine} from '../tui/types.js'

/**
 * Log bridge for streaming logs from services to TUI.
 * Uses EventEmitter pattern for decoupled communication.
 */
export class LogBridge extends EventEmitter {
  private logIdCounter = 0

  /**
   * Emit a log line to listeners (TUI will subscribe)
   */
  emitLog(service: string, message: string, isError: boolean = false): void {
    this.logIdCounter += 1
    const logLine: LogLine = {
      id: `log-${Date.now()}-${this.logIdCounter}`,
      service,
      message: message.trim(),
      timestamp: new Date(),
      isError,
    }
    this.emit('log', logLine)
  }

  /**
   * Subscribe to log events
   */
  onLog(handler: (log: LogLine) => void): () => void {
    this.on('log', handler)
    return () => this.off('log', handler)
  }

  /**
   * Clear state and prepare for reuse
   */
  reset(): void {
    this.logIdCounter = 0
    this.removeAllListeners()
  }
}

/**
 * Global log bridge instance for the orchestrator.
 * Only created when TUI mode is active.
 */
let globalLogBridge: LogBridge | null = null

/**
 * Create the global log bridge (call once at orchestrator startup in TUI mode)
 */
export const createLogBridge = (): LogBridge => {
  if (globalLogBridge === null) {
    globalLogBridge = new LogBridge()
  }
  return globalLogBridge
}

/**
 * Get the global log bridge (returns null if not in TUI mode)
 */
export const getLogBridge = (): LogBridge | null => globalLogBridge

/**
 * Clear the global log bridge (for cleanup)
 */
export const clearLogBridge = (): void => {
  if (globalLogBridge !== null) {
    globalLogBridge.reset()
    globalLogBridge = null
  }
}
