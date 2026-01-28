import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {makeMqService} from '@vexl-next/server-utils/src/mqService'
import {Data, type Effect, Schema} from 'effect/index'

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
  // #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
}) {}

export class NewClubUserNotificationMqEntry extends Schema.TaggedClass<NewClubUserNotificationMqEntry>(
  'NewClubUserNotificationMqEntry'
)('NewClubUserNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
  clubUuid: ClubUuid,
}) {}

export class UserAdmittedToClubNotificationMqEntry extends Schema.TaggedClass<UserAdmittedToClubNotificationMqEntry>(
  'UserAdmittedToClubNotificationMqEntry'
)('UserAdmittedToClubNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
  publicKey: PublicKeyPemBase64,
}) {}

export class UserInactivityNotificationMqEntry extends Schema.TaggedClass<UserInactivityNotificationMqEntry>(
  'UserInactivityNotificationMqEntry'
)('UserInactivityNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
}) {}

export class UserLoginOnDifferentDeviceNotificationMqEntry extends Schema.TaggedClass<UserLoginOnDifferentDeviceNotificationMqEntry>(
  'UserLoginOnDifferentDeviceNotificationMqEntry'
)('UserLoginOnDifferentDeviceNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
}) {}

export class ClubFlaggedNotificationMqEntry extends Schema.TaggedClass<ClubFlaggedNotificationMqEntry>(
  'ClubFlaggedNotificationMqEntry'
)('ClubFlaggedNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
  clubUuid: ClubUuid,
}) {}

export class ClubExpiredNotificationMqEntry extends Schema.TaggedClass<ClubExpiredNotificationMqEntry>(
  'ClubExpiredNotificationMqEntry'
)('ClubExpiredNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
  clubUuid: ClubUuid,
}) {}

export class NewContentNotificationMqEntry extends Schema.TaggedClass<NewContentNotificationMqEntry>(
  'NewContentNotificationMqEntry'
)('NewContentNotificationMqEntry', {
  // todo #2142: remove after moving to vexlNotificationToken
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  // todo #2142: remove nullability after moving to vexlNotificationToken
  token: Schema.NullOr(VexlNotificationToken),
}) {}

export const UserNotificationMqEntry = Schema.Union(
  NewUserNotificationMqEntry,
  NewClubUserNotificationMqEntry,
  UserAdmittedToClubNotificationMqEntry,
  UserInactivityNotificationMqEntry,
  UserLoginOnDifferentDeviceNotificationMqEntry,
  ClubFlaggedNotificationMqEntry,
  ClubExpiredNotificationMqEntry,
  NewContentNotificationMqEntry
)

const {EnqueueTask, producerLayer, consumerLayer} = makeMqService(
  NEW_USER_NOTIFICATIONS_PROCESSING_QUEUE_KEY,
  UserNotificationMqEntry
)

export const ScheduleUserNotificationProducerLayer = producerLayer

export const EnqueueUserNotification = EnqueueTask

export const ProcessUserNotificationsConsumerLayer = consumerLayer
