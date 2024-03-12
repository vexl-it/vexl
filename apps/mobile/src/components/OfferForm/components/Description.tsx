import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {
  useAtom,
  useAtomValue,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {useMemo} from 'react'
import {Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Input from '../../Input'

const MAX_INPUT_LENGTH_BTC_LISTING = 140
const MAX_INPUT_LENGTH_PRODUCT_OTHER_LISTING = 500

interface Props {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  offerTypeAtom: PrimitiveAtom<OfferType | undefined>
  offerDescriptionAtom: WritableAtom<string, [SetStateAction<string>], void>
}

function Description({
  listingTypeAtom,
  offerTypeAtom,
  offerDescriptionAtom,
}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const [offerDescription, setOfferDescription] = useAtom(offerDescriptionAtom)
  const listingType = useAtomValue(listingTypeAtom)
  const offerType = useAtomValue(offerTypeAtom)

  const subtitle = useMemo(() => {
    if (listingType === 'PRODUCT') {
      return offerType === 'SELL'
        ? t('offerForm.description.moreAboutYourItem')
        : t('offerForm.description.whatAreYouLookingFor')
    }
    if (listingType === 'OTHER') {
      return offerType === 'SELL'
        ? t('offerForm.description.moreAboutYourOffer')
        : t('offerForm.moreAboutYourRequest')
    }
    return t('offerForm.description.writeWhyPeopleShouldTake')
  }, [listingType, offerType, t])

  return (
    <YStack>
      <Text ff="$body600" fos={16} col="$greyOnBlack">
        {subtitle}
      </Text>
      <Stack mt="$4" br="$4" p="$4" bc="$grey">
        <Input
          maxLength={
            listingType === 'BITCOIN'
              ? MAX_INPUT_LENGTH_BTC_LISTING
              : MAX_INPUT_LENGTH_PRODUCT_OTHER_LISTING
          }
          multiline
          textAlignVertical="top"
          numberOfLines={5}
          variant="transparentOnGrey"
          value={offerDescription}
          onChangeText={setOfferDescription}
        />
        <Stack ai="flex-end">
          <Text col="$white" fos={16} ff="$body600">{`${
            offerDescription.length
          }/${
            listingType === 'BITCOIN'
              ? MAX_INPUT_LENGTH_BTC_LISTING
              : MAX_INPUT_LENGTH_PRODUCT_OTHER_LISTING
          }`}</Text>
        </Stack>
      </Stack>
    </YStack>
  )
}

export default Description
