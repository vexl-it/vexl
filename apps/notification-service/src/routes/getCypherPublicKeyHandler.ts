import {GetNotificationPublicKeyEndpoint} from '@vexl-next/rest-api/src/services/notification/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {Handler} from 'effect-http'
import {fcmTokenPublicKeyConfig} from '../configs'

export const getCypherPublicKeyHandler = Handler.make(
  GetNotificationPublicKeyEndpoint,
  () =>
    makeEndpointEffect(
      fcmTokenPublicKeyConfig.pipe(Effect.map((publicKey) => ({publicKey}))),
      Schema.Void
    )
)
