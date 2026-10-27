import {VexlThemeProvider} from '@vexl-next/ui'
import {lazy, StrictMode, Suspense} from 'react'
import {createRoot} from 'react-dom/client'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {measureLayoutUnscaled} from './demos/shared/unscaledLayout'
import './fonts.css'
import {LandingPage} from './page/LandingPage'
import './page/page.css'

measureLayoutUnscaled()

const AppAnimationPage = lazy(() =>
  import('./page/appAnimation/AppAnimationPage').then((module) => ({
    default: module.AppAnimationPage,
  }))
)

const page =
  window.location.pathname.replace(/\/$/, '') === '/app-animation-1' ? (
    <Suspense>
      <AppAnimationPage />
    </Suspense>
  ) : (
    <LandingPage />
  )

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SafeAreaProvider>
        <KeyboardProvider>
          <VexlThemeProvider defaultMode="dark">{page}</VexlThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </StrictMode>
  )
}
