import {
  generatePrivateKey,
  PublicKeyV2,
  type KeyPairV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  generateNoteAdminId,
  generateNoteRepostId,
  newNoteId,
  NotePrivatePart,
} from '@vexl-next/domain/src/general/notes'
import {SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  CryptoBoxCypher,
  cryptoBoxUnseal,
  generateV2KeyPair,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect, HashMap, Schema} from 'effect'
import {createTestOfferApi} from '../testUtils/offerApi'
import updateNotePrivateParts from './updateNotePrivateParts'
import updateRepostNotePrivateParts from './updateRepostNotePrivateParts'

jest.mock('../reportErrorFromResourcesUtils')
let recipient: KeyPairV2
let owner: PublicKeyV2
let publicKey: PublicKeyV2

beforeAll(async () => {
  recipient = await Effect.runPromise(generateV2KeyPair())
  publicKey = recipient.publicKey
  owner = (await Effect.runPromise(generateV2KeyPair())).publicKey
})
const friend = Schema.decodeSync(HashedPhoneNumber)('new-common-friend')
const symmetricKey = Schema.decodeSync(SymmetricKey)('symmetric-key')

function setup(): {
  params: Parameters<typeof updateNotePrivateParts>[0]
  create: jest.MockedFunction<OfferApi['createNotePrivatePart']>
  remove: jest.MockedFunction<OfferApi['deleteNotePrivatePart']>
} {
  const create = jest.fn<
    ReturnType<OfferApi['createNotePrivatePart']>,
    Parameters<OfferApi['createNotePrivatePart']>
  >(() => Effect.succeed({}))
  const remove = jest.fn<
    ReturnType<OfferApi['deleteNotePrivatePart']>,
    Parameters<OfferApi['deleteNotePrivatePart']>
  >(() => Effect.succeed({}))
  return {
    create,
    remove,
    params: {
      api: createTestOfferApi({
        createNotePrivatePart: create,
        deleteNotePrivatePart: remove,
      }),
      adminId: generateNoteAdminId(),
      symmetricKey,
      ownerPublicKeys: [owner],
      currentConnections: {firstLevel: [owner], secondLevel: [publicKey]},
      targetConnections: {firstLevel: [owner], secondLevel: [publicKey]},
      commonFriends: HashMap.make([publicKey, [friend]]),
      connectionsToRefresh: [publicKey, owner],
    },
  }
}

it('replaces an existing recipient payload with fresh common friends and the full target level, excluding the owner', async () => {
  const {params, create} = setup()
  const result = await Effect.runPromise(updateNotePrivateParts(params))
  expect(result.updateSuccess).toBe(true)
  const parts = create.mock.lastCall?.[0].notePrivateList
  expect(parts).toHaveLength(1)
  const part = parts?.[0]
  if (!part) throw new Error('Expected uploaded payload')
  expect(part.userPublicKey).toBe(publicKey)
  const payload = await Effect.runPromise(
    cryptoBoxUnseal(recipient)(
      Schema.decodeSync(CryptoBoxCypher)(part.payloadPrivate.slice(1))
    ).pipe(
      Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(NotePrivatePart)))
    )
  )
  expect(payload.commonFriends).toEqual([friend])
  expect(payload.friendLevel).toEqual(['SECOND_DEGREE'])
  expect(payload.adminId).toBeUndefined()
})

it('does not upload unchanged recipients', async () => {
  const {params, create} = setup()
  await Effect.runPromise(
    updateNotePrivateParts({...params, connectionsToRefresh: []})
  )
  expect(create).not.toHaveBeenCalled()
})

it('reports failed uploads without losing recipients that need retrying', async () => {
  const {params, create} = setup()
  create.mockReturnValueOnce(Effect.fail(new NotFoundError()))
  const result = await Effect.runPromise(updateNotePrivateParts(params))
  expect(result.updateSuccess).toBe(false)
  expect(result.newConnections.secondLevel).toEqual([])
})

it('reports deadline skips and still removes former recipients without touching the owner', async () => {
  const {params, remove, create} = setup()
  const result = await Effect.runPromise(
    updateNotePrivateParts({
      ...params,
      currentConnections: {firstLevel: [publicKey, owner], secondLevel: []},
      targetConnections: {
        firstLevel: [],
        secondLevel: [generatePrivateKey().publicKeyPemBase64],
      },
      stopProcessingAfter: Schema.decodeSync(UnixMilliseconds)(1),
    })
  )
  expect(result.updateSuccess).toBe(false)
  expect(remove).toHaveBeenCalledWith({
    adminIds: [params.adminId],
    publicKeys: [publicKey],
  })
  expect(create).not.toHaveBeenCalled()
})

