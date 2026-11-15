import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {type FriendCheckChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema} from 'effect'
import {type ChatMessageWithState} from '../../chat/domain'
import {friendCheckPhrase, friendChecksFromChat} from './friendCheck'

const sender = generatePrivateKey()
const tom = Schema.decodeSync(HashedPhoneNumber)('tom')
const kate = Schema.decodeSync(HashedPhoneNumber)('kate')

function friendCheckMessage(
  state: 'sent' | 'received',
  friendCheck: Omit<FriendCheckChatMessage, 'timestamp'> & {timestamp?: number}
): ChatMessageWithState {
  const time = Schema.decodeSync(UnixMilliseconds)(friendCheck.timestamp ?? 1)
  return {
    state,
    message: {
      uuid: generateChatMessageId(),
      text: 'Checklist updated',
      messageType: 'TRADE_CHECKLIST_UPDATE',
      senderPublicKey: sender.publicKeyPemBase64,
      time,
      tradeChecklistUpdate: {friendCheck: {...friendCheck, timestamp: time}},
    },
  }
}

const request = (
  state: 'sent' | 'received',
  friend = tom,
  rest: {phraseSeed?: number; timestamp?: number} = {}
): ChatMessageWithState =>
  friendCheckMessage(state, {
    friend,
    status: 'REQUEST',
    phraseSeed: 3,
    ...rest,
  })

const vouched = (
  state: 'sent' | 'received',
  friend = tom
): ChatMessageWithState =>
  friendCheckMessage(state, {friend, status: 'VOUCHED'})

function statuses(
  messages: ChatMessageWithState[],
  friendChecks?: Parameters<typeof friendChecksFromChat>[0]['friendChecks']
): string[] {
  return Array.map(
    friendChecksFromChat({messages, friendChecks}),
    (check) => check.status
  )
}

describe('friendChecksFromChat', () => {
  it('waits for me until I contact the friend', () => {
    expect(statuses([request('sent')])).toEqual(['waitingForMe'])
    expect(statuses([request('received')])).toEqual(['waitingForMe'])
  })

  it('is pending once I contacted the friend', () => {
    expect(
      statuses([request('sent')], {
        [tom]: {contactedWithPhrase: friendCheckPhrase(3)},
      })
    ).toEqual(['pending'])
  })

  it('waits for me again when the other side vouched first', () => {
    expect(
      statuses([request('sent'), vouched('received')], {
        [tom]: {contactedWithPhrase: friendCheckPhrase(3)},
      })
    ).toEqual(['waitingForMe'])
  })

  it('waits for them after only I vouched', () => {
    expect(statuses([request('received'), vouched('sent')])).toEqual([
      'waitingForThem',
    ])
  })

  it('is vouched once both sides vouched', () => {
    expect(
      statuses([request('sent'), vouched('sent'), vouched('received')])
    ).toEqual(['vouched'])
  })

  it('is not vouched when my friend refused, whatever the other side says', () => {
    expect(
      statuses([request('sent'), vouched('received')], {
        [tom]: {
          contactedWithPhrase: friendCheckPhrase(3),
          refusal: 'doesNotKnowThem',
        },
      })
    ).toEqual(['notVouched'])
  })

  it('keeps one check per friend', () => {
    const checks = friendChecksFromChat({
      messages: [request('sent', tom), request('received', kate)],
    })

    expect(
      Array.map(checks, (check) => [check.friend, check.startedBy])
    ).toEqual([
      [tom, 'me'],
      [kate, 'them'],
    ])
  })

  it('ignores a vouch for a friend nobody asked about', () => {
    expect(statuses([vouched('received')])).toEqual([])
  })

  it('picks the same phrase on both phones when both ask at once', () => {
    const mine = {phraseSeed: 7, timestamp: 10}
    const theirs = {phraseSeed: 9, timestamp: 20}
    const onMyPhone = friendChecksFromChat({
      messages: [request('sent', tom, mine), request('received', tom, theirs)],
    })
    const onTheirPhone = friendChecksFromChat({
      messages: [request('sent', tom, theirs), request('received', tom, mine)],
    })

    expect(Array.map(onMyPhone, (check) => check.phrase)).toEqual([
      friendCheckPhrase(9),
    ])
    expect(Array.map(onTheirPhone, (check) => check.phrase)).toEqual([
      friendCheckPhrase(9),
    ])
    expect(Array.map(onMyPhone, (check) => check.startedBy)).toEqual(['them'])
  })

  it('picks the same phrase when the sender lost its first request', () => {
    const lost = {phraseSeed: 7, timestamp: 10}
    const retry = {phraseSeed: 9, timestamp: 20}
    const onSenderPhone = friendChecksFromChat({
      messages: [request('sent', tom, retry)],
    })
    const onReceiverPhone = friendChecksFromChat({
      messages: [
        request('received', tom, lost),
        request('received', tom, retry),
      ],
    })

    expect(Array.map(onSenderPhone, (check) => check.phrase)).toEqual([
      friendCheckPhrase(9),
    ])
    expect(Array.map(onReceiverPhone, (check) => check.phrase)).toEqual([
      friendCheckPhrase(9),
    ])
  })

  it('asks me to contact the friend again when the phrase I sent lost', () => {
    expect(
      statuses(
        [
          request('sent', tom, {phraseSeed: 7, timestamp: 10}),
          request('received', tom, {phraseSeed: 9, timestamp: 20}),
        ],
        {[tom]: {contactedWithPhrase: friendCheckPhrase(7)}}
      )
    ).toEqual(['waitingForMe'])
  })
})

describe('friendCheckPhrase', () => {
  it('turns a seed into a stable phrase', () => {
    expect(friendCheckPhrase(0)).toBe('pink elephant')
    expect(friendCheckPhrase(33)).toBe('blue fish')
    expect(friendCheckPhrase(512)).toBe(friendCheckPhrase(0))
  })
})
