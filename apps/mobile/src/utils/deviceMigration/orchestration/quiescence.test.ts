import {TransferId} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {Effect, Either, Schema} from 'effect'
import {
  DrainTimeoutError,
  drainAndBlockVexlRequests,
  reopenVexlRequests,
} from '../../../api/vexlHttpClientLayer'
import {
  flushAllPendingMmkvWrites,
  freezeMmkvPersistence,
} from '../../atomUtils/mmkvMigrationRegistry'
import {interruptAndAwaitAllInAppLoadingTasks} from '../../inAppLoadingTasks/managedTaskFibers'
import {transitionMigrationControl} from '../controlStore'
import {enterSourceQuiescence} from './quiescence'

jest.mock('../../../api/vexlHttpClientLayer', () => ({
  DrainTimeoutError: class DrainTimeoutError extends Error {
    readonly marker = true
  },
  drainAndBlockVexlRequests: jest.fn(),
  reopenVexlRequests: jest.fn(),
}))
jest.mock('../../atomUtils/mmkvMigrationRegistry', () => ({
  flushAllPendingMmkvWrites: jest.fn(),
  freezeMmkvPersistence: jest.fn(),
}))
jest.mock('../../inAppLoadingTasks/managedTaskFibers', () => ({
  interruptAndAwaitAllInAppLoadingTasks: jest.fn(),
}))
jest.mock('../controlStore', () => ({
  transitionMigrationControl: jest.fn(),
}))

const transferId = Schema.decodeSync(TransferId)('A'.repeat(43))

describe('source quiescence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(interruptAndAwaitAllInAppLoadingTasks)
      .mockReturnValue(Effect.void)
  })

  it('restores normal mode and reopens egress when drain times out', async () => {
    jest
      .mocked(drainAndBlockVexlRequests)
      .mockReturnValue(Effect.fail(new DrainTimeoutError()))
    const result = await Effect.runPromise(
      enterSourceQuiescence(transferId).pipe(Effect.either)
    )
    expect(Either.isLeft(result) && result.left.code).toBe('timedOut')
    expect(transitionMigrationControl).toHaveBeenNthCalledWith(
      1,
      ['normal'],
      expect.objectContaining({mode: 'sourceQuiescing'})
    )
    expect(reopenVexlRequests).toHaveBeenCalledTimes(1)
    expect(transitionMigrationControl).toHaveBeenNthCalledWith(
      2,
      ['sourceQuiescing'],
      {mode: 'normal'}
    )
    expect(flushAllPendingMmkvWrites).not.toHaveBeenCalled()
    expect(freezeMmkvPersistence).not.toHaveBeenCalled()
  })

  it('flushes and freezes only after a successful drain', async () => {
    jest.mocked(drainAndBlockVexlRequests).mockReturnValue(Effect.void)
    await Effect.runPromise(enterSourceQuiescence(transferId))
    expect(flushAllPendingMmkvWrites).toHaveBeenCalledTimes(1)
    expect(freezeMmkvPersistence).toHaveBeenCalledTimes(1)
    expect(transitionMigrationControl).toHaveBeenLastCalledWith(
      ['sourceQuiescing'],
      expect.objectContaining({mode: 'sourceServing', transferId})
    )
  })
})
