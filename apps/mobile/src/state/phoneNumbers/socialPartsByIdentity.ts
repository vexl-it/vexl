import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type FriendLevel,
  type IdentitySocialPart,
  type SocialPartsByIdentity,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe, Record} from 'effect'

/**
 * Every phone number of the user has its own key, so peers encrypt an offer or
 * note once per number. Each number's view of the author is kept separately,
 * because the parts arrive and disappear independently: a part for a newly
 * added number comes alone, and replacing the stored view with it would drop
 * what the other numbers know.
 */

export const socialPartOf = (privatePart: {
  readonly friendLevel: IdentitySocialPart['friendLevel']
  readonly commonFriends: IdentitySocialPart['commonFriends']
  readonly verifiedCommonFriends: IdentitySocialPart['verifiedCommonFriends']
  readonly viaRepost?: boolean
}): IdentitySocialPart => ({
  friendLevel: privatePart.friendLevel,
  commonFriends: privatePart.commonFriends,
  verifiedCommonFriends: privatePart.verifiedCommonFriends,
  ...(privatePart.viaRepost === undefined
    ? {}
    : {viaRepost: privatePart.viaRepost}),
})

const isContactLevel = (level: FriendLevel): boolean =>
  level === 'FIRST_DEGREE' || level === 'SECOND_DEGREE'

/**
 * The part of an offer's private part that came from contacts, not clubs.
 */
export const contactSocialPartOf = (
  privatePart: Parameters<typeof socialPartOf>[0]
): Option.Option<IdentitySocialPart> =>
  Array.some(privatePart.friendLevel, isContactLevel)
    ? Option.some({
        ...socialPartOf(privatePart),
        friendLevel: Array.filter(privatePart.friendLevel, isContactLevel),
      })
    : Option.none()

/**
 * A direct part wins over reposts, the rest is the union of all parts.
 */
export const unionOfSocialParts = (
  parts: readonly IdentitySocialPart[]
): IdentitySocialPart => {
  const directParts = Array.filter(parts, (one) => !one.viaRepost)
  const chosen = Array.isNonEmptyReadonlyArray(directParts)
    ? directParts
    : parts
  const unionOf = <A>(
    field: (part: IdentitySocialPart) => readonly A[]
  ): readonly A[] => pipe(chosen, Array.flatMap(field), Array.dedupe)

  return {
    friendLevel: unionOf((one) => one.friendLevel),
    commonFriends: unionOf((one) => one.commonFriends),
    verifiedCommonFriends: unionOf((one) => one.verifiedCommonFriends),
    ...(Array.some(parts, (one) => one.viaRepost !== undefined)
      ? {viaRepost: !Array.isNonEmptyReadonlyArray(directParts)}
      : {}),
  }
}

/**
 * Parts of several identities, one entry per identity with the union of its
 * parts (the server returns a part for each of its V1 and V2 keys).
 */
export const socialPartsByIdentityOf = (
  received: ReadonlyArray<{
    readonly identity: PublicKeyPemBase64
    readonly part: IdentitySocialPart
  }>
): SocialPartsByIdentity =>
  pipe(
    received,
    Array.groupBy(({identity}) => identity),
    Record.map((sameIdentity) =>
      unionOfSocialParts(Array.map(sameIdentity, ({part}) => part))
    )
  )

/**
 * Before identities were tracked, everything came to the main phone number.
 */
export const storedSocialPartsByIdentity = ({
  socialPartsByIdentity,
  legacyPart,
  mainIdentity,
}: {
  readonly socialPartsByIdentity: SocialPartsByIdentity | undefined
  readonly legacyPart: Option.Option<IdentitySocialPart>
  readonly mainIdentity: PublicKeyPemBase64
}): SocialPartsByIdentity =>
  socialPartsByIdentity ??
  Option.match(legacyPart, {
    onNone: () => Record.empty(),
    onSome: (part) => Record.singleton(mainIdentity, part),
  })

export const withoutIdentities = (
  parts: SocialPartsByIdentity,
  identities: readonly PublicKeyPemBase64[]
): SocialPartsByIdentity =>
  Record.filter(parts, (_, identity) => !Array.contains(identities, identity))
