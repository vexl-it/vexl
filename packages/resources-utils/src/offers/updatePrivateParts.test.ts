import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateAdminId,
  OfferPrivatePart,
  SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, HashMap, Option, Schema} from 'effect'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'
import {eciesDecryptE} from '../utils/crypto'
import updatePrivateParts from './updatePrivateParts'

jest.mock('../reportErrorFromResourcesUtils')

beforeEach(() => jest.mocked(reportErrorFromResourcesUtils).mockClear())
afterEach(() => jest.restoreAllMocks())

const recipient = generatePrivateKey()
const publicKey = recipient.publicKeyPemBase64
const otherRecipient = generatePrivateKey()
const friend = Schema.decodeSync(HashedPhoneNumber)('common-friend')
const newFriend = Schema.decodeSync(HashedPhoneNumber)('new-common-friend')
const connections = {firstLevel: [], secondLevel: [publicKey], clubs: {}}

function setup(): {
  params: Parameters<typeof updatePrivateParts>[0]
  createPrivatePart: jest.MockedFunction<OfferApi['createPrivatePart']>
  deletePrivatePart: jest.MockedFunction<OfferApi['deletePrivatePart']>
  readUploadedPayload: () => Promise<OfferPrivatePart>
} {
  const createPrivatePart = jest.fn<
    ReturnType<OfferApi['createPrivatePart']>,
    Parameters<OfferApi['createPrivatePart']>
  >(() => Effect.succeed({}))
  const deletePrivatePart = jest.fn<
    ReturnType<OfferApi['deletePrivatePart']>,
    Parameters<OfferApi['deletePrivatePart']>
  >(() => Effect.succeed({}))
  const unusedApiCall = (): Effect.Effect<never> =>
    Effect.die('Unexpected API call')
  const params: Parameters<typeof updatePrivateParts>[0] = {
    api: {
      createPrivatePart,
      deletePrivatePart,
      getOffersForMeModifiedOrCreatedAfterPaginated: unusedApiCall,
      getClubOffersForMeModifiedOrCreatedAfterPaginated: unusedApiCall,
      createNewOffer: unusedApiCall,
      refreshOffer: unusedApiCall,
      deleteOffer: unusedApiCall,
      updateOffer: unusedApiCall,
      getRemovedOffers: unusedApiCall,
      getRemovedClubOffers: unusedApiCall,
      reportOffer: unusedApiCall,
      reportClubOffer: unusedApiCall,
      getNotesForMeModifiedOrCreatedAfterPaginated: unusedApiCall,
      createNewNote: unusedApiCall,
      deleteNote: unusedApiCall,
      createNotePrivatePart: unusedApiCall,
      deleteNotePrivatePart: unusedApiCall,
      createRepostNotePrivatePart: unusedApiCall,
      repostNote: unusedApiCall,
      undoRepostNote: unusedApiCall,
      getRemovedNotes: unusedApiCall,
      reportNote: unusedApiCall,
      createChallenge: unusedApiCall,
    },
    adminId: generateAdminId(),
    symmetricKey: Schema.decodeSync(SymmetricKey)('symmetric-key'),
    currentConnections: connections,
    targetConnections: connections,
    commonFriends: HashMap.make([publicKey, [friend]]),
    verifiedFriends: HashMap.empty(),
  }
  const readUploadedPayload = async (): Promise<OfferPrivatePart> => {
    const request = createPrivatePart.mock.lastCall?.[0]
    const part = request?.offerPrivateList[0]
    expect(part?.userPublicKey).toBe(publicKey)
    if (!part) throw new Error('Expected an uploaded private part')
    return await Effect.runPromise(
      eciesDecryptE(recipient.privateKeyPemBase64)(
        part.payloadPrivate.slice(1)
      ).pipe(
        Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(OfferPrivatePart)))
      )
    )
  }
  return {params, createPrivatePart, deletePrivatePart, readUploadedPayload}
}

it.each([
  {level: 'firstLevel', background: false},
  {level: 'secondLevel', background: false},
  {level: 'firstLevel', background: true},
  {level: 'secondLevel', background: true},
])(
  'refreshes only changed existing $level recipients (background: $background)',
  async ({level, background}) => {
    const {params, createPrivatePart, readUploadedPayload} = setup()
    const targetConnections = {
      firstLevel: level === 'firstLevel' ? [publicKey] : [],
      secondLevel: level === 'secondLevel' ? [publicKey] : [],
      clubs: {},
    }
    const updatedParams = {
      ...params,
      currentConnections: targetConnections,
      targetConnections,
      commonFriends: HashMap.make([publicKey, [friend, newFriend]]),
      stopProcessingAfter: background
        ? Schema.decodeSync(UnixMilliseconds)(Date.now() + 25_000)
        : undefined,
    }
    await Effect.runPromise(updatePrivateParts(updatedParams))
    expect(createPrivatePart).not.toHaveBeenCalled()
    const updated = await Effect.runPromise(
      updatePrivateParts({...updatedParams, connectionsToRefresh: [publicKey]})
    )
    expect(updated.updateSuccess).toBe(true)
    expect(updated.newConnections).toEqual({
      firstLevel: [],
      secondLevel: [],
      clubs: {},
    })
    expect(await readUploadedPayload()).toMatchObject({
      commonFriends: [friend, newFriend],
      friendLevel: [level === 'firstLevel' ? 'FIRST_DEGREE' : 'SECOND_DEGREE'],
    })
  }
)

