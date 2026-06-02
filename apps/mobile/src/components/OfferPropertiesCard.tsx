import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
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
  getLocationLabels,
  getPaymentMethodLabel,
} from '../utils/offerHelpers'

function DetailRow({
  label,
  value,
  numberOfLines,
}: {
  readonly label: string
  readonly value: string | readonly string[]
  readonly numberOfLines?: number
}): React.ReactElement {
  return (
    <XStack alignItems="flex-start" gap="$5">
      <Typography
        variant="micro"
        color="$foregroundSecondary"
        flexShrink={0}
        numberOfLines={1}
      >
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          textAlign="right"
          flex={1}
          numberOfLines={numberOfLines}
        >
          {value}
        </Typography>
      ) : (
        <YStack flex={1} gap="$2">
          {pipe(
            value,
            Array.map((line, i) => (
              <Typography
                key={i}
                variant="descriptionBold"
                color="$foregroundPrimary"
                textAlign="right"
              >
                {i < value.length - 1 ? `${line},` : line}
              </Typography>
            ))
          )}
        </YStack>
      )}
    </XStack>
  )
}

export default function OfferPropertiesCard({
  offer,
  minimalContainer,
}: {
  readonly offer: OneOfferInState
  readonly minimalContainer?: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {
    feeAmount,
    expirationDate,
    listingType,
    productCategory,
    productCategories,
  } = offer.offerInfo.publicPart
  const getAmountLabel = useSetAtom(getAmountLabelActionAtom)

  const rows = useMemo(() => {
    const productCategoryToDisplay =
      listingType === 'PRODUCT'
        ? (pipe(productCategories ?? [], Array.head, Option.getOrUndefined) ??
          productCategory)
        : undefined

    return pipe(
      [
        {
          label: t('editOffer.detail.productCategory'),
          value: productCategoryToDisplay
            ? t(`filterOffers.productCategory.${productCategoryToDisplay}`)
            : '',
        },
        {
          label: t('offerForm.amountOfTransaction.amountOfTransaction'),
          value: getAmountLabel(offer),
        },
        {
          label: t('offerForm.premiumOrDiscount.premiumOrDiscount'),
          value: getOfferFeeLabel({
            feeAmount,
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
          value: getLocationLabels(offer),
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
    listingType,
    locale,
    offer,
    productCategories,
    productCategory,
    t,
  ])

  if (!Array.isNonEmptyArray(rows)) return null

  const content = pipe(
    rows,
    Array.map((row) => (
      <DetailRow
        key={row.label}
        label={row.label}
        value={row.value}
        numberOfLines={row.numberOfLines}
      />
    ))
  )

  return minimalContainer ? (
    <YStack gap="$5">{content}</YStack>
  ) : (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      py="$4"
      px="$6"
      gap="$5"
    >
      {content}
    </YStack>
  )
}
