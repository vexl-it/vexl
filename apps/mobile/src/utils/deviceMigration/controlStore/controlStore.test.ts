import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  SourceErasedReceiptQrCode,
  type MigrationEndpointCandidate,
} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {
  testCleanupResultDigest,
  testCommandNonce,
  testEraseCommandDigest,
  testManifestDigest,
  testQrAuthMac,
  testReceiptNonce,
  testSha256,
  testSnapshotContentDigest,
  testStagingReceiptDigest,
  testTransferId,
  testVersionTriple,
} from '@vexl-next/domain/src/general/deviceMigration/testFixtures'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {
  completeSourceCleanupProgress,
  emptySourceCleanupProgress,
  isSourceCleanupComplete,
  LEGAL_MIGRATION_CONTROL_TRANSITIONS,
  MigrationControlRecord,
  needsManualRecovery,
  type IssuedEraseCommand,
  type MigrationControlMode,
} from './domain'
import {
  clearMigrationControlRecord,
  MIGRATION_CONTROL_RECORD_KEY,
  migrationControlStorage,
  readMigrationControlRecord,
  subscribeToMigrationControlRecord,
  transitionMigrationControl,
  writeMigrationControlRecord,
} from './index'

const t0 = Schema.decodeSync(UnixMilliseconds)(1751000000000)
const t5min = Schema.decodeSync(UnixMilliseconds)(1751000300000)

const testEndpoint: MigrationEndpointCandidate = {
  host: '192.168.1.10',
  port: 5555,
}

const testReceipt = new SourceErasedReceiptQrCode({
  qrSchemaVersion: 1,
  version: testVersionTriple,
  transferId: testTransferId,
  manifestDigest: testManifestDigest,
  snapshotContentDigest: testSnapshotContentDigest,
  acceptedEraseCommandDigest: testEraseCommandDigest,
  acceptedEraseCommandNonce: testCommandNonce,
  receiptNonce: testReceiptNonce,
  cleanupResultDigest: testCleanupResultDigest,
  issuedAt: t0,
  mac: testQrAuthMac,
})

const testIssuedEraseCommand: IssuedEraseCommand = {
  eraseCommandDigest: testEraseCommandDigest,
  commandNonce: testCommandNonce,
  issuedAt: t0,
  expiresAt: t5min,
}

const sourceSnapshotFields = {
  enteredAt: t0,
  transferId: testTransferId,
  pairingTranscriptDigest: testSha256,
  manifestDigest: testManifestDigest,
  snapshotContentDigest: testSnapshotContentDigest,
}

const sourceCommittedFields = {
  ...sourceSnapshotFields,
  stagingReceiptDigest: testStagingReceiptDigest,
  acceptedEraseCommandDigest: testEraseCommandDigest,
  acceptedEraseCommandNonce: testCommandNonce,
}

const destinationStagedFields = {
  enteredAt: t0,
  transferId: testTransferId,
  pairingTranscriptDigest: testSha256,
  manifestDigest: testManifestDigest,
  snapshotContentDigest: testSnapshotContentDigest,
  stagingReceiptDigest: testStagingReceiptDigest,
}

