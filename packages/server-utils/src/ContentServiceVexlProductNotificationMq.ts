import {VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {makeMqService} from '@vexl-next/server-utils/src/mqService'

const VEXL_PRODUCT_NOTIFICATION_ISSUE_QUEUE_KEY =
  'content-service_vexl-product-notification-issue-queue'

const {EnqueueTask, producerLayer, consumerLayer} = makeMqService(
  VEXL_PRODUCT_NOTIFICATION_ISSUE_QUEUE_KEY,
  VexlProductNotification
)

export const EnqueueVexlProductNotification = EnqueueTask

export const VexlProductNotificationProducerLayer = producerLayer

export const ProcessVexlProductNotificationConsumerLayer = consumerLayer
