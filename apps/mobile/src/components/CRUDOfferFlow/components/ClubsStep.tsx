import {useNavigation} from '@react-navigation/native'
import {Button, EditRow} from '@vexl-next/ui'
import {YStack} from '@vexl-next/ui/src/primitives'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ClubItem from './ClubItem'

interface Props {
  readonly onOfferCreated: () => void
}

function ClubsStep({onOfferCreated}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'CRUDOfferFlow'>['navigation']>()
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
            if (success) {
              onOfferCreated()
              navigation.popTo('InsideTabs', {
                screen: 'Marketplace',
                params: {initialTab: 'myOffers'},
              })
            }
          })
        }}
      >
        {t('offerForm.publishOffer')}
      </Button>
    </YStack>
  )
}

export default ClubsStep
