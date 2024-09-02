import {Schema} from '@effect/schema'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  InvalidFcmCypherError,
  IssueNotificationResponse,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {IssueNotificationEndpoint} from '@vexl-next/rest-api/src/services/notification/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {sendFirebaseMessage} from '../../FirebaseMessagingLayer'
import {decodeFcmCypher} from './utils'

export const IssueNotifcationHandler = Handler.make(
  IssueNotificationEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const data = req.body
        const fcmToken = yield* _(decodeFcmCypher(data.fcmCypher))

        const chatNotificationData = new NewChatMessageNoticeNotificationData({
          targetCypher: data.fcmCypher,
        })

        yield* _(
          sendFirebaseMessage({
            token: fcmToken,
            data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
              chatNotificationData
            ),
          })
        )

        return new IssueNotificationResponse({success: true})
      }),
      Schema.Union(InvalidFcmCypherError, SendingNotificationError)
    )
)
