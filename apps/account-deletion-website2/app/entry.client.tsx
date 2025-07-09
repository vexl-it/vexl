import {RemixBrowser} from '@remix-run/react'
import {Buffer} from 'buffer/'
import {startTransition, StrictMode} from 'react'
import {hydrateRoot} from 'react-dom/client'

// @ts-expect-error Buffer polyfill
window.Buffer = Buffer
// @ts-expect-error needs to be defined for crypto libs to work
window.process = {}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  )
})
