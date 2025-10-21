import {HttpApiBuilder} from '@effect/platform/index'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {fcmTokenPublicKeyConfig} from '../configs'

export const getCypherPublicKeyHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'getNotificationPublicKey',
  () =>
    makeEndpointEffect(
      fcmTokenPublicKeyConfig.pipe(Effect.map((publicKey) => ({publicKey})))
    )
)
