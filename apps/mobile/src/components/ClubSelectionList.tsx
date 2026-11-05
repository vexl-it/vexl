import {Avatar, SelectClubCell, YStack} from '@vexl-next/ui'
import {
  useAtom,
  useAtomValue,
  type Atom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import React, {useMemo} from 'react'
import {clubsWithMembersAtomsAtom} from '../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../state/clubs/domain'
import atomKeyExtractor from '../utils/atomUtils/atomKeyExtractor'
import {formatDecimal} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../utils/localization/I18nProvider'

type CreateSelectClubAtom = (
  clubWithMembersAtom: Atom<ClubWithMembers>
) => WritableAtom<boolean, [SetStateAction<boolean>], void>

interface ClubSelectionListProps {
  readonly createSelectClubAtom: CreateSelectClubAtom
}

function ClubSelectionItem({
  clubWithMembersAtom,
  createSelectClubAtom,
}: ClubSelectionListProps & {
  readonly clubWithMembersAtom: Atom<ClubWithMembers>
}): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {club, members} = useAtomValue(clubWithMembersAtom)
  const selectClubAtom = useMemo(
    () => createSelectClubAtom(clubWithMembersAtom),
    [clubWithMembersAtom, createSelectClubAtom]
  )
  const [selected, setSelected] = useAtom(selectClubAtom)

  return (
    <SelectClubCell
      name={club.name}
      description={t('clubs.members', {
        membersCount: formatDecimal(members.length, locale),
      })}
      selected={selected}
      avatar={
        <Avatar
          size="$9"
          source={club.clubImageUrl ? {uri: club.clubImageUrl} : undefined}
        />
      }
      onPress={() => {
        setSelected((value) => !value)
      }}
    />
  )
}

function ClubSelectionList({
  createSelectClubAtom,
}: ClubSelectionListProps): React.JSX.Element | null {
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  if (clubsWithMembersAtoms.length === 0) return null

  return (
    <YStack gap="$3">
      {clubsWithMembersAtoms.map((clubWithMembersAtom) => (
        <ClubSelectionItem
          key={atomKeyExtractor(clubWithMembersAtom)}
          clubWithMembersAtom={clubWithMembersAtom}
          createSelectClubAtom={createSelectClubAtom}
        />
      ))}
    </YStack>
  )
}

export default ClubSelectionList
