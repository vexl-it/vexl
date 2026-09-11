import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, HashMap, Schema} from 'effect'
import {getChangedConnectionPublicKeys} from './getChangedConnectionPublicKeys'

const publicKey = generatePrivateKey().publicKeyPemBase64
const otherPublicKey = generatePrivateKey().publicKeyPemBase64
const friend = Schema.decodeSync(HashedPhoneNumber)('friend')
const newFriend = Schema.decodeSync(HashedPhoneNumber)('new-friend')
const graph = {
  firstLevel: [],
  secondLevel: [publicKey, otherPublicKey],
  commonFriends: HashMap.make([publicKey, [friend, newFriend]]),
  verifiedFriends: HashMap.empty(),
}

it('ignores reordered or duplicate common friends and equivalent empty entries', () => {
  expect(
    getChangedConnectionPublicKeys(graph, {
      ...graph,
      secondLevel: [otherPublicKey, publicKey, publicKey],
      commonFriends: HashMap.make(
        [publicKey, [newFriend, friend, friend]],
        [otherPublicKey, []]
      ),
    })
  ).toEqual([])
})

it.each(['common', 'verified', 'level'])(
  'finds the recipient with a changed %s payload field',
  (change) => {
    expect(
      getChangedConnectionPublicKeys(graph, {
        ...graph,
        ...(change === 'common' ? {commonFriends: HashMap.empty()} : {}),
        ...(change === 'verified'
          ? {verifiedFriends: HashMap.make([publicKey, [friend]])}
          : {}),
        ...(change === 'level'
          ? {firstLevel: [publicKey], secondLevel: [otherPublicKey]}
          : {}),
      })
    ).toEqual([publicKey])
  }
)

it('compares a large graph once and identifies only the changed recipient', () => {
  const keys = Array.makeBy(5000, () => generatePrivateKey().publicKeyPemBase64)
  const previous = {...graph, secondLevel: [publicKey, ...keys]}
  expect(
    getChangedConnectionPublicKeys(previous, {
      ...previous,
      commonFriends: HashMap.make([publicKey, [newFriend]]),
    })
  ).toEqual([publicKey])
})

it('ignores redundant second-degree membership for first-degree recipients', () => {
  const previous = {
    ...graph,
    firstLevel: [publicKey],
    secondLevel: [otherPublicKey],
  }
  const current = {...previous, secondLevel: [publicKey, otherPublicKey]}
  expect(getChangedConnectionPublicKeys(previous, current)).toEqual([])
})
