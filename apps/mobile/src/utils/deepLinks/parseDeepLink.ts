import {Effect, Option, Schema} from 'effect'
import parse from 'url-parse'

export class DataAndTypeElementsDeepLinkError extends Schema.TaggedError<DataAndTypeElementsDeepLinkError>(
  'DataAndTypeElementsDeepLinkError'
)('DataAndTypeElementsDeepLinkError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

const DeepLinkData = Schema.Struct({
  prefix: Schema.optionalWith(Schema.String, {as: 'Option', nullable: true}),
  data: Schema.optionalWith(Schema.String, {as: 'Option', nullable: true}),
  type: Schema.optionalWith(Schema.String, {as: 'Option', nullable: true}),
  domain: Schema.optionalWith(Schema.String, {as: 'Option', nullable: true}),
  link: Schema.optionalWith(Schema.String, {as: 'Option', nullable: true}),
})

export const LinkToDeepLink = Schema.transform(Schema.String, DeepLinkData, {
  strict: false,
  decode: (deepLink) => {
    const parsedDeepLink = parse(deepLink, true)
    if (!parsedDeepLink.query.link) {
      return Option.none()
    }

    const parsedLinkFromDeepLink = parse(parsedDeepLink.query.link, true)

    if (!parsedLinkFromDeepLink) {
      return Option.none()
    }

    const {type, data} = parsedLinkFromDeepLink.query

    if (type && data) {
      return {
        type,
        data,
        prefix: parsedDeepLink.protocol,
        domain: parsedDeepLink.host,
        link: parsedLinkFromDeepLink.href,
      }
    }

    return Option.none()
  },
  encode: (deepLinkData) =>
    Effect.succeed(
      `${deepLinkData.prefix}://${deepLinkData.domain}?link=${deepLinkData.link}`
    ),
})

export type LinkToDeepLink = Schema.Schema.Type<typeof LinkToDeepLink>
