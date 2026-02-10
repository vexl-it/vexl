import {Schema} from 'effect/index'
import {UnixMillisecondsE} from '../utility/UnixMilliseconds.brand'
import {generateUuid, UuidE} from '../utility/Uuid.brand'
import {CountryPrefixE} from './CountryPrefix.brand'

export const AnalyticsId = Schema.String.pipe(Schema.brand('AnalyticsId'))
export type AnalyticsId = typeof AnalyticsId.Type

export const newAnalyticsId = (): AnalyticsId =>
  Schema.decodeSync(AnalyticsId)(generateUuid())

export const AnalyticsEventId = UuidE.pipe(Schema.brand('AnalyticsEventId'))
export type AnalyticsEventId = typeof AnalyticsEventId.Type

const AnalyticEventSharedAttributes = Schema.Struct({
  eventId: AnalyticsEventId,
  analyticsId: AnalyticsId,
  timestamp: UnixMillisecondsE,
  countryCode: CountryPrefixE,
  appVersion: Schema.String,
})

export class FreedomStoreCampaignStartedEvent extends Schema.TaggedClass<FreedomStoreCampaignStartedEvent>(
  'FreedomStoreCampaignStartedEvent'
)('FreedomStoreCampaignStartedEvent', {
  ...AnalyticEventSharedAttributes.fields,
}) {}

export class FreedomStoreModalViewedEvent extends Schema.TaggedClass<FreedomStoreModalViewedEvent>(
  'FreedomStoreModalViewedEvent'
)('FreedomStoreModalViewedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  modalVariant: Schema.String,
  timesViewed: Schema.Number,
}) {}

export class FreedomStoreModalDismissedEvent extends Schema.TaggedClass<FreedomStoreModalDismissedEvent>(
  'FreedomStoreModalDismissedEvent'
)('FreedomStoreModalDismissedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  timeOnModalSeconds: Schema.Number,
}) {}

export class FreedomStoreCtaClickedEvent extends Schema.TaggedClass<FreedomStoreCtaClickedEvent>(
  'FreedomStoreCtaClickedEvent'
)('FreedomStoreCtaClickedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  ctaText: Schema.String,
  timeToDecisionSeconds: Schema.Number,
}) {}

export class FreedomStoreBannerClickedEvent extends Schema.TaggedClass<FreedomStoreBannerClickedEvent>(
  'FreedomStoreBannerClickedEvent'
)('FreedomStoreBannerClickedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  // how many times displayed in viewport before click
  bannerImpressions: Schema.Number,
}) {}

export class FreedomStorePushNotificationOpenedEvent extends Schema.TaggedClass<FreedomStorePushNotificationOpenedEvent>(
  'FreedomStorePushNotificationOpenedEvent'
)('FreedomStorePushNotificationOpenedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  notificationVariant: Schema.String,
  timeToOpenSeconds: Schema.Number,
}) {}

export class VexlFreedomStoreOpenedEvent extends Schema.TaggedClass<VexlFreedomStoreOpenedEvent>(
  'VexlFreedomStoreOpenedEvent'
)('VexlFreedomStoreOpenedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  daysSinceCampaignStart: Schema.Number,
  dataTransferredSuccessfully: Schema.Boolean,
}) {}

export class FreedomStorePioneerBadgeClaimedEvent extends Schema.TaggedClass<FreedomStorePioneerBadgeClaimedEvent>(
  'FreedomStorePioneerBadgeClaimedEvent'
)('FreedomStorePioneerBadgeClaimedEvent', {
  ...AnalyticEventSharedAttributes.fields,
  badgeDisplayEnabled: Schema.Boolean,
}) {}

export class FreedomStoreMigrationCompleteEvent extends Schema.TaggedClass<FreedomStoreMigrationCompleteEvent>(
  'FreedomStoreMigrationCompleteEvent'
)('FreedomStoreMigrationCompleteEvent', {
  ...AnalyticEventSharedAttributes.fields,
  totalTimeToMigrateHours: Schema.Number,
  userRegion: Schema.optional(Schema.String),
}) {}

export const AnalyticsEvent = Schema.Union(
  FreedomStoreCampaignStartedEvent,
  FreedomStoreModalViewedEvent,
  FreedomStoreModalDismissedEvent,
  FreedomStoreCtaClickedEvent,
  FreedomStoreBannerClickedEvent,
  FreedomStorePushNotificationOpenedEvent,
  VexlFreedomStoreOpenedEvent,
  FreedomStorePioneerBadgeClaimedEvent,
  FreedomStoreMigrationCompleteEvent
)

export type AnalyticsEvent = typeof AnalyticsEvent.Type

const parsedAttributes = Schema.transform(
  Schema.Record({key: Schema.String, value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean)}),
  AnalyticsEvent,
  {
    decode: () => {},
    encode: (event) => {}
  }
)
