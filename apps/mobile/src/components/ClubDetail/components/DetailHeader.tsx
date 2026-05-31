import {
  ArrowsHorizontal,
  PeopleUsers,
  SandWatch,
  Stack,
  Typography,
  XStack,
  YStack,
  useTheme,
  type IconProps,
} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Image} from 'tamagui'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatDate, formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'

function ClubStatItem({
  icon: Icon,
  label,
}: {
  readonly icon: (props: IconProps) => React.JSX.Element
  readonly label: string
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack alignItems="center" gap="$1" flexShrink={0} height={18}>
      <Stack width={16} height={18} alignItems="center" justifyContent="center">
        <Icon size={16} color={theme.foregroundSecondary.get()} />
      </Stack>
      <Typography variant="micro" color="$foregroundSecondary" lineHeight={18}>
        {label}
      </Typography>
    </XStack>
  )
}

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
        <Stack
          width={48}
          height={48}
          borderRadius="$3"
          overflow="hidden"
          backgroundColor="$accentYellowSecondary"
        >
          <Image source={{uri: club.clubImageUrl}} width="100%" height="100%" />
        </Stack>
        <YStack flex={1} gap="$1">
          <Typography
            variant="tabSmallBold"
            color="$foregroundPrimary"
            numberOfLines={2}
          >
            {club.name}
          </Typography>
          <XStack gap="$2" rowGap="$1" flexWrap="wrap" alignItems="center">
            <ClubStatItem
              icon={PeopleUsers}
              label={t('clubs.members', {membersCount})}
            />
            <ClubStatItem
              icon={ArrowsHorizontal}
              label={t('clubs.offersFormatted', {
                localizedString: formatInteger(offersCount, locale),
              })}
            />
            <ClubStatItem
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