const recordForMode: Record<MigrationControlMode, MigrationControlRecord> = {
  normal: {mode: 'normal'},
  sourceQuiescing: {mode: 'sourceQuiescing', enteredAt: t0},
  sourceServing: {
    mode: 'sourceServing',
    enteredAt: t0,
    transferId: testTransferId,
    pairingTranscriptDigest: testSha256,
  },
  sourceSnapshotSent: {mode: 'sourceSnapshotSent', ...sourceSnapshotFields},
  sourceAwaitingEraseCommand: {
    mode: 'sourceAwaitingEraseCommand',
    ...sourceSnapshotFields,
    stagingReceiptDigest: testStagingReceiptDigest,
  },
  sourceRetirementCommitted: {
    mode: 'sourceRetirementCommitted',
    ...sourceCommittedFields,
  },
  sourceErasing: {
    mode: 'sourceErasing',
    ...sourceCommittedFields,
    cleanupProgress: emptySourceCleanupProgress,
  },
  sourceErasedAwaitingDestinationAck: {
    mode: 'sourceErasedAwaitingDestinationAck',
    ...sourceCommittedFields,
    cleanupProgress: completeSourceCleanupProgress,
    sourceErasedReceipt: testReceipt,
  },
  sourceComplete: {
    mode: 'sourceComplete',
    enteredAt: t0,
    transferId: testTransferId,
  },
  destinationReceiving: {
    mode: 'destinationReceiving',
    enteredAt: t0,
    transferId: testTransferId,
    sourceVersion: testVersionTriple,
    sourceEndpointCandidates: [testEndpoint],
    pairingTranscriptDigest: testSha256,
  },
  destinationStaged: {
    mode: 'destinationStaged',
    ...destinationStagedFields,
    sourceEndpointCandidates: [testEndpoint],
  },
  destinationEraseCommandAvailable: {
    mode: 'destinationEraseCommandAvailable',
    ...destinationStagedFields,
    issuedEraseCommands: [testIssuedEraseCommand],
  },
  destinationAwaitingSourceOutcome: {
    mode: 'destinationAwaitingSourceOutcome',
    ...destinationStagedFields,
    issuedEraseCommands: [testIssuedEraseCommand],
  },
  destinationSourceEraseConfirmed: {
    mode: 'destinationSourceEraseConfirmed',
    ...destinationStagedFields,
    issuedEraseCommands: [testIssuedEraseCommand],
    sourceErasedReceipt: testReceipt,
  },
  destinationInstalling: {
    mode: 'destinationInstalling',
    ...destinationStagedFields,
    issuedEraseCommands: [testIssuedEraseCommand],
    sourceErasedReceipt: testReceipt,
  },
  destinationActivating: {
    mode: 'destinationActivating',
    ...destinationStagedFields,
    issuedEraseCommands: [testIssuedEraseCommand],
    sourceErasedReceipt: testReceipt,
  },
  destinationComplete: {
    mode: 'destinationComplete',
    enteredAt: t0,
    transferId: testTransferId,
  },
}

const ALL_MODES: readonly MigrationControlMode[] = [
  'normal',
  'sourceQuiescing',
  'sourceServing',
  'sourceSnapshotSent',
  'sourceAwaitingEraseCommand',
  'sourceRetirementCommitted',
  'sourceErasing',
  'sourceErasedAwaitingDestinationAck',
  'sourceComplete',
  'destinationReceiving',
  'destinationStaged',
  'destinationEraseCommandAvailable',
  'destinationAwaitingSourceOutcome',
  'destinationSourceEraseConfirmed',
  'destinationInstalling',
  'destinationActivating',
  'destinationComplete',
]

const encodeRecord = Schema.encodeSync(MigrationControlRecord)

const expectStateInvalid = (fn: () => void): void => {
  let caught: unknown
  try {
    fn()
  } catch (e) {
    caught = e
  }
  expect(caught).toBeInstanceOf(DeviceMigrationError)
  if (caught instanceof DeviceMigrationError)
    expect(caught.code).toBe('stateInvalid')
}

beforeEach(() => {
  migrationControlStorage.clearAll()
})

describe('readMigrationControlRecord', () => {
  it('returns the normal mode when no record is stored', () => {
    const result = readMigrationControlRecord()
    expect(result).toEqual({mode: 'normal'})
    expect(needsManualRecovery(result)).toBe(false)
  })

  it.each(ALL_MODES)('round-trips the %s record', (mode) => {
    const record = recordForMode[mode]
    writeMigrationControlRecord(record)

    const read = readMigrationControlRecord()
    expect(read.mode).toBe(mode)
    expect(needsManualRecovery(read)).toBe(false)
    if (read.mode !== 'recoveryRequired')
      expect(encodeRecord(read)).toEqual(encodeRecord(record))
  })

  it('returns referentially stable results for unchanged storage', () => {
    writeMigrationControlRecord(recordForMode.sourceRetirementCommitted)
    expect(readMigrationControlRecord()).toBe(readMigrationControlRecord())
  })

  it('quarantines a raw value that is not valid JSON', () => {
    migrationControlStorage.set(MIGRATION_CONTROL_RECORD_KEY, 'garbage!!!')
    const result = readMigrationControlRecord()
    expect(result.mode).toBe('recoveryRequired')
    expect(needsManualRecovery(result)).toBe(true)
  })

  it('quarantines valid JSON that fails schema validation', () => {
    migrationControlStorage.set(
      MIGRATION_CONTROL_RECORD_KEY,
      JSON.stringify({mode: 'sourceRetirementCommitted'})
    )
    const result = readMigrationControlRecord()
    expect(result.mode).toBe('recoveryRequired')
    expect(needsManualRecovery(result)).toBe(true)
  })

  it('quarantines an unknown mode instead of treating it as normal', () => {
    migrationControlStorage.set(
      MIGRATION_CONTROL_RECORD_KEY,
      JSON.stringify({mode: 'somethingElse'})
    )
    expect(readMigrationControlRecord().mode).toBe('recoveryRequired')
  })

  it('quarantines a key holding a non-string value', () => {
    migrationControlStorage.set(MIGRATION_CONTROL_RECORD_KEY, true)
    expect(readMigrationControlRecord().mode).toBe('recoveryRequired')
  })
})

