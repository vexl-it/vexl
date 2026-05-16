import {ChevronLeft, NavigationBar, Screen, Stack} from '@vexl-next/ui'
import {Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {loadingStateAtom} from '../../state/marketplace/atoms/loadingState'
import {refreshOffersActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import OffersList from '../OffersList'
import {useClubOffersAtoms} from './state'

type Props = RootStackScreenProps<'ClubOffers'>

export function ClubOffersScreen({route}: Props): React.ReactElement {
  const {clubOfferAtomAtoms, singleClubAtom} = useClubOffersAtoms(
    route.params.clubUuid
  )
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const offersAtom = useAtomValue(clubOfferAtomAtoms)
  const club = useAtomValue(singleClubAtom)
  const loadingOffers = useAtomValue(loadingStateAtom).state === 'inProgress'
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const title = pipe(
    club,
    Option.map((club) => club.club.name),
    Option.getOrElse(() => t('filterOffers.offers'))
  )

  return (
    <Screen
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={title}
          leftAction={{
            icon: ChevronLeft,
            onPress: safeGoBack,
          }}
        />
      }
    >
      <Stack f={1}>
        <OffersList
          offersAtoms={offersAtom}
          onRefresh={refreshOffers}
          refreshing={loadingOffers}
        />
      </Stack>
    </Screen>
  )
}
