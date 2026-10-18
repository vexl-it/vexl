import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateClubUuid,
  type ClubKeys,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {
  KeyDerivationIndex,
  MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {Array, Data, Effect, Exit, Option, Schema} from 'effect'
import {
  CLUB_SCAN_BATCH_SIZE,
  INBOX_SCAN_BATCH_SIZE,
  scanClubs,
  scanDerivedKeys,
  scanInboxes,
  type ScanResult,
} from './scanDerivedKeys'

const masterSeed = Schema.decodeSync(MasterSeed)('33'.repeat(32))
const index = KeyDerivationIndex.make

const inboxPublicKey = async (i: number): Promise<PublicKeyPemBase64> =>
  (await Effect.runPromise(deriveInboxPrivateKey(masterSeed, index(i))))
    .publicKeyPemBase64

const scanIndexes = (
  used: readonly number[],
  probedBatches: number[][] = []
): Promise<ScanResult<number>> =>
  Effect.runPromise(
    scanDerivedKeys({
      batchSize: 4,
      margin: 3,
      derive: (i) => Effect.succeed(i),
      findExisting: (batch) =>
        Effect.sync(() => {
          probedBatches.push([...batch])
          return Array.map(batch, (i) =>
            Array.contains(used, i) ? Option.some(i) : Option.none()
          )
        }),
    })
  )

describe('scanDerivedKeys', () => {
  it('scans whole batches until a batch has no hit and continues a margin after the last hit', async () => {
    const probedBatches: number[][] = []

    const result = await scanIndexes([0, 3, 7, 8], probedBatches)

    expect(probedBatches).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
    ])
    expect(result).toEqual({found: [0, 3, 7, 8], nextIndex: 12})
  })

  it('starts after the margin when nothing is found', async () => {
    expect(await scanIndexes([])).toEqual({found: [], nextIndex: 3})
  })

  it('finds keys allocated after a restore in the next restore, without drifting', async () => {
    const used: number[] = []

    for (let restore = 0; restore < 3; restore++) {
      const {found, nextIndex} = await scanIndexes(used)
      expect(found).toEqual(used)
      // Allocate one new key after every restore.
      used.push(nextIndex)
    }
    expect(used).toEqual([3, 7, 11])

    const repeated = await scanIndexes(used)
    expect(await scanIndexes(used)).toEqual(repeated)
    expect(repeated.nextIndex).toBe(15)
  })
})

describe('scanInboxes', () => {
  it('checks derived inbox keys in batches of 200 and returns the existing ones', async () => {
    const existing = await Promise.all([
      inboxPublicKey(1),
      inboxPublicKey(INBOX_SCAN_BATCH_SIZE + 5),
    ])
    const checkInboxesExist = jest.fn(
      ({publicKeys}: {publicKeys: readonly PublicKeyPemBase64[]}) =>
        Effect.succeed({
          existingPublicKeys: Array.filter(publicKeys, (key) =>
            Array.contains(existing, key)
          ),
        })
    )
    const chatApi: Pick<ChatApi, 'checkInboxesExist'> = {checkInboxesExist}

    const result = await Effect.runPromise(scanInboxes({masterSeed, chatApi}))

    expect(checkInboxesExist).toHaveBeenCalledTimes(3)
    for (const [request] of checkInboxesExist.mock.calls)
      expect(request.publicKeys).toHaveLength(INBOX_SCAN_BATCH_SIZE)
    expect(checkInboxesExist.mock.calls[0]?.[0].publicKeys[0]).toBe(
      await inboxPublicKey(0)
    )
    expect(Array.map(result.found, (key) => key.publicKeyPemBase64)).toEqual(
      existing
    )
    expect(result.nextIndex).toBe(INBOX_SCAN_BATCH_SIZE + 5 + 1 + 100)
  })
})

class FakeNetworkError extends Data.TaggedError('FakeNetworkError') {}

describe('scanClubs', () => {
  it('restores clubs the derived keys are members of and stops after a batch of misses', async () => {
    const [firstClub, secondClub, unreachableClub] = Array.makeBy(3, () =>
      generateClubUuid()
    )
    const memberships = new Map(
      await Promise.all(
        Array.map(
          [
            [2, firstClub],
            [CLUB_SCAN_BATCH_SIZE + 5, secondClub],
            // After a whole batch of misses - never reached.
            [4 * CLUB_SCAN_BATCH_SIZE, unreachableClub],
          ] satisfies Array<[number, ClubUuid | undefined]>,
          async ([i, clubUuid]) =>
            [
              (await Effect.runPromise(deriveClubKeys(masterSeed, index(i))))
                .keyPair.publicKey,
              clubUuid,
            ] satisfies [string, ClubUuid | undefined]
        )
      )
    )
    const findClubUuid = jest.fn((keys: ClubKeys) =>
      Effect.succeed(
        Option.fromNullable(memberships.get(keys.keyPair.publicKey))
      )
    )

    const result = await Effect.runPromise(
      scanClubs({masterSeed, findClubUuid})
    )

    expect(findClubUuid).toHaveBeenCalledTimes(3 * CLUB_SCAN_BATCH_SIZE)
    expect(Array.map(result.found, (one) => one.clubUuid)).toEqual([
      firstClub,
      secondClub,
    ])
    expect(result.found[0]?.keys).toEqual(
      await Effect.runPromise(deriveClubKeys(masterSeed, index(2)))
    )
    expect(result.nextIndex).toBe(CLUB_SCAN_BATCH_SIZE + 5 + 1 + 10)
  })

  it('fails instead of guessing when a club check fails', async () => {
    const exit = await Effect.runPromiseExit(
      scanClubs({
        masterSeed,
        findClubUuid: () => Effect.fail(new FakeNetworkError()),
      })
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
