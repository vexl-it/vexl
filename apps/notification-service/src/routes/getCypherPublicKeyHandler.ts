import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {fcmTokenPublicKeyConfig} from '../configs'

export const getCypherPublicKeyHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'root',
  'getNotificationPublicKey',
  () =>
    makeEndpointEffect(
      fcmTokenPublicKeyConfig.pipe(Effect.map((publicKey) => ({publicKey})))
    )
)
