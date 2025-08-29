import {Option, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import OffersList from '../OffersList'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {useClubOffersAtoms} from './state'

type Props = RootStackScreenProps<'ClubOffers'>

export function ClubOffersScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const {clubOfferAtomAtoms, singleClubAtom} = useClubOffersAtoms(
    route.params.clubUuid
  )
  const {t} = useTranslation()

  const offersAtom = useAtomValue(clubOfferAtomAtoms)
  const club = useAtomValue(singleClubAtom)

  return (
    <Screen>
      <YStack f={1}>
        <Stack mx="$4" my="$4">
          <ScreenTitle
            withBackButton
            text={`${pipe(
              club,
              Option.map((club) => club.club.name),
              Option.getOrElse(() => t('filterOffers.offers'))
            )}`}
          >
            <Text></Text>
          </ScreenTitle>
        </Stack>
        <Stack mx="$2" f={1}>
          <OffersList offersAtoms={offersAtom} />
        </Stack>
      </YStack>
    </Screen>
  )
}
