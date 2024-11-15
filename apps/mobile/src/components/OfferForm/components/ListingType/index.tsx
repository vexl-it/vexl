import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SvgImage from '../../../Image'
import Tabs from '../../../Tabs'
import infoSvg from '../../../images/infoSvg'
import useContent from './useContent'

interface Props {
  inEditOffer?: boolean
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  updateListingTypeActionAtom: WritableAtom<
    null,
    [listingType: ListingType],
    void
  >
  onTabPress?: () => void
}

function ListingTypeSection({
  inEditOffer,
  listingTypeAtom,
  updateListingTypeActionAtom,
  onTabPress,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()
  const listingType = useAtomValue(listingTypeAtom)
  const updateListingType = useSetAtom(updateListingTypeActionAtom)

  return (
    <Stack>
      {!!inEditOffer && !listingType && (
        <XStack ai="center" gap="$2" mb="$2">
          <SvgImage source={infoSvg} fill={getTokens().color.red.val} />
          <Text fos={12} col="$red" ff="$body600">
            {t('offerForm.errorListingTypeNotFilled')}
          </Text>
        </XStack>
      )}
      <Tabs
        activeTab={listingType}
        onTabPress={(type) => {
          updateListingType(type)
          if (onTabPress) onTabPress()
        }}
        tabs={content}
      />
    </Stack>
  )
}

export default ListingTypeSection
