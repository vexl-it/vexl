import {Avatar, Button, EditRow, SelectClubCell} from '@vexl-next/ui'
import {YStack} from '@vexl-next/ui/src/primitives'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {
  type Atom,
  type SetStateAction,
  useAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import React, {useMemo} from 'react'
import {clubsWithMembersAtomsAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

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

function ClubsStep(): React.JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)
  const {createOfferActionAtom, createSelectClubAtom} =
    useMolecule(offerFormMolecule)
  const createOffer = useSetAtom(createOfferActionAtom)

  return (
    <YStack gap="$5">
      {clubsWithMembersAtoms.length > 0 ? (
        <YStack gap="$4">
          <EditRow
            state="initial"
            headline={t('offerForm.publishToVexlClub')}
          />
          <YStack gap="$3">
            {clubsWithMembersAtoms.map((clubWithMembersAtom) => (
              <ClubItem
                key={atomKeyExtractor(clubWithMembersAtom)}
                clubWithMembersAtom={clubWithMembersAtom}
                createSelectClubAtom={createSelectClubAtom}
              />
            ))}
          </YStack>
        </YStack>
      ) : null}
      <Button
        variant="primary"
        size="large"
        onPress={() => {
          void Effect.runPromise(createOffer()).then((success) => {
            if (success) safeGoBack()
          })
        }}
      >
        {t('offerForm.publishOffer')}
      </Button>
    </YStack>
  )
}

export default ClubsStep
