import {
  type Atom,
  type SetStateAction,
  useAtomValue,
  type WritableAtom,
} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Text, XStack, YStack} from 'tamagui'
import {type CRUDOfferStackScreenProps} from '../../../../navigationTypes'
import {
  clubsWithMembersAtomsAtom,
  type ClubWithMembers,
} from '../../../../state/clubs/atom/clubsWithMembersAtom'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

import ClubItem from './components/ClubItem'

interface OfferFormProps {
  displayFaqsLink: true
  navigation: CRUDOfferStackScreenProps<'FriendLevelScreen'>['navigation']
  createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

interface FilterFormProps {
  displayFaqsLink: false
  createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

type Props = OfferFormProps | FilterFormProps

function ClubsComponent(props: Props): JSX.Element | null {
  const {t} = useTranslation()
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  return (
    <YStack>
      <XStack ai="center" jc="space-between">
        <Text fos={16} col="$greyOnBlack" ff="$body500">
          {t('clubs.pickTheClubsThatInterestsYou')}
        </Text>
        {!!props.displayFaqsLink && (
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate('Faqs', {
                pageType: 'WHAT_ARE_VEXL_CLUBS',
              })
            }}
          >
            <Text
              fos={16}
              ff="$body500"
              col="$main"
              textDecorationLine="underline"
            >
              {t('suggestion.whatAreClubs')}
            </Text>
          </TouchableOpacity>
        )}
      </XStack>
      <YStack mt="$4" gap="$2">
        {clubsWithMembersAtoms.map((one) => (
          <ClubItem
            key={atomKeyExtractor(one)}
            createSelectClubAtom={props.createSelectClubAtom}
            clubWithMembersAtom={one}
          />
        ))}
      </YStack>
    </YStack>
  )
}

export default ClubsComponent
