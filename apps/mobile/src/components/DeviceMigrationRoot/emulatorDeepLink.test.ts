import {
  DEVICE_MIGRATION_EMULATOR_LINK_PREFIX,
  parseEmulatorMigrationDeepLink,
} from './emulatorDeepLink'

describe('parseEmulatorMigrationDeepLink', () => {
  it('parses each migration QR action without changing its payload', () => {
    const qrString = 'base64url-sensitive_payload'

    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/pairing/${qrString}`
      )
    ).toEqual({action: 'pairing', qrString})
    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/erase/${qrString}`
      )
    ).toEqual({action: 'erase', qrString})
    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/receipt/${qrString}`
      )
    ).toEqual({action: 'receipt', qrString})
  })

  it('accepts only emulator-safe transient endpoint overrides', () => {
    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/pairing/qr?endpointHost=10.0.2.2`
      )
    ).toEqual({
      action: 'pairing',
      qrString: 'qr',
      endpointHost: '10.0.2.2',
    })
    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/pairing/qr?endpointHost=example.com`
      )
    ).toBeUndefined()
  })

  it('rejects links outside the private format and unexpected parameters', () => {
    expect(
      parseEmulatorMigrationDeepLink('https://app.vexl.it/pairing/qr')
    ).toBeUndefined()
    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/erase/qr?unexpected=value`
      )
    ).toBeUndefined()
    expect(
      parseEmulatorMigrationDeepLink(
        `${DEVICE_MIGRATION_EMULATOR_LINK_PREFIX}/unknown/qr`
      )
    ).toBeUndefined()
  })
})
