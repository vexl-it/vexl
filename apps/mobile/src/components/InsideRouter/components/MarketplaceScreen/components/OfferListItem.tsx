import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '../../../../../state/marketplace/domain'
import {Stack} from 'tamagui'
import OfferWithBubbleTip from '../../../../OfferWithBubbleTip'

interface Props {
  readonly offer: OneOfferInState
}

function OfferListItem({offer}: Props): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()

  return (
    <Stack mt="$6" mx="$2">
      <OfferWithBubbleTip
        button={
          <Button
            size={'small'}
            fontSize={14}
            text={t('common.request')}
            variant="secondary"
            onPress={() => {
              navigation.navigate('OfferDetail', {
                offerId: offer.offerInfo.offerId,
              })
            }}
          />
        }
        offer={offer}
      />
    </Stack>
  )
}

export default OfferListItem
