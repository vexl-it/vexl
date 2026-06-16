import {
  type MyOfferInState,
  type OfferAdminId,
} from '@vexl-next/domain/src/general/offers'
import {RowCheckbox, ScrollView, Typography, YStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {type PrimitiveAtom, useAtom, useSetAtom} from 'jotai'
import React from 'react'
import {
  type TFunction,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {
  getAmountLabelActionAtom,
  getIsOffering,
} from '../../../utils/offerHelpers'

const MAX_LIST_HEIGHT = 360

function getOfferTitle({
  amountLabel,
  offer,
  t,
}: {
  readonly amountLabel: string
  readonly offer: MyOfferInState
  readonly t: TFunction
}): string {
  const {listingType, offerType} = offer.offerInfo.publicPart
  const directionLabel = getIsOffering(listingType, offerType)
    ? t('marketplace.iHave')
    : t('marketplace.iWant')

  return `${directionLabel} ${amountLabel}`
}

function OfferSelectionRow({
  offer,
  selectedOfferAdminIdsAtom,
}: {
  readonly offer: MyOfferInState
  readonly selectedOfferAdminIdsAtom: PrimitiveAtom<readonly OfferAdminId[]>
}): React.ReactElement {
  const {t} = useTranslation()
  const [selectedOfferAdminIds, setSelectedOfferAdminIds] = useAtom(
    selectedOfferAdminIdsAtom
  )
  const getAmountLabel = useSetAtom(getAmountLabelActionAtom)
  const amountLabel = getAmountLabel(offer)
  const selected = pipe(
    selectedOfferAdminIds,
    Array.contains(offer.ownershipInfo.adminId)
  )

  return (
    <RowCheckbox
      label={getOfferTitle({amountLabel, offer, t})}
      description={offer.offerInfo.publicPart.offerDescription}
      checked={selected}
      onCheckedChange={(checked) => {
        setSelectedOfferAdminIds((previous) => {
          if (checked) {
            return pipe(
              previous,
              Array.append(offer.ownershipInfo.adminId),
              Array.dedupe
            )
          }

          return pipe(
            previous,
            Array.filter((adminId) => adminId !== offer.ownershipInfo.adminId)
          )
        })
      }}
    />
  )
}

export function SelectOffersToPublishToClubComponent({
  offers,
  selectedOfferAdminIdsAtom,
}: {
  readonly offers: readonly MyOfferInState[]
  readonly selectedOfferAdminIdsAtom: PrimitiveAtom<readonly OfferAdminId[]>
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <YStack gap="$3">
      <Typography variant="paragraph" color="$foregroundSecondary">
        {t('clubs.publishOffersToJoinedClub.description')}
      </Typography>
      <ScrollView
        maxHeight={MAX_LIST_HEIGHT}
        showsVerticalScrollIndicator={Array.length(offers) > 3}
      >
        <YStack gap="$3">
          {pipe(
            offers,
            Array.map((offer) => (
              <OfferSelectionRow
                key={offer.ownershipInfo.adminId}
                offer={offer}
                selectedOfferAdminIdsAtom={selectedOfferAdminIdsAtom}
              />
            ))
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
