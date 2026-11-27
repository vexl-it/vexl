import {BannerCarousel, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useAtom, useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {offersToSeeInMarketplaceAtom} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {userPhoneNumberAtom} from '../../../../../state/session/userDataAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'
import {
  getOpeningReachBannerPage,
  getPhonePrefixRegion,
  getReachBannerPages,
} from '../reachBannerPages'
import ReachBannerPageContent from './ReachBannerPageContent'

export default function ContactReachBanner(): React.JSX.Element {
  const {t} = useTranslation()
  const {offerStatsAtom, chosenReachBannerPageAtom} = useMolecule(
    contactSelectMolecule
  )
  const stats = useAtomValue(offerStatsAtom)
  const reach = useAtomValue(reachNumberAtom)
  const offersSeen = useAtomValue(offersToSeeInMarketplaceAtom).length
  const phone = useAtomValue(userPhoneNumberAtom)
  const region = getPhonePrefixRegion(phone)
  const countryOffers = pipe(
    stats ?? [],
    Array.findFirst((stat) => stat.countryPrefix === region?.prefix),
    Option.map((stat) => stat.count),
    Option.getOrUndefined
  )
  const [openingReach] = useState(reach)
  const pages = getReachBannerPages({
    reach: openingReach,
    countryOffers,
    offersSeen,
  })
  const [chosenPage, setChosenPage] = useAtom(chosenReachBannerPageAtom)
  const activePage =
    chosenPage !== undefined && Array.contains(pages, chosenPage)
      ? chosenPage
      : getOpeningReachBannerPage(openingReach, pages)

  return (
    <Stack pb="$4">
      <BannerCarousel
        activeKey={activePage}
        onActiveKeyChange={(key) => {
          const page = Array.findFirst(pages, (candidate) => candidate === key)
          if (Option.isSome(page)) setChosenPage(page.value)
        }}
        pages={Array.map(pages, (page) => ({
          key: page,
          label: t(
            page === 'offers'
              ? 'contactPreferences.reachBanner.offersLabelRegion'
              : page === 'network'
                ? 'contactPreferences.reachBanner.networkTitle'
                : 'account.reachStats.title'
          ),
          content: (
            <ReachBannerPageContent
              page={page}
              country={region?.country}
              countryOffers={countryOffers}
              offersSeen={offersSeen}
              reach={reach}
            />
          ),
        }))}
      />
    </Stack>
  )
}
