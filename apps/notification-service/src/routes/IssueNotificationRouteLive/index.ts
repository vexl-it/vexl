import * as Http from '@effect/platform/HttpServer'
import {Schema} from '@effect/schema'
import {EncryptedNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  IssueNotificationRequest,
  IssueNotificationResponse,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {AuthenticatedSessionInRequestLive} from '@vexl-next/server-utils/src/ServerUserSession'
import {Effect} from 'effect'
import {sendFirebaseMessage} from '../../FirebaseMessagingLayer'
import {decodeFcmCypher} from './utils'

const IssueNotificationRouteLive = Http.router.post(
  '/issue-notification',
  Effect.gen(function* (_) {
    const data = yield* _(Http.request.schemaBodyJson(IssueNotificationRequest))
    const fcmToken = yield* _(decodeFcmCypher(data.fcmCypher))

    const encryptedNotificationData = new EncryptedNotificationData({
      payload: data.messagePayload,
      targetCypher: data.fcmCypher,
    })

    yield* _(
      sendFirebaseMessage({
        token: fcmToken,
        data: Schema.encodeSync(EncryptedNotificationData)(
          encryptedNotificationData
        ),
      })
    )
  }).pipe(
    Effect.zipRight(
      Http.response.json(new IssueNotificationResponse({success: true}))
    ),
    Effect.provide(AuthenticatedSessionInRequestLive),
    Effect.catchTags({
      InvalidFcmCypherError: (e) => Http.response.json(e, {status: 400}),
      SendingNotificationError: (e) => Http.response.json(e, {status: 400}),
    })
  )
)

export default IssueNotificationRouteLive
