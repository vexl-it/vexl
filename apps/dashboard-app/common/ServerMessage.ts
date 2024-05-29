import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import DebugMessage from './DebugMessage'

export class PongMessage extends Schema.TaggedClass<PongMessage>()(
  'PongMessage',
  {}
) {}

export class TimeoutClose extends Schema.TaggedClass<TimeoutClose>(
  'TimeoutClose'
)('TimeoutClose', {}) {}

export class ConnectionsCountByCountry extends Schema.Class<ConnectionsCountByCountry>(
  'ConnectionsCountByCountry'
)({
  countryCode: CountryPrefixE,
  count: Schema.Number,
}) {}

export class ConnectionsCountByCountryListMessage extends Schema.TaggedClass<ConnectionsCountByCountryListMessage>(
  'ConnectionsCountByCountryListMessage'
)('ConnectionsCountByCountryListMessage', {
  type: Schema.Literal('full', 'delta'),
  connectionsCountByCountryList: Schema.Array(ConnectionsCountByCountry),
}) {}

export class UserWithConnections extends Schema.Class<UserWithConnections>(
  'UserWithConnections'
)({
  pubKey: PublicKeyPemBase64E,
  connectionsCount: Schema.Number,
  countryPrefix: CountryPrefixE,
  receivedAt: UnixMillisecondsE,
}) {}

export class NewUserWithConnectionsMessage extends Schema.TaggedClass<NewUserWithConnectionsMessage>(
  'NewUserWithConnectionsMessage'
)('NewUserWithConnectionsMessage', {
  userWithConnections: Schema.Array(UserWithConnections),
}) {}

export class TotalUsersCountMessage extends Schema.TaggedClass<TotalUsersCountMessage>(
  'TotalUsersCountMessage'
)('TotalUsersCountMessage', {
  totalUsersCount: Schema.Number,
}) {}

export class ReceivedUnexpectedMessage extends Schema.TaggedClass<ReceivedUnexpectedMessage>(
  'ReceivedUnexpectedMessage'
)('ReceivedUnexpectedMessage', {
  messageReceived: Schema.String,
}) {}

export const ServerMessage = Schema.Union(
  DebugMessage,
  PongMessage,
  TimeoutClose,
  ReceivedUnexpectedMessage,
  ConnectionsCountByCountryListMessage,
  NewUserWithConnectionsMessage,
  TotalUsersCountMessage
)
export type ServerMessage = Schema.Schema.Type<typeof ServerMessage>
