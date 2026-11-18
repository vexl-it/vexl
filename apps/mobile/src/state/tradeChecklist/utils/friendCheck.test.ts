import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateChatMessageId,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {appLocaleCatalogs} from '@vexl-next/localization/src/translations'
import {Array, Option, Schema, pipe} from 'effect'
import {createInstance} from 'i18next'
import {type ChatMessageWithState} from '../../chat/domain'
import {
  friendCheckMessage,
  friendCheckPromptAnchor,
  type FriendCheckSubject,
} from './friendCheck'

const sender = generatePrivateKey()

function message(
  text: string,
  {
    state = 'received',
    messageType = 'MESSAGE',
    image,
  }: {
    state?: 'received' | 'sent' | 'sending'
    messageType?: MessageType
    image?: UriString
  } = {}
): ChatMessageWithState {
  return {
    state,
    message: {
      uuid: generateChatMessageId(),
      text,
      messageType,
      image,
      senderPublicKey: sender.publicKeyPemBase64,
      time: Schema.decodeSync(UnixMilliseconds)(0),
    },
  }
}

function texts(count: number): ChatMessageWithState[] {
  return Array.makeBy(count, (i) =>
    message(String(i + 1), {state: i % 2 === 0 ? 'received' : 'sent'})
  )
}

function anchorText(messages: ChatMessageWithState[]): string | undefined {
  return pipe(
    friendCheckPromptAnchor(messages),
    Option.map((one) => one.message.text),
    Option.getOrUndefined
  )
}

describe('friend check prompt', () => {
  it('waits for seven text messages from both sides together', () => {
    expect(anchorText(texts(6))).toBeUndefined()
    expect(anchorText(texts(7))).toBe('7')
    expect(anchorText(texts(12))).toBe('7')
  })

  it('counts only ordinary text messages', () => {
    expect(
      anchorText([
        message('request', {messageType: 'REQUEST_MESSAGING'}),
        message('approve', {messageType: 'APPROVE_MESSAGING'}),
        message('checklist', {messageType: 'TRADE_CHECKLIST_UPDATE'}),
        message('photo', {
          image: Schema.decodeSync(UriString)('file:///photo.jpg'),
        }),
        message('unsent', {state: 'sending'}),
        ...texts(6),
      ])
    ).toBeUndefined()
  })
})

describe('friend check message', () => {
  const i18n = createInstance({
    resources: {en: {translation: appLocaleCatalogs.en}},
    lng: 'en',
    keySeparator: false,
    nsSeparator: false,
    interpolation: {escapeValue: false},
    initAsync: false,
    showSupportNotice: false,
  })
  void i18n.init()
  const t = (key: string, options?: Record<string, unknown>): string =>
    i18n.t(key, options ?? {})

  const fullPhoneNumber = Schema.decodeSync(E164PhoneNumber)('+420608204117')
  const ask = (subject: FriendCheckSubject): string =>
    friendCheckMessage({t, friend: 'Tomáš', subject})

  it('names the nickname and full number', () => {
    expect(ask({nickname: 'Pavel', fullPhoneNumber})).toBe(
      'Hi Tomáš, do you know Pavel, +420 608 204 117? We’re about to meet and I think you two know each other. Is Pavel someone I can trust?'
    )
  })

  it('uses the last digits that come with a nickname', () => {
    expect(
      ask({nickname: 'Pavel', partialPhoneNumber: '+420 ****** 117'})
    ).toBe(
      'Hi Tomáš, do you know Pavel (phone number ending 117)? We’re about to meet and I think you two know each other. Is Pavel someone I can trust?'
    )
  })

  it('names only the nickname when no digits came with it', () => {
    expect(ask({nickname: 'Pavel'})).toBe(
      'Hi Tomáš, do you know Pavel? We’re about to meet and I think you two know each other. Is Pavel someone I can trust?'
    )
  })

  it('asks whose number it is when only the number is revealed', () => {
    expect(ask({fullPhoneNumber})).toBe(
      'Hi Tomáš, do you know whose number +420 608 204 117 is? We’re about to meet and I think you two know each other. Is it someone I can trust?'
    )
  })

  it('offers to send a photo when only the photo is revealed', () => {
    expect(ask({})).toBe(
      'Hi Tomáš, I’m about to meet someone I think you know. Can I send you a photo and ask whether you know this person?'
    )
  })

  it('never mentions Vexl, bitcoin or trading', () => {
    pipe(
      [
        {nickname: 'Pavel', fullPhoneNumber},
        {nickname: 'Pavel', partialPhoneNumber: '+420 ****** 117'},
        {nickname: 'Pavel'},
        {fullPhoneNumber},
        {},
      ],
      Array.forEach((subject) => {
        expect(ask(subject)).not.toMatch(/vexl|bitcoin|btc|trad/i)
      })
    )
  })
})
