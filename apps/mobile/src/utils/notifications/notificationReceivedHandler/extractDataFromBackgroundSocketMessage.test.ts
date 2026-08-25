import {Effect, Option} from 'effect'
import {extractDataFromBackgroundSocketMessage} from './extractDataFromBackgroundSocketMessage'

describe('extractDataFromBackgroundSocketMessage', () => {
  it('converts a stream chat notice for the existing background pipeline', async () => {
    const result = await Effect.runPromise(
      extractDataFromBackgroundSocketMessage(
        JSON.stringify({
          _tag: 'NewChatMessageNoticeMessage',
          sentAt: 1_725_000_000_000,
          targetToken: 'vexl_nt_chat',
          trackingId: 'tracking-id',
        })
      )
    )

    expect(Option.isSome(result)).toBe(true)
    if (Option.isNone(result)) return

    expect(result.value._tag).toBe('NewChatMessageNoticeNotificationData')
    if (result.value._tag !== 'NewChatMessageNoticeNotificationData') return

    expect(result.value.includesSystemNotification).toBe(false)
    expect(result.value.targetToken).toBe('vexl_nt_chat')
    expect(Option.getOrNull(result.value.trackingId)).toBe('tracking-id')
  })

  it('ignores heartbeat messages', async () => {
    const result = await Effect.runPromise(
      extractDataFromBackgroundSocketMessage(
        JSON.stringify({_tag: 'DebugMessage'})
      )
    )

    expect(Option.isNone(result)).toBe(true)
  })

  it('rejects unknown socket payloads before processing', async () => {
    const privateSentinel = 'private-notification-payload'
    const error = await Effect.runPromise(
      Effect.flip(
        extractDataFromBackgroundSocketMessage(
          JSON.stringify({
            _tag: 'UnknownMessage',
            notificationToken: privateSentinel,
          })
        )
      )
    )

    expect(error.message).toBe('Error decoding background socket notification')
    expect(JSON.stringify(error)).not.toContain(privateSentinel)
  })
})
