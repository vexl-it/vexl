import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UserInactivityNotificationVariant} from '@vexl-next/domain/src/general/notifications'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Data, type Effect, Schema} from 'effect/index'
import {makeMqService} from './mqService'

export class ProcessNewUserNotificationsError extends Data.TaggedError(
  'ProcessNewUserNotificationsError'
)<{cause: unknown; message: string}> {}

export interface NewUserNotificationsOperations {
  scheduleProcessing: (
    token: VexlNotificationToken,
    runAt: UnixMilliseconds
  ) => Effect.Effect<void, ProcessNewUserNotificationsError>
}

const NEW_USER_NOTIFICATIONS_PROCESSING_QUEUE_KEY =
  'contact-service_new-user-notifications-processing-queue'

export class NewUserNotificationMqEntry extends Schema.TaggedClass<NewUserNotificationMqEntry>(
  'NewUserNotificationMqEntry'
)('NewUserNotificationMqEntry', {
  token: VexlNotificationToken,
}) {}

export class NewClubUserNotificationMqEntry extends Schema.TaggedClass<NewClubUserNotificationMqEntry>(
  'NewClubUserNotificationMqEntry'
)('NewClubUserNotificationMqEntry', {
  token: VexlNotificationToken,
  clubUuid: ClubUuid,
}) {}

export class UserAdmittedToClubNotificationMqEntry extends Schema.TaggedClass<UserAdmittedToClubNotificationMqEntry>(
  'UserAdmittedToClubNotificationMqEntry'
)('UserAdmittedToClubNotificationMqEntry', {
  token: VexlNotificationToken,
  publicKey: PublicKeyPemBase64,
}) {}

export class UserInactivityNotificationMqEntry extends Schema.TaggedClass<UserInactivityNotificationMqEntry>(
  'UserInactivityNotificationMqEntry'
)('UserInactivityNotificationMqEntry', {
  token: VexlNotificationToken,
  // Optional so entries enqueued before this field existed still decode
  variant: Schema.optionalWith(UserInactivityNotificationVariant, {
    default: () => 'FIRST',
  }),
}) {}

export class UserLoginOnDifferentDeviceNotificationMqEntry extends Schema.TaggedClass<UserLoginOnDifferentDeviceNotificationMqEntry>(
  'UserLoginOnDifferentDeviceNotificationMqEntry'
)('UserLoginOnDifferentDeviceNotificationMqEntry', {
  token: VexlNotificationToken,
}) {}

export class ClubFlaggedNotificationMqEntry extends Schema.TaggedClass<ClubFlaggedNotificationMqEntry>(
  'ClubFlaggedNotificationMqEntry'
)('ClubFlaggedNotificationMqEntry', {
  token: VexlNotificationToken,
  clubUuid: ClubUuid,
}) {}

export class ClubExpiredNotificationMqEntry extends Schema.TaggedClass<ClubExpiredNotificationMqEntry>(
  'ClubExpiredNotificationMqEntry'
)('ClubExpiredNotificationMqEntry', {
  token: VexlNotificationToken,
  clubUuid: ClubUuid,
}) {}

export class NewContentNotificationMqEntry extends Schema.TaggedClass<NewContentNotificationMqEntry>(
  'NewContentNotificationMqEntry'
)('NewContentNotificationMqEntry', {
  token: VexlNotificationToken,
}) {}

export class VexlProductNotificationMqEntry extends Schema.TaggedClass<VexlProductNotificationMqEntry>(
  'VexlProductNotificationMqEntry'
)('VexlProductNotificationMqEntry', {
  token: VexlNotificationToken,
  vexlProductNotification: VexlProductNotification,
}) {}

export const UserNotificationMqEntry = Schema.Union(
  NewUserNotificationMqEntry,
  NewClubUserNotificationMqEntry,
  UserAdmittedToClubNotificationMqEntry,
  UserInactivityNotificationMqEntry,
  UserLoginOnDifferentDeviceNotificationMqEntry,
  ClubFlaggedNotificationMqEntry,
  ClubExpiredNotificationMqEntry,
  NewContentNotificationMqEntry,
  VexlProductNotificationMqEntry
)

const {EnqueueTask, EnqueueTaskContext, producerLayer, consumerLayer} =
  makeMqService(
    NEW_USER_NOTIFICATIONS_PROCESSING_QUEUE_KEY,
    UserNotificationMqEntry
  )

export const ScheduleUserNotificationProducerLayer = producerLayer

export const EnqueueUserNotification = EnqueueTask

export const EnqueueUserNotificationContext = EnqueueTaskContext

export type EnqueueUserNotificationContext =
  typeof EnqueueUserNotificationContext

export const ProcessUserNotificationsConsumerLayer = consumerLayer
