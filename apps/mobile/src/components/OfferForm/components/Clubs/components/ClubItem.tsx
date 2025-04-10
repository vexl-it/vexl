import {type Atom, useAtomValue, type WritableAtom} from 'jotai'
import {type SetStateAction} from 'react'
import {Stack, Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type ClubWithMembers} from '../../../../CRUDOfferFlow/atoms/clubsWithMembersAtom'
import {ImageUniversal} from '../../../../Image'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  clubWithMembersAtom: Atom<ClubWithMembers>
  createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

function ClubItem({
  clubWithMembersAtom,
  createSelectClubAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const {club, members} = useAtomValue(clubWithMembersAtom)
  const membersCount = members.length

  return (
    <XStack ai="center" jc="space-between">
      <XStack fs={1} gap="$4">
        <Stack als="center" my="$2" mr="$2">
          <ImageUniversal
            width={48}
            height={48}
            style={{borderRadius: 12}}
            source={{type: 'imageUri', imageUri: club.clubImageUrl}}
          />
        </Stack>
        <YStack
          fs={1}
          ai="flex-start"
          jc="center"
          flexWrap="wrap"
          flexShrink={1}
          gap="$2"
        >
          <Text fos={18} ff="$body500" col="$white">
            {club.name}
          </Text>
          <Text fos={14} ff="$body500" col="$greyOnBlack">
            {t('clubs.members', {membersCount})}
          </Text>
        </YStack>
      </XStack>
      <IsSelectedCheckbox
        createSelectClubAtom={createSelectClubAtom}
        clubWithMembersAtom={clubWithMembersAtom}
      />
    </XStack>
  )
}

export default ClubItem
