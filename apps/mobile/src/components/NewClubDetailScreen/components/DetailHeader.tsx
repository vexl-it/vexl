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
import {useSetAtom} from 'jotai'
import React from 'react'
import {Image} from 'tamagui'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
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
  const localizeDecimalNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const membersCount = localizeDecimalNumber({
    number: members.length,
  })
  const expirationDate = club.validUntil.toLocaleDateString()

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
              label={t('clubs.offers', {count: offersCount})}
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
