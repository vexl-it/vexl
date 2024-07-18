import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform'
import {Schema} from '@effect/schema'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  IssueNotificationRequest,
  IssueNotificationResponse,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {AuthenticatedSessionInRequestLive} from '@vexl-next/server-utils/src/ServerUserSession'
import {Effect} from 'effect'
import {sendFirebaseMessage} from '../../FirebaseMessagingLayer'
import {decodeFcmCypher} from './utils'

const IssueNotificationRouteLive = HttpRouter.post(
  '/issue-notification',
  Effect.gen(function* (_) {
    const data = yield* _(
      HttpServerRequest.schemaBodyJson(IssueNotificationRequest)
    )
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
  }).pipe(
    Effect.zipRight(
      HttpServerResponse.json(new IssueNotificationResponse({success: true}))
    ),
    Effect.provide(AuthenticatedSessionInRequestLive),
    Effect.catchTags({
      InvalidFcmCypherError: (e) => HttpServerResponse.json(e, {status: 400}),
      SendingNotificationError: (e) =>
        HttpServerResponse.json(e, {status: 400}),
    })
  )
)

export default IssueNotificationRouteLive
