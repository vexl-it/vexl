import {type TranslationKey} from '@vexl-next/localization/src/translations'
import {Array} from 'effect'
import {type TFunction} from './localization/I18nProvider'
import {type OtherPersonRole} from './otherPersonRole'

const roleLabelKeys: Record<OtherPersonRole, TranslationKey> = {
  seller: 'commonFriends.seller',
  buyer: 'commonFriends.buyer',
  otherPerson: 'common.otherSide',
}

const trustedFriendsLineKeys: Record<OtherPersonRole, TranslationKey> = {
  seller: 'commonFriends.trustedFriendsWithSeller',
  buyer: 'commonFriends.trustedFriendsWithBuyer',
  otherPerson: 'commonFriends.trustedFriendsWithOtherPerson',
}

const trustedFriendsDescriptionKeys: Record<OtherPersonRole, TranslationKey> = {
  seller: 'commonFriends.trustedFriendsDescriptionSeller',
  buyer: 'commonFriends.trustedFriendsDescriptionBuyer',
  otherPerson: 'commonFriends.trustedFriendsDescriptionOtherPerson',
}

const otherCommonFriendsDescriptionKeys: Record<
  OtherPersonRole,
  TranslationKey
> = {
  seller: 'commonFriends.otherCommonFriendsDescriptionSeller',
  buyer: 'commonFriends.otherCommonFriendsDescriptionBuyer',
  otherPerson: 'commonFriends.otherCommonFriendsDescriptionOtherPerson',
}

const explanationCaptionKeys: Record<OtherPersonRole, TranslationKey> = {
  seller: 'commonFriends.trustedFriendsExplanation.captionSeller',
  buyer: 'commonFriends.trustedFriendsExplanation.captionBuyer',
  otherPerson: 'commonFriends.trustedFriendsExplanation.captionOtherPerson',
}

export function formatTrustedFriendsNames(
  names: Array.NonEmptyReadonlyArray<string>,
  t: TFunction
): string {
  const [first, second, ...others] = names
  if (second === undefined) return first
  if (!Array.isNonEmptyArray(others))
    return t('commonFriends.twoNames', {first, second})
  return t('commonFriends.twoNamesAndOthers', {
    first,
    second,
    count: others.length,
  })
}

export function trustedFriendsLine({
  names,
  role,
  t,
}: {
  readonly names: readonly string[]
  readonly role: OtherPersonRole
  readonly t: TFunction
}): string | undefined {
  if (!Array.isNonEmptyReadonlyArray(names)) return undefined
  return t(trustedFriendsLineKeys[role], {
    names: formatTrustedFriendsNames(names, t),
    count: names.length,
  })
}

export function trustedFriendsCountText(
  count: number,
  t: TFunction
): string | undefined {
  return count > 0 ? t('commonFriends.trustedCount', {count}) : undefined
}

export function otherPersonRoleLabel(
  role: OtherPersonRole,
  t: TFunction
): string {
  return t(roleLabelKeys[role])
}

export function trustedFriendsDescription(
  role: OtherPersonRole,
  t: TFunction
): string {
  return t(trustedFriendsDescriptionKeys[role])
}

export function otherCommonFriendsDescription(
  role: OtherPersonRole,
  t: TFunction
): string {
  return t(otherCommonFriendsDescriptionKeys[role])
}

export function trustedFriendsExplanationCaption({
  name,
  role,
  t,
}: {
  readonly name: string
  readonly role: OtherPersonRole
  readonly t: TFunction
}): string {
  return t(explanationCaptionKeys[role], {name})
}
