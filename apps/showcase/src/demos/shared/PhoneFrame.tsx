import {Typography} from '@vexl-next/ui'
import {useLayoutEffect, useRef, useState, type ReactNode} from 'react'
import {SafeAreaInsetsContext} from 'react-native-safe-area-context'

// Screens are laid out at a real phone's CSS size, then scaled into the frame.
const screenWidth = 390
const screenHeight = 844
const insets = {top: 54, bottom: 34, left: 0, right: 0}

function StatusIcons(): React.JSX.Element {
  return (
    <svg width="78" height="13" viewBox="0 0 78 13" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="6" width="3" height="6" rx="1" />
      <rect x="10" y="3.5" width="3" height="8.5" rx="1" />
      <rect x="15" y="1" width="3" height="11" rx="1" />
      <path d="M32 3.2a10 10 0 0 1 13 0l-1.6 1.7a7.6 7.6 0 0 0-9.8 0zM34.7 6.2a6 6 0 0 1 7.6 0l-1.7 1.7a3.6 3.6 0 0 0-4.2 0zM38.5 9.4l1.6 1.6-1.6 1.6-1.6-1.6z" />
      <rect
        x="52.5"
        y="0.5"
        width="22"
        height="12"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        opacity="0.4"
      />
      <rect x="54.5" y="2.5" width="18" height="8" rx="2" />
      <rect x="76" y="4.5" width="1.5" height="4" rx="0.75" opacity="0.4" />
    </svg>
  )
}

function StatusBar(): React.JSX.Element {
  return (
    <div className="phone-status-bar">
      <Typography variant="paragraphDemibold" color="$foregroundPrimary">
        9:41
      </Typography>
      <div className="phone-island" />
      <StatusIcons />
    </div>
  )
}

/** Inert, phone-sized app screens in a device bezel, scaled to the frame's width. */
export function PhoneFrame({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / screenWidth)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])
  return (
    <div className="phone-bezel">
      <div ref={ref} className="phone-screen" inert aria-hidden>
        <div
          className="phone-viewport"
          style={{
            width: screenWidth,
            height: screenHeight,
            transform: `scale(${scale})`,
          }}
        >
          {/* Mounted once scaled, so the screens measure their layout at the final scale. */}
          {scale > 0 ? (
            <SafeAreaInsetsContext.Provider value={insets}>
              {children}
            </SafeAreaInsetsContext.Provider>
          ) : null}
          <StatusBar />
          <div className="phone-home-indicator" />
        </div>
      </div>
    </div>
  )
}
