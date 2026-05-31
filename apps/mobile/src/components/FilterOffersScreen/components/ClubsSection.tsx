import {Avatar, SelectClubCell} from '@vexl-next/ui'
import {YStack} from '@vexl-next/ui/src/primitives'
import {useAtom, useAtomValue, type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {clubsWithMembersAtomsAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {createSelectClubInFilterAtom} from '../atom'

function FilterClubItem({
  clubWithMembersAtom,
}: {
  clubWithMembersAtom: Atom<ClubWithMembers>
}): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {club, members} = useAtomValue(clubWithMembersAtom)
  const selectAtom = useMemo(
    () => createSelectClubInFilterAtom(clubWithMembersAtom),
    [clubWithMembersAtom]
  )
  const [isSelected, setSelected] = useAtom(selectAtom)

  const membersCount = formatDecimal(members.length, locale)

  return (
    <SelectClubCell
      name={club.name}
      description={t('clubs.members', {membersCount})}
      selected={isSelected}
      avatar={
        <Avatar
          size="small"
          customSize={40}
          source={{uri: club.clubImageUrl}}
        />
      }
      onPress={() => {
        setSelected(!isSelected)
      }}
    />
  )
}

function ClubsSection(): React.ReactElement | null {
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  if (clubsWithMembersAtoms.length === 0) return null

  return (
    <YStack gap="$3">
      {clubsWithMembersAtoms.map((one) => (
        <FilterClubItem key={atomKeyExtractor(one)} clubWithMembersAtom={one} />
      ))}
    </YStack>
  )
}

export default ClubsSection