describe('quarantined record', () => {
  beforeEach(() => {
    migrationControlStorage.set(MIGRATION_CONTROL_RECORD_KEY, 'corrupt')
  })

  it('refuses every transition', () => {
    expectStateInvalid(() => {
      transitionMigrationControl(['normal'], recordForMode.sourceQuiescing)
    })
    expectStateInvalid(() => {
      transitionMigrationControl(ALL_MODES, recordForMode.normal)
    })
  })

  it('refuses clearing', () => {
    expectStateInvalid(() => {
      clearMigrationControlRecord()
    })
    // the corrupt value must survive the refused clear
    expect(readMigrationControlRecord().mode).toBe('recoveryRequired')
  })
})

describe('transitionMigrationControl', () => {
  it('walks the full source happy path', () => {
    const path: readonly MigrationControlMode[] = [
      'sourceQuiescing',
      'sourceServing',
      'sourceSnapshotSent',
      'sourceAwaitingEraseCommand',
      'sourceRetirementCommitted',
      'sourceErasing',
      'sourceErasedAwaitingDestinationAck',
      'sourceComplete',
      'normal',
    ]
    let currentMode: MigrationControlMode = 'normal'
    for (const nextMode of path) {
      transitionMigrationControl([currentMode], recordForMode[nextMode])
      expect(readMigrationControlRecord().mode).toBe(nextMode)
      currentMode = nextMode
    }
  })

  it('walks the full destination happy path', () => {
    const path: readonly MigrationControlMode[] = [
      'destinationReceiving',
      'destinationStaged',
      'destinationEraseCommandAvailable',
      'destinationAwaitingSourceOutcome',
      'destinationSourceEraseConfirmed',
      'destinationInstalling',
      'destinationActivating',
      'destinationComplete',
      'normal',
    ]
    let currentMode: MigrationControlMode = 'normal'
    for (const nextMode of path) {
      transitionMigrationControl([currentMode], recordForMode[nextMode])
      expect(readMigrationControlRecord().mode).toBe(nextMode)
      currentMode = nextMode
    }
  })

  it('allows the direct LAN path skipping destinationAwaitingSourceOutcome', () => {
    writeMigrationControlRecord(recordForMode.destinationEraseCommandAvailable)
    transitionMigrationControl(
      ['destinationEraseCommandAvailable'],
      recordForMode.destinationSourceEraseConfirmed
    )
    expect(readMigrationControlRecord().mode).toBe(
      'destinationSourceEraseConfirmed'
    )
  })

  it('permits safe cancellation from every pre-commit state', () => {
    const cancellable: readonly MigrationControlMode[] = [
      'sourceQuiescing',
      'sourceServing',
      'sourceSnapshotSent',
      'sourceAwaitingEraseCommand',
      'destinationReceiving',
      'destinationStaged',
    ]
    for (const mode of cancellable) {
      migrationControlStorage.clearAll()
      writeMigrationControlRecord(recordForMode[mode])
      transitionMigrationControl([mode], recordForMode.normal)
      expect(readMigrationControlRecord().mode).toBe('normal')
    }
  })

  it('matches the full legality matrix', () => {
    for (const from of ALL_MODES) {
      for (const to of ALL_MODES) {
        migrationControlStorage.clearAll()
        writeMigrationControlRecord(recordForMode[from])

        const legal = LEGAL_MIGRATION_CONTROL_TRANSITIONS[from].includes(to)
        if (legal) {
          transitionMigrationControl([from], recordForMode[to])
          expect(readMigrationControlRecord().mode).toBe(to)
        } else {
          expectStateInvalid(() => {
            transitionMigrationControl([from], recordForMode[to])
          })
          // the refused transition must not have changed the record
          expect(readMigrationControlRecord().mode).toBe(from)
        }
      }
    }
  })

  it('rejects representative illegal jumps', () => {
    const illegalJumps: ReadonlyArray<
      readonly [MigrationControlMode, MigrationControlMode]
    > = [
      ['normal', 'sourceRetirementCommitted'],
      ['normal', 'destinationSourceEraseConfirmed'],
      ['sourceQuiescing', 'sourceSnapshotSent'],
      ['sourceServing', 'sourceAwaitingEraseCommand'],
      ['sourceServing', 'sourceRetirementCommitted'],
      ['destinationReceiving', 'destinationSourceEraseConfirmed'],
      ['destinationStaged', 'destinationInstalling'],
      ['destinationSourceEraseConfirmed', 'normal'],
      ['destinationInstalling', 'normal'],
    ]
    for (const [from, to] of illegalJumps) {
      migrationControlStorage.clearAll()
      writeMigrationControlRecord(recordForMode[from])
      expectStateInvalid(() => {
        transitionMigrationControl([from], recordForMode[to])
      })
    }
  })

  it('never lets sourceRetirementCommitted (or later) return to a cancellable state', () => {
    const committed: readonly MigrationControlMode[] = [
      'sourceRetirementCommitted',
      'sourceErasing',
      'sourceErasedAwaitingDestinationAck',
    ]
    const forbiddenTargets: readonly MigrationControlMode[] = [
      'normal',
      'sourceQuiescing',
      'sourceServing',
    ]
    for (const from of committed) {
      for (const to of forbiddenTargets) {
        migrationControlStorage.clearAll()
        writeMigrationControlRecord(recordForMode[from])
        expectStateInvalid(() => {
          transitionMigrationControl([from], recordForMode[to])
        })
        expect(readMigrationControlRecord().mode).toBe(from)
      }
    }
  })

  it('rejects a legal edge when the current mode is not among the expected ones', () => {
    writeMigrationControlRecord(recordForMode.sourceServing)
    expectStateInvalid(() => {
      transitionMigrationControl(
        ['sourceQuiescing'],
        recordForMode.sourceSnapshotSent
      )
    })
    expect(readMigrationControlRecord().mode).toBe('sourceServing')
  })

  it('allows self-transitions that update state data', () => {
    writeMigrationControlRecord(recordForMode.sourceErasing)
    const updated: MigrationControlRecord = {
      mode: 'sourceErasing',
      ...sourceCommittedFields,
      cleanupProgress: {
        ...emptySourceCleanupProgress,
        asyncStorageSessionDeleted: true,
      },
    }
    transitionMigrationControl(['sourceErasing'], updated)
    const read = readMigrationControlRecord()
    expect(read.mode).toBe('sourceErasing')
    if (read.mode === 'sourceErasing') {
      expect(read.cleanupProgress.asyncStorageSessionDeleted).toBe(true)
      expect(isSourceCleanupComplete(read.cleanupProgress)).toBe(false)
    }
  })
})

