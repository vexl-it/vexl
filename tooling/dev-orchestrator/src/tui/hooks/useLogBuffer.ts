import {useCallback, useEffect, useMemo, useState} from 'react'
import type {LogLine} from '../types.js'

const DEFAULT_MAX_LINES = 1000
const DEFAULT_VISIBLE_LINES = 20

interface UseLogBufferOptions {
  maxLines?: number
  visibleLines?: number
}

interface LogBuffer {
  readonly allLogs: readonly LogLine[]
  readonly filteredLogs: readonly LogLine[]
  readonly visibleLogs: readonly LogLine[]
  readonly activeFilter: string | null
  readonly scrollOffset: number
  addLog: (log: LogLine) => void
  addLogs: (logs: readonly LogLine[]) => void
  setFilter: (service: string | null) => void
  clear: () => void
  scrollUp: () => void
  scrollDown: () => void
  scrollToBottom: () => void
}

/**
 * Hook for managing log buffer with filtering.
 * Per RESEARCH.md: Cap buffer at ~1000 lines for performance.
 */
export const useLogBuffer = (options: UseLogBufferOptions = {}): LogBuffer => {
  const {maxLines = DEFAULT_MAX_LINES, visibleLines = DEFAULT_VISIBLE_LINES} =
    options

  const [logs, setLogs] = useState<LogLine[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  // Filter logs by active service
  const filteredLogs = useMemo(() => {
    if (activeFilter === null) {
      return logs
    }
    return logs.filter((l) => l.service === activeFilter)
  }, [logs, activeFilter])

  // Clamp scrollOffset when visibleLines or filteredLogs length changes
  // This handles terminal resize scenarios where maxOffset might decrease
  useEffect(() => {
    const maxOffset = Math.max(0, filteredLogs.length - visibleLines)
    setScrollOffset((prev) => Math.min(prev, maxOffset))
  }, [filteredLogs.length, visibleLines])

  // Get visible slice with scroll offset support
  // scrollOffset = 0 means viewing the latest logs (at bottom)
  // scrollOffset > 0 means scrolled up from bottom
  const visibleLogs = useMemo(() => {
    // Calculate end index (where we stop showing logs)
    const endIndex = Math.max(0, filteredLogs.length - scrollOffset)
    // Calculate start index (where we start showing logs)
    const startIndex = Math.max(0, endIndex - visibleLines)
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, scrollOffset, visibleLines])

  // Add single log
  const addLog = useCallback(
    (log: LogLine) => {
      setLogs((prev) => {
        const updated = [...prev, log]
        // Trim to max size
        if (updated.length > maxLines) {
          return updated.slice(-maxLines)
        }
        return updated
      })
    },
    [maxLines]
  )

  // Add multiple logs (batch)
  const addLogs = useCallback(
    (newLogs: readonly LogLine[]) => {
      setLogs((prev) => {
        const updated = [...prev, ...newLogs]
        if (updated.length > maxLines) {
          return updated.slice(-maxLines)
        }
        return updated
      })
    },
    [maxLines]
  )

  // Set filter directly (resets scroll offset per RESEARCH.md Pitfall 1)
  const setFilter = useCallback((service: string | null) => {
    setActiveFilter(service)
    setScrollOffset(0)
  }, [])

  // Clear all logs (also resets scroll offset)
  const clear = useCallback(() => {
    setLogs([])
    setScrollOffset(0)
  }, [])

  // Scroll up (view older logs) with bounds checking
  const scrollUp = useCallback(() => {
    setScrollOffset((prev) => {
      const maxOffset = Math.max(0, filteredLogs.length - visibleLines)
      return Math.min(prev + 1, maxOffset)
    })
  }, [filteredLogs.length, visibleLines])

  // Scroll down (view newer logs)
  const scrollDown = useCallback(() => {
    setScrollOffset((prev) => Math.max(0, prev - 1))
  }, [])

  // Scroll to bottom (view latest logs)
  const scrollToBottom = useCallback(() => {
    setScrollOffset(0)
  }, [])

  return {
    allLogs: logs,
    filteredLogs,
    visibleLogs,
    activeFilter,
    scrollOffset,
    addLog,
    addLogs,
    setFilter,
    clear,
    scrollUp,
    scrollDown,
    scrollToBottom,
  }
}

/**
 * Generate unique log ID
 */
let logCounter = 0
export const createLogId = (): string => {
  logCounter += 1
  return `log-${Date.now()}-${logCounter}`
}