function repostSetup(): {
  params: Parameters<typeof updateRepostNotePrivateParts>[0]
  upload: jest.MockedFunction<OfferApi['repostNote']>
  remove: jest.MockedFunction<OfferApi['deleteRepostNotePrivatePart']>
} {
  const upload = jest.fn<
    ReturnType<OfferApi['repostNote']>,
    Parameters<OfferApi['repostNote']>
  >(() => Effect.succeed({}))
  const remove = jest.fn<
    ReturnType<OfferApi['deleteRepostNotePrivatePart']>,
    Parameters<OfferApi['deleteRepostNotePrivatePart']>
  >(() => Effect.succeed({}))
  return {
    upload,
    remove,
    params: {
      api: createTestOfferApi({
        createRepostNotePrivatePart: () => Effect.fail(new NotFoundError()),
        repostNote: upload,
        deleteRepostNotePrivatePart: remove,
      }),
      noteId: newNoteId(),
      repostId: generateNoteRepostId(),
      symmetricKey,
      ownerPublicKeys: [owner],
      currentConnections: {firstLevel: [], secondLevel: []},
      targetConnections: {firstLevel: [publicKey], secondLevel: []},
    },
  }
}

it('revokes removed repost recipients before uploading and reports upload failures', async () => {
  const {params, remove, upload} = repostSetup()
  const removed = generatePrivateKey().publicKeyPemBase64
  upload.mockImplementationOnce(() => {
    expect(remove).toHaveBeenCalledWith({
      repostId: params.repostId,
      publicKeys: [removed],
    })
    return Effect.fail(new NotFoundError())
  })
  const result = await Effect.runPromise(
    updateRepostNotePrivateParts({
      ...params,
      currentConnections: {firstLevel: [removed], secondLevel: []},
    })
  )
  expect(result.updateSuccess).toBe(false)
  expect(result.repostNotFoundOnServer).toBe(true)
})

it('recreates an empty repost using the note ID without including common friends', async () => {
  const {params, upload} = repostSetup()
  const result = await Effect.runPromise(updateRepostNotePrivateParts(params))
  expect(result.updateSuccess).toBe(true)
  const request = upload.mock.lastCall?.[0]
  expect(request?.noteId).toBe(params.noteId)
  expect(request?.repostId).toBe(params.repostId)
  const part = request?.notePrivateList[0]
  if (!part) throw new Error('Expected repost payload')
  const payload = await Effect.runPromise(
    cryptoBoxUnseal(recipient)(
      Schema.decodeSync(CryptoBoxCypher)(part.payloadPrivate.slice(1))
    ).pipe(
      Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(NotePrivatePart)))
    )
  )
  expect(payload.commonFriends).toEqual([])
  expect(payload.friendLevel).toEqual(['NOT_SPECIFIED'])
  expect(payload.viaRepost).toBe(true)
})

it('reports incomplete reposts when the encryption deadline has elapsed', async () => {
  const {params} = repostSetup()
  const result = await Effect.runPromise(
    updateRepostNotePrivateParts({
      ...params,
      stopProcessingAfter: Schema.decodeSync(UnixMilliseconds)(1),
    })
  )
  expect(result.updateSuccess).toBe(false)
  expect(result.newConnections.firstLevel).toEqual([])
})

it('does not discard repost removals when the server fails to revoke them', async () => {
  const {params, remove} = repostSetup()
  remove.mockReturnValueOnce(Effect.fail(new NotFoundError()))
  const result = await Effect.runPromise(
    Effect.either(
      updateRepostNotePrivateParts({
        ...params,
        currentConnections: {firstLevel: [publicKey], secondLevel: []},
        targetConnections: {firstLevel: [], secondLevel: []},
      })
    )
  )
  expect(result._tag).toBe('Left')
})

it('updates an existing repost by its capability without requiring the original recipient access', async () => {
  const {params, upload} = repostSetup()
  const create = jest.fn<
    ReturnType<OfferApi['createRepostNotePrivatePart']>,
    Parameters<OfferApi['createRepostNotePrivatePart']>
  >(() => Effect.succeed({}))
  const result = await Effect.runPromise(
    updateRepostNotePrivateParts({
      ...params,
      api: {...params.api, createRepostNotePrivatePart: create},
    })
  )
  expect(result.updateSuccess).toBe(true)
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({repostId: params.repostId})
  )
  expect(upload).not.toHaveBeenCalled()
})

it('reports encryption failures as incomplete for both notes and reposts', async () => {
  const invalidKey = Schema.decodeSync(PublicKeyV2)('V2_PUB_invalid')
  const targetConnections = {firstLevel: [invalidKey], secondLevel: []}
  const note = setup()
  const repost = repostSetup()
  const results = await Promise.all([
    Effect.runPromise(
      updateNotePrivateParts({...note.params, targetConnections})
    ),
    Effect.runPromise(
      updateRepostNotePrivateParts({...repost.params, targetConnections})
    ),
  ])
  for (const result of results) {
    expect(result.updateSuccess).toBe(false)
    expect(result.encryptionErrors).toHaveLength(1)
    expect(result.newConnections.firstLevel).toEqual([])
  }
})