it('includes new recipients and deduplicates changed recipients using their current level', async () => {
  const {params, createPrivatePart, readUploadedPayload} = setup()
  const newPublicKey = otherRecipient.publicKeyPemBase64
  const result = await Effect.runPromise(
    updatePrivateParts({
      ...params,
      connectionsToRefresh: [publicKey, publicKey],
      targetConnections: {
        firstLevel: [publicKey],
        secondLevel: [publicKey, newPublicKey],
        clubs: {},
      },
      commonFriends: HashMap.empty(),
      verifiedFriends: HashMap.make([publicKey, [friend]]),
    })
  )
  expect(result.newConnections.secondLevel).toEqual([newPublicKey])
  expect(createPrivatePart.mock.lastCall?.[0].offerPrivateList).toHaveLength(2)
  expect(await readUploadedPayload()).toMatchObject({
    friendLevel: ['FIRST_DEGREE'],
    commonFriends: [],
    verifiedCommonFriends: [friend],
  })
})

it('adds club identities alongside changed social recipients and skips unchanged clubs', async () => {
  const {params, createPrivatePart} = setup()
  const clubUuid = Schema.decodeUnknownSync(ClubUuid)(
    '00000000-0000-4000-8000-000000000001'
  )
  const clubPublicKey = otherRecipient.publicKeyPemBase64
  const targetConnections = {
    ...connections,
    clubs: {[clubUuid]: [clubPublicKey]},
  }
  const updatedParams = {
    ...params,
    currentConnections: connections,
    targetConnections,
  }
  await Effect.runPromise(
    updatePrivateParts({
      ...updatedParams,
      connectionsToRefresh: [publicKey],
      stopProcessingAfter: Schema.decodeSync(UnixMilliseconds)(
        Date.now() + 25_000
      ),
    })
  )
  const part = Array.findFirst(
    createPrivatePart.mock.lastCall?.[0].offerPrivateList ?? [],
    (part) => part.userPublicKey === clubPublicKey
  ).pipe(Option.getOrUndefined)
  if (!part) throw new Error('Expected uploaded club payload')
  const payload = await Effect.runPromise(
    eciesDecryptE(otherRecipient.privateKeyPemBase64)(
      part.payloadPrivate.slice(1)
    ).pipe(
      Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(OfferPrivatePart)))
    )
  )
  expect(payload).toMatchObject({
    commonFriends: [],
    verifiedCommonFriends: [],
    friendLevel: ['CLUB'],
    clubIds: [clubUuid],
  })
  await Effect.runPromise(
    updatePrivateParts({
      ...updatedParams,
      currentConnections: targetConnections,
    })
  )
  expect(createPrivatePart).toHaveBeenCalledTimes(1)
})

it('preserves separate social and club removal counts and does not recreate removed recipients', async () => {
  const {params, createPrivatePart, deletePrivatePart} = setup()
  const info = jest.spyOn(console, 'info').mockImplementation(() => undefined)
  const clubUuid = Schema.decodeUnknownSync(ClubUuid)(
    '00000000-0000-4000-8000-000000000001'
  )
  const clubPublicKey = otherRecipient.publicKeyPemBase64
  await Effect.runPromise(
    updatePrivateParts({
      ...params,
      currentConnections: {
        ...connections,
        clubs: {[clubUuid]: [clubPublicKey]},
      },
      connectionsToRefresh: [clubPublicKey],
    })
  )
  expect(createPrivatePart).not.toHaveBeenCalled()
  expect(deletePrivatePart).toHaveBeenCalledWith({
    adminIds: [params.adminId],
    publicKeys: [clubPublicKey],
  })
  expect(info).toHaveBeenLastCalledWith(
    expect.stringContaining(
      'Number of removedConnections: 0. Number of removed clubs connections: 1.'
    )
  )
  expect(reportErrorFromResourcesUtils).not.toHaveBeenCalled()
})

it('still reports existing recipients skipped by the background deadline', async () => {
  const {params, createPrivatePart} = setup()
  const result = await Effect.runPromise(
    updatePrivateParts({
      ...params,
      connectionsToRefresh: [publicKey],
      stopProcessingAfter: Schema.decodeSync(UnixMilliseconds)(Date.now() - 1),
    })
  )
  expect(result.updateSuccess).toBe(false)
  expect(createPrivatePart).not.toHaveBeenCalled()
  expect(
    Array.map(result.timeLimitReachedErrors, (error) => error.toPublicKey)
  ).toEqual([publicKey])
})

it('does not report a completed refresh when an existing recipient upload fails', async () => {
  const {params, createPrivatePart} = setup()
  createPrivatePart.mockReturnValue(Effect.fail(new NotFoundError()))
  const result = await Effect.runPromise(
    updatePrivateParts({...params, connectionsToRefresh: [publicKey]})
  )
  expect(result.updateSuccess).toBe(false)
  expect(result.encryptionErrors).toEqual([])
})

it('reports a completed refresh when a recipient cannot be encrypted for', async () => {
  const {params, createPrivatePart} = setup()
  const brokenKey = Schema.decodeSync(PublicKeyPemBase64)('not-a-key')
  const result = await Effect.runPromise(
    updatePrivateParts({
      ...params,
      currentConnections: {firstLevel: [], secondLevel: [], clubs: {}},
      targetConnections: {
        firstLevel: [publicKey, brokenKey],
        secondLevel: [],
        clubs: {},
      },
    })
  )
  expect(result.updateSuccess).toBe(true)
  expect(
    Array.map(result.encryptionErrors, (error) => error.toPublicKey)
  ).toEqual([brokenKey])
  expect(result.newConnections.firstLevel).toEqual([publicKey])
  expect(createPrivatePart).toHaveBeenCalledTimes(1)
})
