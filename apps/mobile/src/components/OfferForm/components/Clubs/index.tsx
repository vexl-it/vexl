import {
  type Atom,
  type SetStateAction,
  useAtomValue,
  type WritableAtom,
} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {getTokens, Text, XStack, YStack} from 'tamagui'
import {type CRUDOfferStackScreenProps} from '../../../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../../../state/clubs/domain'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Image from '../../../Image'
import clubsSvg from '../../../images/clubsSvg'

import ClubItem from './components/ClubItem'

interface OfferFormProps {
  form: 'OfferForm'
  navigation: CRUDOfferStackScreenProps<'FriendLevelScreen'>['navigation']
  createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

interface FilterFormProps {
  form: 'FilterForm'
  createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

type Props = OfferFormProps | FilterFormProps

function ClubsComponent(props: Props): JSX.Element | null {
  const {t} = useTranslation()
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  if (clubsWithMembersAtoms.length === 0) return null

  return (
    <YStack>
      <XStack ai="center" jc="space-between">
        <YStack f={1} gap="$2">
          <XStack f={1} ai="center" jc="space-between">
            <XStack gap="$2" ai="center">
              <Image
                height={24}
                width={24}
                stroke={getTokens().color.white.val}
                source={clubsSvg}
              />
              <Text numberOfLines={2} ff="$body700" col="$white" fos={24}>
                {t('clubs.vexlClubs')}
              </Text>
            </XStack>
          </XStack>
          <Text fos={16} col="$greyOnBlack" ff="$body500">
            {t('clubs.pickTheClubsThatInterestsYou')}
          </Text>
        </YStack>
        {props.form === 'OfferForm' && (
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
