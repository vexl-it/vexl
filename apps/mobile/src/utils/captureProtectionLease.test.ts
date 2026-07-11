const mockPrevent = jest.fn(async () => undefined)
const mockAllow = jest.fn(async () => undefined)

jest.mock('react-native-capture-protection', () => ({
  CaptureProtection: {
    prevent: mockPrevent,
    allow: mockAllow,
  },
  CaptureEventType: {
    CAPTURED: 'CAPTURED',
    RECORDING: 'RECORDING',
  },
}))

interface CaptureProtectionLeaseModule {
  acquireCaptureProtectionLease: () => () => void
  setBaselineCaptureProtection: (enabled: boolean) => void
  getActiveCaptureProtectionLeaseCount: () => number
}

// The module keeps counter state at module level; load it fresh per test.
const loadModule = (): CaptureProtectionLeaseModule => {
  let loaded: CaptureProtectionLeaseModule | undefined
  jest.isolateModules(() => {
    loaded = require('./captureProtectionLease')
  })
  if (loaded === undefined) throw new Error('module failed to load')
  return loaded
}

beforeEach(() => {
  mockPrevent.mockClear()
  mockAllow.mockClear()
})

describe('acquireCaptureProtectionLease', () => {
  it('enables protection on the first lease and disables it after the last release', () => {
    const {
      acquireCaptureProtectionLease,
      getActiveCaptureProtectionLeaseCount,
    } = loadModule()

    const releaseFirst = acquireCaptureProtectionLease()
    expect(mockPrevent).toHaveBeenCalledTimes(1)
    expect(mockAllow).not.toHaveBeenCalled()
    expect(getActiveCaptureProtectionLeaseCount()).toBe(1)

    const releaseSecond = acquireCaptureProtectionLease()
    // already protected — no redundant native call
    expect(mockPrevent).toHaveBeenCalledTimes(1)
    expect(getActiveCaptureProtectionLeaseCount()).toBe(2)

    releaseFirst()
    expect(mockAllow).not.toHaveBeenCalled()
    expect(getActiveCaptureProtectionLeaseCount()).toBe(1)

    releaseSecond()
    expect(mockAllow).toHaveBeenCalledTimes(1)
    expect(getActiveCaptureProtectionLeaseCount()).toBe(0)
  })

  it('releases each lease at most once (idempotent release)', () => {
    const {
      acquireCaptureProtectionLease,
      getActiveCaptureProtectionLeaseCount,
    } = loadModule()

    const releaseFirst = acquireCaptureProtectionLease()
    const releaseSecond = acquireCaptureProtectionLease()

    releaseFirst()
    releaseFirst()
    releaseFirst()

    // the double release must not have freed the second lease
    expect(getActiveCaptureProtectionLeaseCount()).toBe(1)
    expect(mockAllow).not.toHaveBeenCalled()

    releaseSecond()
    expect(getActiveCaptureProtectionLeaseCount()).toBe(0)
    expect(mockAllow).toHaveBeenCalledTimes(1)
  })
})

describe('setBaselineCaptureProtection', () => {
  it('drives protection when no lease is active', () => {
    const {setBaselineCaptureProtection} = loadModule()

    setBaselineCaptureProtection(true)
    expect(mockPrevent).toHaveBeenCalledTimes(1)

    setBaselineCaptureProtection(false)
    expect(mockAllow).toHaveBeenCalledTimes(1)
  })

  it('does not double-apply an unchanged state', () => {
    const {setBaselineCaptureProtection} = loadModule()

    setBaselineCaptureProtection(true)
    setBaselineCaptureProtection(true)
    expect(mockPrevent).toHaveBeenCalledTimes(1)
  })

  it('never lifts protection while a lease is active (protection wins)', () => {
    const {acquireCaptureProtectionLease, setBaselineCaptureProtection} =
      loadModule()

    setBaselineCaptureProtection(true)
    expect(mockPrevent).toHaveBeenCalledTimes(1)

    const release = acquireCaptureProtectionLease()
    // baseline turning off must not allow captures while the lease is held
    setBaselineCaptureProtection(false)
    expect(mockAllow).not.toHaveBeenCalled()

    release()
    expect(mockAllow).toHaveBeenCalledTimes(1)
  })

  it('keeps protection when the baseline turns on during an active lease and the lease is then released', () => {
    const {acquireCaptureProtectionLease, setBaselineCaptureProtection} =
      loadModule()

    const release = acquireCaptureProtectionLease()
    expect(mockPrevent).toHaveBeenCalledTimes(1)

    setBaselineCaptureProtection(true)
    release()

    // baseline still wants protection — no allow call
    expect(mockAllow).not.toHaveBeenCalled()

    setBaselineCaptureProtection(false)
    expect(mockAllow).toHaveBeenCalledTimes(1)
  })
})
