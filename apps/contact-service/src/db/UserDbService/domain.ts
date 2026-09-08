import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, Schema} from 'effect'
import {ServerHashedNumber} from '../../utils/serverHashContact'

export const UserRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('UserRecordId')
)
export type UserRecordId = typeof UserRecordId.Type

export class UserRecord extends Schema.Class<UserRecord>('UserRecord')({
  id: UserRecordId,
  publicKey: PublicKeyPemBase64,
  // V2 public key for cryptobox - nullable for backward compatibility
  publicKeyV2: Schema.OptionFromOptionalNullOr(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  hash: ServerHashedNumber,
  clientVersion: Schema.OptionFromOptionalNullOr(VersionCode).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  firebaseToken: Schema.OptionFromOptionalNullOr(FcmToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  expoToken: Schema.OptionFromOptionalNullOr(ExpoNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  vexlNotificationToken: Schema.OptionFromOptionalNullOr(
    VexlNotificationToken
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  refreshedAt: Schema.Date,
  platform: Schema.OptionFromOptionalNullOr(PlatformName).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  lastNewContentNotificaionSentAt: Schema.OptionFromOptionalNullOr(
    VersionCode
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  initialImportDone: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  countryPrefix: Schema.OptionFromOptionalNullOr(CountryPrefix).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  appSource: Schema.OptionFromOptionalNullOr(AppSource).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  lastInactivityNotificationSentAt: Schema.OptionFromOptionalNullOr(
    Schema.Date
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  numberOfInactivityNotificationsSent: Schema.Number.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 0 => 0)),
    Schema.withConstructorDefault(Effect.sync((): 0 => 0))
  ),
}) {}

export const NotificationTokens = Schema.Struct({
  firebaseToken: Schema.OptionFromOptionalNullOr(FcmToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  expoToken: Schema.OptionFromOptionalNullOr(ExpoNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  vexlNotificationToken: Schema.OptionFromOptionalNullOr(
    VexlNotificationToken
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
})
export type NotificationTokens = typeof NotificationTokens.Type
export const NotificationsTokensEquivalence =
  Schema.toEquivalence(NotificationTokens)
