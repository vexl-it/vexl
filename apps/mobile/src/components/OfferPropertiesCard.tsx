import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {OfferPropertiesCard as OfferPropertiesCardView} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {
  formatOfferExpirationDate,
  getOfferFeeLabel,
} from '../utils/offerAmountDetails'
import {
  getAmountLabelActionAtom,
  getLanguagesLabel,
  getPaymentMethodLabel,
} from '../utils/offerHelpers'
import {offerLocationLabelsAtom} from '../utils/offerLocationLabelsAtom'

export default function OfferPropertiesCard({
  offer,
  minimalContainer,
}: {
  readonly offer: OneOfferInState
  readonly minimalContainer?: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {getFullLabels} = useAtomValue(offerLocationLabelsAtom)
  const {
    feeAmount,
    expirationDate,
    listingType,
    productCategory,
    productCategories,
  } = offer.offerInfo.publicPart
  const getAmountLabel = useSetAtom(getAmountLabelActionAtom)

  const rows = useMemo(() => {
    const productCategoryLabels =
      listingType === 'PRODUCT'
        ? pipe(
            productCategories ?? (productCategory ? [productCategory] : []),
            Array.map((category) =>
              t(`filterOffers.productCategory.${category}`)
            )
          )
        : []

    return pipe(
      [
        {
          label: t('editOffer.detail.productCategory'),
          value: productCategoryLabels,
        },
        {
          label: t('offerForm.amountOfTransaction.amountOfTransaction'),
          value: getAmountLabel(offer),
        },
        {
          label: t('offerForm.premiumOrDiscount.premiumOrDiscount'),
          value: getOfferFeeLabel({
            feeAmount,
            listingType,
            locale,
            t,
            spaceAroundSign: true,
          }),
        },
        {
          label: t('offerForm.expiration.expirationDate'),
          value: formatOfferExpirationDate(expirationDate, locale),
        },
        {
          label: t('offerForm.location.location'),
          value: getFullLabels(offer.offerInfo.publicPart.location),
        },
        {
          label: t('offerForm.paymentMethod.paymentMethod'),
          value: getPaymentMethodLabel(offer, {
            cash: t('offerForm.paymentMethod.cash'),
            bank: t('offerForm.paymentMethod.bank'),
            revolut: t('offerForm.paymentMethod.revolut'),
            lightning: t('offerForm.network.lightning'),
            onChain: t('offerForm.network.onChain'),
          }),
          numberOfLines: 1,
        },
        {
          label: t('offerForm.spokenLanguages.preferredLanguages'),
          value: getLanguagesLabel(offer),
        },
      ],
      Array.filter((row) => row.value.length > 0)
    )
  }, [
    expirationDate,
    feeAmount,
    getAmountLabel,
    getFullLabels,
    listingType,
    locale,
    offer,
    productCategory,
    productCategories,
    t,
  ])

  if (!Array.isNonEmptyArray(rows)) return null

  return (
    <OfferPropertiesCardView rows={rows} minimalContainer={minimalContainer} />
  )
}
