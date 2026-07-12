import {resolveMigrationEndpointHost} from './emulatorEndpointOverride'

describe('resolveMigrationEndpointHost', () => {
  it('uses the per-run emulator route in development', () => {
    expect(resolveMigrationEndpointHost('192.168.1.20', '10.0.2.2', true)).toBe(
      '10.0.2.2'
    )
  })

  it('cannot change a production endpoint', () => {
    expect(
      resolveMigrationEndpointHost('192.168.1.20', '10.0.2.2', false)
    ).toBe('192.168.1.20')
  })
})
