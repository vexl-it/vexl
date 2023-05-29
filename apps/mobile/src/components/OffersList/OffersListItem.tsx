import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '../../state/marketplace/domain'
import {Stack} from 'tamagui'
import OfferWithBubbleTip from '../OfferWithBubbleTip'
import {useMemo} from 'react'
import {type Atom, useAtomValue} from 'jotai'
import {useChatForOffer} from '../../state/chat/hooks/useChatForOffer'

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

  // TODO make this more performant
  const chatForOffer = useChatForOffer({
    offerPublicKey: offer.offerInfo.publicPart.offerPublicKey,
  })

  return (
    <Stack mt={'$6'}>
      <OfferWithBubbleTip
        button={
          <Button
            size={'medium'}
            text={
              isMine
                ? t('myOffers.editOffer')
                : chatForOffer
                ? t('common.requested')
                : t('common.request')
            }
            variant={
              isMine ? 'primary' : chatForOffer ? 'primary' : 'secondary'
            }
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
