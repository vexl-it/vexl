import {useStdout} from 'ink'
import {useEffect, useState} from 'react'

interface TerminalDimensions {
  rows: number
  columns: number
}

// Fallback dimensions for non-TTY environments
const DEFAULT_ROWS = 24
const DEFAULT_COLUMNS = 80

/**
 * Hook that provides terminal dimensions and updates on resize.
 * Uses ink's useStdout to access stdout stream.
 */
export const useTerminalDimensions = (): TerminalDimensions => {
  const {stdout} = useStdout()

  const [dimensions, setDimensions] = useState<TerminalDimensions>(() => ({
    rows: stdout.rows ?? DEFAULT_ROWS,
    columns: stdout.columns ?? DEFAULT_COLUMNS,
  }))

  useEffect(() => {
    const handleResize = (): void => {
      setDimensions({
        rows: stdout.rows ?? DEFAULT_ROWS,
        columns: stdout.columns ?? DEFAULT_COLUMNS,
      })
    }

    // Subscribe to resize events
    stdout.on('resize', handleResize)

    // Get initial dimensions (might have changed since initial state)
    handleResize()

    return () => {
      stdout.off('resize', handleResize)
    }
  }, [stdout])

  return dimensions
}

/**
 * Calculate available log lines based on terminal height.
 * Accounts for header, help bar, borders, and padding.
 *
 * Layout breakdown (main view):
 * - 1 line: padding top
 * - 1 line: header (Vexl Dev Orchestrator + status)
 * - 1 line: marginBottom after header
 * - 2 lines: top/bottom border of log panel
 * - 2 lines: padding inside log panel
 * - 1 line: "Logs" title
 * - 1 line: filter indicator
 * - 1 line: marginTop after filter
 * - 1 line: scroll/count indicator (if shown)
 * - 1 line: marginTop before help bar
 * - 1 line: help bar
 * - 1 line: padding bottom
 *
 * Total overhead: ~15 lines
 */
export const calculateAvailableLogLines = (terminalRows: number): number => {
  const LAYOUT_OVERHEAD = 15
  const MIN_LOG_LINES = 3

  return Math.max(MIN_LOG_LINES, terminalRows - LAYOUT_OVERHEAD)
}
