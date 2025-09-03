import {useNavigation} from '@react-navigation/native'
import {HashSet} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Stack, type YStackProps} from 'tamagui'
import {
  markRemovedClubAsHiddenForVexlbotActionAtom,
  removedClubsAtom,
} from '../../../../../state/clubs/atom/removedClubsAtom'
import {alreadyImpotedContactsAtom} from '../../../../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

export default function RemovedClubsSuggestion(
  props: YStackProps
): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const removedClubs = useAtomValue(removedClubsAtom)
  const markRemovedClubAsHiddenForVexlbot = useSetAtom(
    markRemovedClubAsHiddenForVexlbotActionAtom
  )

  const alreadyImpotedContacts = useAtomValue(alreadyImpotedContactsAtom)

  if (alreadyImpotedContacts) return null

  return (
    <>
      <Stack gap="$2">
        {removedClubs.map((club) =>
          !club.hiddenForVexlbot ? (
            <MarketplaceSuggestion
              key={club.clubInfo.uuid}
              buttonText={t('postLoginFlow.importContactsButton')}
              onButtonPress={() => {
                markRemovedClubAsHiddenForVexlbot(club.clubInfo.uuid)
                navigation.navigate('SetContacts')
              }}
              type="info"
              text={t('clubs.clubStatsSuggestionMessage', {
                clubName: club.clubInfo.name,
                offersCount: HashSet.size(club.stats.allOffersIdsForClub),
                chatsCount: HashSet.size(club.stats.allChatsIdsForClub),
              })}
              {...props}
            />
          ) : null
        )}
      </Stack>
    </>
  )
}
