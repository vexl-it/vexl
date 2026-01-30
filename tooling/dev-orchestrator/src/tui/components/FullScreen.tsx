import {Box} from 'ink'
import React, {useEffect} from 'react'

// ANSI escape codes for alternate screen buffer
const enterAltScreen = '\x1b[?1049h'
const leaveAltScreen = '\x1b[?1049l'
const clearScreen = '\x1b[2J\x1b[H'

interface FullScreenProps {
  children: React.ReactNode
}

/**
 * Wrapper component that switches to alternate screen buffer.
 * Per RESEARCH.md: Keeps terminal history clean, restores on exit.
 */
export const FullScreen: React.FC<FullScreenProps> = ({children}) => {
  useEffect(() => {
    // Enter alternate screen and clear it
    process.stdout.write(enterAltScreen + clearScreen)

    // Cleanup: restore main screen on unmount
    return () => {
      process.stdout.write(leaveAltScreen)
    }
  }, [])

  // Also handle process signals to restore screen on crash
  useEffect(() => {
    const restore = (): void => {
      process.stdout.write(leaveAltScreen)
    }

    process.on('SIGINT', restore)
    process.on('SIGTERM', restore)
    process.on('exit', restore)

    return () => {
      process.removeListener('SIGINT', restore)
      process.removeListener('SIGTERM', restore)
      process.removeListener('exit', restore)
    }
  }, [])

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {children}
    </Box>
  )
}
