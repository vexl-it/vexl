import {type PgClient} from '@effect/sql-pg'
import {type Fragment} from '@effect/sql/Statement'
import {OfferTypeE} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {OfferParts} from './domain'

export const offerSelect = (sql: PgClient.PgClient): Fragment => sql`
  offer_public.id AS "offer_public.id",
  offer_public.admin_id AS "offer_public.admin_id",
  offer_public.offer_id AS "offer_public.offer_id",
  offer_public.created_at AS "offer_public.created_at",
  offer_public.modified_at AS "offer_public.modified_at",
  offer_public.offer_type AS "offer_public.offer_type",
  offer_public.report AS "offer_public.report",
  offer_public.payload_public AS "offer_public.payload_public",
  offer_public.refreshed_at AS "offer_public.refreshed_at",
  offer_public.country_prefix AS "offer_public.country_prefix",
  offer_private.id AS "offer_private.id",
  offer_private.offer_id AS "offer_private.offer_id",
  offer_private.user_public_key AS "offer_private.user_public_key",
  offer_private.payload_private AS "offer_private.payload_private"
`
export const OfferSelectRecord = Schema.Struct({
  'offerPublic.id': Schema.String,
  'offerPublic.adminId': Schema.String,
  'offerPublic.offerId': Schema.String,
  'offerPublic.createdAt': Schema.DateFromSelf,
  'offerPublic.modifiedAt': Schema.DateFromSelf,
  'offerPublic.offerType': OfferTypeE,
  'offerPublic.report': Schema.Int,
  'offerPublic.payloadPublic': Schema.String,
  'offerPublic.refreshedAt': Schema.DateFromSelf,
  'offerPublic.countryPrefix': Schema.Number,
  'offerPrivate.id': Schema.String,
  'offerPrivate.offerId': Schema.String,
  'offerPrivate.userPublicKey': Schema.String,
  'offerPrivate.payloadPrivate': Schema.String,
})

export const OfferSelectToOfferParts = Schema.transform(
  OfferSelectRecord,
  OfferParts,
  {
    strict: true,
    decode: (v) => ({
      privatePart: {
        id: v['offerPrivate.id'],
        offerId: v['offerPrivate.offerId'],
        userPublicKey: v['offerPrivate.userPublicKey'],
        payloadPrivate: v['offerPrivate.payloadPrivate'],
      },
      publicPart: {
        id: v['offerPublic.id'],
        adminId: v['offerPublic.adminId'],
        offerId: v['offerPublic.offerId'],
        createdAt: v['offerPublic.createdAt'],
        modifiedAt: v['offerPublic.modifiedAt'],
        offerType: v['offerPublic.offerType'],
        report: v['offerPublic.report'],
        payloadPublic: v['offerPublic.payloadPublic'],
        refreshedAt: v['offerPublic.refreshedAt'],
        countryPrefix: v['offerPublic.countryPrefix'],
      },
    }),
    encode: (v) => ({
      'offerPrivate.id': v.privatePart.id,
      'offerPrivate.offerId': v.privatePart.offerId,
      'offerPrivate.userPublicKey': v.privatePart.userPublicKey,
      'offerPrivate.payloadPrivate': v.privatePart.payloadPrivate,
      'offerPublic.id': v.publicPart.id,
      'offerPublic.adminId': v.publicPart.adminId,
      'offerPublic.offerId': v.publicPart.offerId,
      'offerPublic.createdAt': v.publicPart.createdAt,
      'offerPublic.modifiedAt': v.publicPart.modifiedAt,
      'offerPublic.offerType': v.publicPart.offerType,
      'offerPublic.report': v.publicPart.report,
      'offerPublic.payloadPublic': v.publicPart.payloadPublic,
      'offerPublic.refreshedAt': v.publicPart.refreshedAt,
      'offerPublic.countryPrefix': v.publicPart.countryPrefix,
    }),
  }
)

export const offerNotExpired = (
  sql: PgClient.PgClient,
  expirationPeriodDays: number
): Fragment => sql`
  offer_public.refreshed_at >= (
    now() - interval '1 DAY' * ${expirationPeriodDays}
  )::date
`

export const offerNotFlagged = (
  sql: PgClient.PgClient,
  offerReportFilter: number
): Fragment => sql` offer_public.report < ${offerReportFilter} `
