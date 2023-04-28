import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '../../state/marketplace/domain'
import {Stack} from 'tamagui'
import OfferWithBubbleTip from '../OfferWithBubbleTip'
import {useMemo} from 'react'

interface Props {
  readonly offer: OneOfferInState
}

function OffersListItem({offer}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const isMine = useMemo(
    () => !!offer.ownershipInfo?.adminId,
    [offer.ownershipInfo?.adminId]
  )

  return (
    <Stack mt={'$6'}>
      <OfferWithBubbleTip
        ofMyOffers
        button={
          <Button
            size={'medium'}
            text={isMine ? t('myOffers.editOffer') : t('common.request')}
            variant={isMine ? 'primary' : 'secondary'}
            onPress={() => {
              navigation.navigate(isMine ? 'EditOffer' : 'OfferDetail', {
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

export default OffersListItem
