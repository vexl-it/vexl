import {VexlThemeProvider} from '@vexl-next/ui'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {measureLayoutUnscaled} from './demos/shared/unscaledLayout'
import './fonts.css'
import {LandingPage} from './page/LandingPage'
import './page/page.css'

measureLayoutUnscaled()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SafeAreaProvider>
        <KeyboardProvider>
          <VexlThemeProvider defaultMode="dark">
            <LandingPage />
          </VexlThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </StrictMode>
  )
}
