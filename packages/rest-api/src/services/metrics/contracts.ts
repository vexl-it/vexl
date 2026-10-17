import {AnalyticsStateUpsert} from '@vexl-next/analytics-definitions/src/core'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Schema} from 'effect'

export const ReportNotificationInteractionRequest = Schema.Struct({
  uuid: Uuid,
  count: Schema.NumberFromString.pipe(Schema.greaterThanOrEqualTo(0)),
  notificationType: Schema.Literal('Chat', 'Network'),
  trackingId: Schema.optional(NotificationTrackingId),
  notificationsEnabled: Schema.optional(Schema.BooleanFromString),
  backgroundTaskEnabled: Schema.optional(Schema.BooleanFromString),
  isVisible: Schema.optional(Schema.BooleanFromString),
  systemNotificationSent: Schema.optional(Schema.BooleanFromString),
  type: Schema.Literal(
    'ChatMessageReceived',
    'BackgroundMessageReceived',
    'NewConnectionsReceived',
    'UINotificationReceived'
  ),
})

export type ReportNotificationInteractionRequest =
  typeof ReportNotificationInteractionRequest.Type

export class InvalidAnalyticsStateError extends Schema.TaggedError<InvalidAnalyticsStateError>(
  'InvalidAnalyticsStateError'
)('InvalidAnalyticsStateError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  message: Schema.optional(Schema.String),
}) {}

export const OHTTP_REQUEST_CONTENT_TYPE = 'message/ohttp-req'
export const RELAY_TOKEN_HEADER = 'x-relay-token'

/**
 * Sent inside the encrypted request instead of the common headers, so the
 * gateway only learns what the dashboard groups by.
 */
export const AnalyticsClientInfo = Schema.Struct({
  platform: PlatformName,
  semver: VersionString,
  prefix: Schema.optionalWith(CountryPrefix, {as: 'Option', exact: true}),
})
export type AnalyticsClientInfo = typeof AnalyticsClientInfo.Type

export const RelayedAnalyticsState = Schema.Struct({
  client: AnalyticsClientInfo,
  state: AnalyticsStateUpsert,
})
export type RelayedAnalyticsState = typeof RelayedAnalyticsState.Type

export const MAX_RELAYED_ANALYTICS_STATE_BYTES = 4096
const PADDING_BLOCK_BYTES = 1024

/**
 * JSON padded with trailing spaces (still valid JSON) to a multiple of
 * PADDING_BLOCK_BYTES, so the relay cannot tell definitions apart by size.
 */
export const encodeRelayedAnalyticsState = (
  value: RelayedAnalyticsState
): Uint8Array => {
  const json = new TextEncoder().encode(
    JSON.stringify(Schema.encodeSync(RelayedAnalyticsState)(value))
  )
  const padded = new Uint8Array(
    Math.ceil(json.length / PADDING_BLOCK_BYTES) * PADDING_BLOCK_BYTES
  ).fill(0x20)
  padded.set(json)
  return padded
}

export class UnknownAnalyticsRelayError extends Schema.TaggedError<UnknownAnalyticsRelayError>(
  'UnknownAnalyticsRelayError'
)('UnknownAnalyticsRelayError', {
  status: Schema.optionalWith(Schema.Literal(403), {default: () => 403}),
}) {}

/** The gateway holds no key for the request: retry later, never drop. */
export class AnalyticsGatewayKeyUnavailableError extends Schema.TaggedError<AnalyticsGatewayKeyUnavailableError>(
  'AnalyticsGatewayKeyUnavailableError'
)('AnalyticsGatewayKeyUnavailableError', {
  status: Schema.optionalWith(Schema.Literal(503), {default: () => 503}),
}) {}
