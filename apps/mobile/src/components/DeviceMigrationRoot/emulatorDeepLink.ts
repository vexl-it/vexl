export const DEVICE_MIGRATION_EMULATOR_LINK_PREFIX =
  'app.vexl.it://device-migration-emulator'

export type EmulatorMigrationEndpointHost =
  | 'localhost'
  | '127.0.0.1'
  | '10.0.2.2'

export type EmulatorMigrationDeepLink =
  | {
      readonly action: 'pairing'
      readonly qrString: string
      readonly endpointHost?: EmulatorMigrationEndpointHost
    }
  | {readonly action: 'erase'; readonly qrString: string}
  | {readonly action: 'receipt'; readonly qrString: string}

const endpointHosts: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '10.0.2.2',
])

function decodeEndpointHost(
  value: string | null
): EmulatorMigrationEndpointHost | undefined {
  if (value === null || !endpointHosts.has(value)) return undefined
  if (value === 'localhost' || value === '127.0.0.1' || value === '10.0.2.2')
    return value
  return undefined
}

/**
 * Parses the private emulator-only migration link format. The QR payload stays
 * in memory and is intentionally never handed to the ordinary deep-link
 * pipeline, its MMKV de-duplication storage, or error reporting.
 */
export function parseEmulatorMigrationDeepLink(
  link: string
): EmulatorMigrationDeepLink | undefined {
  if (!__DEV__) return undefined

  let url: URL
  try {
    url = new URL(link)
  } catch {
    return undefined
  }

  if (
    url.protocol !== 'app.vexl.it:' ||
    url.hostname !== 'device-migration-emulator' ||
    url.username !== '' ||
    url.password !== '' ||
    url.hash !== ''
  )
    return undefined

  const segments = url.pathname.split('/').filter((segment) => segment !== '')
  if (segments.length !== 2) return undefined
  const action = segments[0]
  const encodedQrString = segments[1]
  if (encodedQrString === undefined || encodedQrString === '') return undefined

  let qrString: string
  try {
    qrString = decodeURIComponent(encodedQrString)
  } catch {
    return undefined
  }
  if (qrString === '') return undefined

  if (action === 'pairing') {
    for (const key of url.searchParams.keys()) {
      if (key !== 'endpointHost') return undefined
    }
    const endpointHostValue = url.searchParams.get('endpointHost')
    const endpointHost = decodeEndpointHost(endpointHostValue)
    if (endpointHostValue !== null && endpointHost === undefined)
      return undefined
    return endpointHost === undefined
      ? {action, qrString}
      : {action, qrString, endpointHost}
  }

  if (url.search !== '') return undefined
  if (action === 'erase' || action === 'receipt') return {action, qrString}
  return undefined
}
