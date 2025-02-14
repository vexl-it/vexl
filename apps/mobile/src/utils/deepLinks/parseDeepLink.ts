import {Effect, Option, Schema} from 'effect'
import parse from 'url-parse'

export class DataAndTypeElementsDeepLinkError extends Schema.TaggedError<DataAndTypeElementsDeepLinkError>(
  'DataAndTypeElementsDeepLinkError'
)('DataAndTypeElementsDeepLinkError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export const DeepLink = Schema.String.pipe(
  Schema.filter((link) => !!parse(link, true).query.link),
  Schema.brand('DeepLink')
)

export type DeepLink = Schema.Schema.Type<typeof DeepLink>

export function parseDeepLink(
  unsafeLink: string
): Effect.Effect<
  Option.Option<{type: string; data: string}>,
  DataAndTypeElementsDeepLinkError
> {
  return Effect.try({
    try: () => {
      const link = Schema.decodeUnknownSync(DeepLink)(unsafeLink)
      const parsed = parse(link, true).query
      const {type, data} = parsed

      if (type && data) {
        return Option.some({type, data})
      }

      return Option.none()
    },
    catch: (e) =>
      new DataAndTypeElementsDeepLinkError({
        message: 'Error while parsing deep link',
        cause: e,
      }),
  })
}
