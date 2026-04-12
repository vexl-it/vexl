import {Avatar, SelectClubCell} from '@vexl-next/ui'
import {
  type Atom,
  type SetStateAction,
  useAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import React, {useMemo} from 'react'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'

interface ClubItemProps {
  readonly clubWithMembersAtom: Atom<ClubWithMembers>
  readonly createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

function ClubItem({
  clubWithMembersAtom,
  createSelectClubAtom,
}: ClubItemProps): React.JSX.Element {
  const {t} = useTranslation()
  const {club, members} = useAtomValue(clubWithMembersAtom)
  const localizeDecimalNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const membersCount = localizeDecimalNumber({number: members.length})
  const selectClubAtom = useMemo(
    () => createSelectClubAtom(clubWithMembersAtom),
    [clubWithMembersAtom, createSelectClubAtom]
  )
  const [selected, setSelected] = useAtom(selectClubAtom)

  return (
    <SelectClubCell
      name={club.name}
      description={t('clubs.members', {membersCount})}
      selected={selected}
      avatar={
        <Avatar
          size="small"
          customSize={40}
          source={club.clubImageUrl ? {uri: club.clubImageUrl} : undefined}
        />
      }
      onPress={() => {
        setSelected((value) => !value)
      }}
    />
  )
}

export default ClubItem
