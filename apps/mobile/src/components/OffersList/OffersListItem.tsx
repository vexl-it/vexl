import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '../../state/marketplace/domain'
import {Stack} from 'tamagui'
import OfferWithBubbleTip from '../OfferWithBubbleTip'
import {useMemo} from 'react'
import {type Atom, useAtomValue} from 'jotai'

interface Props {
  readonly offerAtom: Atom<OneOfferInState>
}

function OffersListItem({offerAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const offer = useAtomValue(offerAtom)

  const isMine = useMemo(
    () => !!offer.ownershipInfo?.adminId,
    [offer.ownershipInfo?.adminId]
  )

  return (
    <Stack mt={'$6'}>
      <OfferWithBubbleTip
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
