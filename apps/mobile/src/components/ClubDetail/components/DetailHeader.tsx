import {
  ArrowsHorizontal,
  Avatar,
  IconLabel,
  PeopleUsers,
  SandWatch,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatDate, formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'

export function DetailHeader({
  clubWithMembers,
  offersCount,
}: {
  readonly clubWithMembers: ClubWithMembers
  readonly offersCount: number
}): React.JSX.Element {
  const {club, members} = clubWithMembers
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const localizeDecimalNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const membersCount = localizeDecimalNumber({
    number: members.length,
  })
  const expirationDate = formatDate(club.validUntil, locale)

  return (
    <YStack gap="$6">
      <XStack gap="$3" alignItems="center">
        <Avatar size="medium" source={{uri: club.clubImageUrl}} />
        <YStack flex={1} gap="$1">
          <Typography
            variant="tabSmallBold"
            color="$foregroundPrimary"
            numberOfLines={2}
          >
            {club.name}
          </Typography>
          <XStack gap="$2" rowGap="$1" flexWrap="wrap" alignItems="center">
            <IconLabel
              flexShrink={0}
              icon={PeopleUsers}
              label={t('clubs.members', {membersCount})}
            />
            <IconLabel
              flexShrink={0}
              icon={ArrowsHorizontal}
              label={t('clubs.offersFormatted', {
                localizedString: formatInteger(offersCount, locale),
              })}
            />
            <IconLabel
              flexShrink={0}
              icon={SandWatch}
              label={t('clubs.expiresOn', {expirationDate})}
            />
          </XStack>
        </YStack>
      </XStack>

      {Option.match(club.description, {
        onNone: () => null,
        onSome: (description) => (
          <Typography mx="$3" variant="description" color="$foregroundPrimary">
            {description}
          </Typography>
        ),
      })}
    </YStack>
  )
}