describe('clearMigrationControlRecord', () => {
  it('clears from states whose graph allows returning to normal', () => {
    const clearable: readonly MigrationControlMode[] = [
      'sourceQuiescing',
      'sourceServing',
      'sourceSnapshotSent',
      'sourceAwaitingEraseCommand',
      'sourceComplete',
      'destinationReceiving',
      'destinationStaged',
      'destinationComplete',
    ]
    for (const mode of clearable) {
      migrationControlStorage.clearAll()
      writeMigrationControlRecord(recordForMode[mode])
      clearMigrationControlRecord()
      expect(readMigrationControlRecord()).toEqual({mode: 'normal'})
      expect(
        migrationControlStorage.contains(MIGRATION_CONTROL_RECORD_KEY)
      ).toBe(false)
    }
  })

  it('refuses to clear the committed and post-commit source states', () => {
    const notClearable: readonly MigrationControlMode[] = [
      'sourceRetirementCommitted',
      'sourceErasing',
      'sourceErasedAwaitingDestinationAck',
      'destinationSourceEraseConfirmed',
      'destinationInstalling',
      'destinationActivating',
    ]
    for (const mode of notClearable) {
      migrationControlStorage.clearAll()
      writeMigrationControlRecord(recordForMode[mode])
      expectStateInvalid(() => {
        clearMigrationControlRecord()
      })
      expect(readMigrationControlRecord().mode).toBe(mode)
    }
  })

  it('is a no-op success when nothing is stored', () => {
    clearMigrationControlRecord()
    expect(readMigrationControlRecord()).toEqual({mode: 'normal'})
  })
})

describe('subscribeToMigrationControlRecord', () => {
  it('notifies on writes and deletions until unsubscribed', () => {
    const listener = jest.fn()
    const unsubscribe = subscribeToMigrationControlRecord(listener)

    writeMigrationControlRecord(recordForMode.sourceQuiescing)
    expect(listener).toHaveBeenCalledTimes(1)

    clearMigrationControlRecord()
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    writeMigrationControlRecord(recordForMode.sourceQuiescing)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('ignores changes of unrelated keys', () => {
    const listener = jest.fn()
    const unsubscribe = subscribeToMigrationControlRecord(listener)

    migrationControlStorage.set('someOtherKey', 'value')
    expect(listener).not.toHaveBeenCalled()

    unsubscribe()
  })
})
