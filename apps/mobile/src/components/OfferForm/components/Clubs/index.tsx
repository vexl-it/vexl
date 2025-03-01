import {useAtomValue} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Text, XStack, YStack} from 'tamagui'
import {type CRUDOfferStackScreenProps} from '../../../../navigationTypes'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {clubsWithMembersAtomsAtom} from '../../../CRUDOfferFlow/atoms/clubsWithMembersAtom'
import ClubItem from './components/ClubItem'

interface Props {
  navigation: CRUDOfferStackScreenProps<'FriendLevelScreen'>['navigation']
}

function ClubsComponent({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  return (
    <YStack>
      <XStack ai="center" jc="space-between">
        <Text fos={16} col="$greyOnBlack" ff="$body500">
          {t('clubs.pickTheClubThatInterestsYou')}
        </Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Faqs', {
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
      </XStack>
      <YStack mt="$4" gap="$2">
        {clubsWithMembersAtoms.map((one) => (
          <ClubItem key={atomKeyExtractor(one)} clubWithMembersAtom={one} />
        ))}
      </YStack>
    </YStack>
  )
}

export default ClubsComponent
