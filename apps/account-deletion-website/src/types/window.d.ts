import type {Buffer} from 'buffer'

declare global {
  interface Window {
    Buffer?: typeof Buffer
    debugData?: boolean
    turnstile?: {
      reset: () => void
    }
  }
}

export {}
