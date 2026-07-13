import {
  MmkvKeyOwnershipConflictError,
  flushAllPendingMmkvWrites,
  freezeMmkvPersistence,
  getRegisteredDynamicKeyFamilyPrefixes,
  getRegisteredStaticKeys,
  isMmkvPersistenceFrozen,
  registerDynamicMmkvKeyFamily,
  registerMmkvKey,
  resolveMmkvKeyPolicy,
  unfreezeMmkvPersistence,
} from './mmkvMigrationRegistry'

// NOTE: the registry is module-level state shared by all tests in this file.
// Every test uses its own unique keys/prefixes so tests stay independent.

afterEach(() => {
  unfreezeMmkvPersistence()
})

describe('registerMmkvKey / resolveMmkvKeyPolicy', () => {
  it('registers a static key and resolves its policy and native type', () => {
    registerMmkvKey({
      key: 'unit-static-a',
      policy: 'account',
      nativeType: 'string',
    })

    expect(resolveMmkvKeyPolicy('unit-static-a')).toEqual({
      policy: 'account',
      nativeType: 'string',
    })
    expect(getRegisteredStaticKeys()).toContain('unit-static-a')
  })

  it('returns undefined for unknown keys — no permissive default', () => {
    expect(resolveMmkvKeyPolicy('unit-never-registered')).toBeUndefined()
  })

  it('tolerates re-registration of the same key with the same policy and type', () => {
    const flushA = jest.fn()
    const flushB = jest.fn()
    registerMmkvKey({
      key: 'unit-static-repeat',
      policy: 'preference',
      nativeType: 'string',
      flushNow: flushA,
    })
    expect(() => {
      registerMmkvKey({
        key: 'unit-static-repeat',
        policy: 'preference',
        nativeType: 'string',
        flushNow: flushB,
      })
    }).not.toThrow()

    flushAllPendingMmkvWrites()
    // both instances' flush fns are kept and invoked
    expect(flushA).toHaveBeenCalledTimes(1)
    expect(flushB).toHaveBeenCalledTimes(1)
  })

  it('throws when the same key is re-registered with a different policy', () => {
    registerMmkvKey({
      key: 'unit-static-conflict-policy',
      policy: 'account',
      nativeType: 'string',
    })
    expect(() => {
      registerMmkvKey({
        key: 'unit-static-conflict-policy',
        policy: 'deviceLocal',
        nativeType: 'string',
      })
    }).toThrow(MmkvKeyOwnershipConflictError)
  })

  it('throws when the same key is re-registered with a different native type', () => {
    registerMmkvKey({
      key: 'unit-static-conflict-type',
      policy: 'deviceLocal',
      nativeType: 'string',
    })
    expect(() => {
      registerMmkvKey({
        key: 'unit-static-conflict-type',
        policy: 'deviceLocal',
        nativeType: 'boolean',
      })
    }).toThrow(MmkvKeyOwnershipConflictError)
  })
})

describe('registerDynamicMmkvKeyFamily', () => {
  it('resolves keys matched by the family parser', () => {
    registerDynamicMmkvKeyFamily({
      prefix: 'unit-family-a-',
      parseKey: (key) => key.startsWith('unit-family-a-'),
      policy: 'account',
      nativeType: 'string',
    })

    expect(resolveMmkvKeyPolicy('unit-family-a-123')).toEqual({
      policy: 'account',
      nativeType: 'string',
    })
    expect(resolveMmkvKeyPolicy('unit-family-a')).toBeUndefined()
    expect(getRegisteredDynamicKeyFamilyPrefixes()).toContain('unit-family-a-')
  })

  it('records per-key instance flush fns under the family', () => {
    registerDynamicMmkvKeyFamily({
      prefix: 'unit-family-flush-',
      parseKey: (key) => key.startsWith('unit-family-flush-'),
      policy: 'account',
      nativeType: 'string',
    })

    const flushFirstInstance = jest.fn()
    const flushSecondInstance = jest.fn()
    registerMmkvKey({
      key: 'unit-family-flush-1',
      policy: 'account',
      nativeType: 'string',
      flushNow: flushFirstInstance,
    })
    // dynamic atoms are recreated per mount — the newest instance for the
    // same key supersedes the previous one
    registerMmkvKey({
      key: 'unit-family-flush-1',
      policy: 'account',
      nativeType: 'string',
      flushNow: flushSecondInstance,
    })

    flushAllPendingMmkvWrites()
    expect(flushFirstInstance).not.toHaveBeenCalled()
    expect(flushSecondInstance).toHaveBeenCalledTimes(1)

    // the family key is not listed as a static key
    expect(getRegisteredStaticKeys()).not.toContain('unit-family-flush-1')
  })

  it('throws when a family key instance registers with a different policy', () => {
    registerDynamicMmkvKeyFamily({
      prefix: 'unit-family-conflict-',
      parseKey: (key) => key.startsWith('unit-family-conflict-'),
      policy: 'account',
      nativeType: 'string',
    })
    expect(() => {
      registerMmkvKey({
        key: 'unit-family-conflict-1',
        policy: 'ephemeral',
        nativeType: 'string',
      })
    }).toThrow(MmkvKeyOwnershipConflictError)
  })

  it('tolerates repeated family registration with identical policy and type', () => {
    const prefix = 'unit-family-repeat-'
    const parseKey = (key: string): boolean => key.startsWith(prefix)
    registerDynamicMmkvKeyFamily({
      prefix,
      parseKey,
      policy: 'account',
      nativeType: 'string',
    })
    expect(() => {
      registerDynamicMmkvKeyFamily({
        prefix,
        parseKey,
        policy: 'account',
        nativeType: 'string',
      })
    }).not.toThrow()
  })

  it('throws when the same family prefix re-registers with a different policy', () => {
    registerDynamicMmkvKeyFamily({
      prefix: 'unit-family-policy-conflict-',
      parseKey: (key) => key.startsWith('unit-family-policy-conflict-'),
      policy: 'account',
      nativeType: 'string',
    })
    expect(() => {
      registerDynamicMmkvKeyFamily({
        prefix: 'unit-family-policy-conflict-',
        parseKey: (key) => key.startsWith('unit-family-policy-conflict-'),
        policy: 'deviceLocal',
        nativeType: 'string',
      })
    }).toThrow(MmkvKeyOwnershipConflictError)
  })

  it('static keys take precedence over dynamic families in resolution', () => {
    // a static key registered before the family matching it
    registerMmkvKey({
      key: 'unit-precedence-special',
      policy: 'deviceLocal',
      nativeType: 'string',
    })
    registerDynamicMmkvKeyFamily({
      prefix: 'unit-precedence-',
      parseKey: (key) => key.startsWith('unit-precedence-'),
      policy: 'account',
      nativeType: 'string',
    })

    expect(resolveMmkvKeyPolicy('unit-precedence-special')).toEqual({
      policy: 'deviceLocal',
      nativeType: 'string',
    })
    expect(resolveMmkvKeyPolicy('unit-precedence-other')).toEqual({
      policy: 'account',
      nativeType: 'string',
    })
  })
})

describe('freeze flags', () => {
  it('freeze / unfreeze toggle isMmkvPersistenceFrozen', () => {
    expect(isMmkvPersistenceFrozen()).toBe(false)
    freezeMmkvPersistence()
    expect(isMmkvPersistenceFrozen()).toBe(true)
    // idempotent
    freezeMmkvPersistence()
    expect(isMmkvPersistenceFrozen()).toBe(true)
    unfreezeMmkvPersistence()
    expect(isMmkvPersistenceFrozen()).toBe(false)
  })
})
