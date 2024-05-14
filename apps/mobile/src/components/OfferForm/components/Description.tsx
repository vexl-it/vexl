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
import {Platform} from 'react-native'
import {Stack, Text, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Input from '../../Input'

const MAX_INPUT_LENGTH = 500

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
        ? t('offerForm.description.whatAreYouLookingFor')
        : t('offerForm.description.moreAboutYourItem')
    }
    if (listingType === 'OTHER') {
      return offerType === 'SELL'
        ? t('offerForm.description.tellSellersMoreAboutYourRequest')
        : t('offerForm.description.tellBuyersMoreAboutYourOffer')
    }
    return t('offerForm.description.writeWhyPeopleShouldTake')
  }, [listingType, offerType, t])

  return (
    <YStack>
      <Text ff="$body500" fos={16} col="$white">
        {subtitle}
      </Text>
      <Stack mt="$4" br="$4" p="$4" bc="$grey">
        <Input
          maxLength={MAX_INPUT_LENGTH}
          multiline
          textAlignVertical="top"
          numberOfLines={5}
          variant="transparentOnGrey"
          value={offerDescription}
          onChangeText={setOfferDescription}
          textColor="$main"
          cursorColor={getTokens().color.main.val}
          selectionColor={
            Platform.OS === 'ios'
              ? getTokens().color.main.val
              : 'rgba(252, 205, 108, 0.3)'
          }
        />
        <Stack ai="flex-end">
          <Text
            col="$greyOnBlack"
            fos={16}
            ff="$body600"
          >{`${offerDescription.length}/${MAX_INPUT_LENGTH}`}</Text>
        </Stack>
      </Stack>
    </YStack>
  )
}

export default Description
